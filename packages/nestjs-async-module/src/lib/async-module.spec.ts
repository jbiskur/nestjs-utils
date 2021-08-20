import { AsyncModule, createAsyncModule } from "./async-module";
import {
  Controller,
  DynamicModule,
  INestApplication,
  Injectable,
  Module
} from "@nestjs/common";
import { AsyncOptions } from "./interfaces";
import { NestApplicationBuilder, TestModuleA } from "@jbiskur/nestjs-test-utilities";
import { createOptionsToken, ModuleOptions } from "./";

interface ExampleOptions {
  name: string;
}

const PROVIDER_OPTIONS_NAME = "EXAMPLE_OPTIONS_PROVIDER";

@Injectable()
class ExampleService {
  constructor(
    private readonly options: ModuleOptions<ExampleOptions>,
  ) {}

  testOptions() {
    return this.options.get().name;
  }
}

const EXAMPLE_MESSAGE = "hello world";

@Module({})
class ExampleAsyncModule extends AsyncModule {
  public static registerAsync<ExampleOptions>(
    options: AsyncOptions<ExampleOptions>,
  ): DynamicModule {
    return {
      ...this.doRegisterAsync<ExampleOptions>(
        ExampleAsyncModule,
        PROVIDER_OPTIONS_NAME,
        options,
        {
          providers: [ExampleService]
        },
      )
    };
  }
}

async function TestOptionsReturnMessage(app: INestApplication) {
  expect((await app.resolve(ExampleService)).testOptions()).toBe(
    EXAMPLE_MESSAGE,
  );
}

describe("Simple Async Module", () => {
  let dynamicModule;
  let app: INestApplication;

  beforeEach(async () => {
    app = await new NestApplicationBuilder()
      .withTestModule((testModule) =>
        testModule.withModule(
          ExampleAsyncModule.registerAsync({
            useFactory: () => ({ name: EXAMPLE_MESSAGE }),
          }),
        ),
      )
      .build();

    dynamicModule = app.get(ExampleAsyncModule);
  });

  afterEach(async () => {
    await app.close();
  });

  it("should be defined", async () => {
    expect(dynamicModule).toBeDefined();
  });

  it("should return hello world from service", async () => {
    await TestOptionsReturnMessage(app);
  });
});

@Controller()
class TestController {}

@Module({
  imports: [TestModuleA],
  providers: [ExampleService],
  exports: [ExampleService],
  controllers: [TestController],
})
class ExampleMetadataAsyncModule extends AsyncModule {
  public static registerAsync<ExampleOptions>(
    options: AsyncOptions<ExampleOptions>,
  ): DynamicModule {
    return {
      ...this.doRegisterAsync<ExampleOptions>(
        ExampleAsyncModule,
        PROVIDER_OPTIONS_NAME,
        options
      )
    };
  }
}

describe("Simple Async module using metadata and doRegisterAsync", () => {
  let dynamicModule;
  let app: INestApplication;
  let controller: TestController;
  let extraModule: TestModuleA;

  beforeEach(async () => {
    app = await new NestApplicationBuilder()
      .withTestModule((testModule) =>
        testModule.withModule(
          ExampleMetadataAsyncModule.registerAsync({
            useFactory: () => ({ name: EXAMPLE_MESSAGE }),
          }),
        ),
      )
      .build();

    dynamicModule = app.get(ExampleAsyncModule);
    controller = await app.resolve(TestController);
    extraModule = app.get(TestModuleA);
  });

  afterEach(async () => {
    await app.close();
  });

  it("should be defined", async () => {
    expect(dynamicModule).toBeDefined();
    expect(controller).toBeDefined();
    expect(extraModule).toBeDefined();
  });

  it("should return hello world from service", async () => {
    await TestOptionsReturnMessage(app);
  });
});

@Module({
  imports: [TestModuleA],
  providers: [ExampleService, ExampleAsyncModule],
  exports: [ExampleService],
  controllers: [TestController],
})
class ExampleMetadataOnly extends createAsyncModule<ExampleOptions>() {
  public static registerAsync(options: AsyncOptions<ExampleOptions>): DynamicModule {
    return super.registerAsync(options, ExampleMetadataOnly);
  }
}

describe("Simple Async module using only metadata", () => {
  let app: INestApplication;
  let controller: TestController;
  let exampleModule: ExampleService;
  let extraModule: TestModuleA;

  beforeEach(async () => {
    app = await new NestApplicationBuilder()
      .withTestModule((testModule) =>
        testModule.withModule(
          ExampleMetadataOnly.registerAsync({
            useFactory: () => ({ name: EXAMPLE_MESSAGE }),
          }),
        ),
      )
      .build();

    exampleModule = app.get(ExampleService);
    controller = await app.resolve(TestController);
    extraModule = app.get(TestModuleA);
  });

  afterEach(async () => {
    await app.close();
  });

  it("should be defined", async () => {
    expect(exampleModule).toBeDefined();
    expect(controller).toBeDefined();
    expect(extraModule).toBeDefined();
  });

  it("should return hello world from service", async () => {
    expect(exampleModule.testOptions()).toBe(
      EXAMPLE_MESSAGE,
    );
  });
});

@Injectable()
class MessageService {
  getMessage() {
    return "hello";
  }
}

@Injectable()
class ExampleHelloService {
  constructor(private readonly messageService: MessageService) {}

  sayHello() {
    return this.messageService.getMessage();
  }
}

@Module({
  providers: [MessageService],
  exports: [MessageService],
})
class ExternalModule {}

@Module({
  providers: [ExampleHelloService]
})
class NoOptionsModule extends createAsyncModule() {
  public static registerAsync(options: AsyncOptions<unknown>): DynamicModule {
    return super.registerAsync(options, NoOptionsModule);
  }
}

describe("Simple Async Module No Options", () => {
  let sut: ExampleHelloService;
  let app: INestApplication;

  beforeEach(async () => {
    app = await new NestApplicationBuilder()
      .withTestModule((testModule) =>
        testModule.withModule(
          NoOptionsModule.registerAsync({
            imports: [ExternalModule],
            inject: [MessageService]
          }),
        ),
      )
      .build();

    sut = await app.resolve(ExampleHelloService);
  });

  afterEach(async () => {
    await app.close();
  });

  it("should be defined", async () => {
    expect(sut).toBeDefined();
  });

  it("should return hello from service", async () => {
    expect(sut.sayHello()).toBe("hello");
  });
});

@Injectable()
class ExampleInlineService {
  constructor(private readonly hello: string) {}

  sayHello() {
    return this.hello;
  }
}

const optionsToken = createOptionsToken();

@Module({
  providers: [
    {
      provide: ExampleInlineService,
      inject: [optionsToken],
      useFactory: (options: ExampleOptions) => new ExampleInlineService(options.name)
    }
  ]
})
class ExampleSameScopeModule extends createAsyncModule<ExampleOptions>(optionsToken) {
  public static registerAsync(options: AsyncOptions<ExampleOptions>): DynamicModule {
    return super.registerAsync(options, ExampleSameScopeModule);
  }
}

describe("Simple Async Module that injects options in the same scope using provide", () => {


  let sut: ExampleInlineService;
  let app: INestApplication;

  beforeEach(async () => {
    app = await new NestApplicationBuilder()
      .withTestModule((testModule) =>
        testModule.withModule(
          ExampleSameScopeModule.registerAsync({
            useFactory: () => ({ name: EXAMPLE_MESSAGE }),
          }),
        ),
      )
      .build();

    sut = await app.resolve(ExampleInlineService);
  });

  afterEach(async () => {
    await app.close();
  });

  it("should be defined", async () => {
    expect(sut).toBeDefined();
  });

  it("should return hello from service", async () => {
    expect(sut.sayHello()).toBe(EXAMPLE_MESSAGE);
  });
});

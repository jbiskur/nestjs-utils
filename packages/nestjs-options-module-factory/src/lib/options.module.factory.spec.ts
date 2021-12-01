import {
  DynamicModule,
  INestApplication,
  Injectable,
  Module,
} from "@nestjs/common";
import {
  AsyncModule,
  AsyncOptions,
  createAsyncModule,
} from "@jbiskur/nestjs-async-module";
import { createOptionsModule } from "./options.module.factory";
import { NestApplicationBuilder } from "@jbiskur/nestjs-test-utilities";
import { ModuleOptions } from "@jbiskur/nestjs-async-module";

const correctValue = "Hello World";
const OPTIONS_NAME = "OPTIONS_NAME";

interface Options {
  value: string;
}

@Injectable()
class TestService {
  constructor(private readonly options: ModuleOptions<Options>) {}

  getExample(): string {
    return this.options.get().value;
  }
}

@Injectable()
class InnerTestService {
  constructor(private readonly options: ModuleOptions<Options>) {}

  getExample(): string {
    return this.options.get().value;
  }
}

@Module({
  providers: [InnerTestService],
})
class InnerTestModule extends createAsyncModule<Options>() {
  public static registerAsync(options: AsyncOptions<Options>): DynamicModule {
    return super.registerAsync(options, InnerTestModule);
  }
}

@Module({
  providers: [TestService],
})
class TestModule extends AsyncModule {
  public static registerAsync(options: AsyncOptions<Options>): DynamicModule {
    const optionsModule = createOptionsModule(OPTIONS_NAME, options);

    return this.doRegisterAsync(TestModule, null, null, {
      imports: [
        optionsModule,
        InnerTestModule.registerAsync({
          imports: [optionsModule],
          inject: [OPTIONS_NAME],
          useFactory: (outerOptions: Options) => ({
            value: outerOptions.value,
          }),
        }),
      ],
    });
  }
}

describe("Options Module Builder", () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await new NestApplicationBuilder()
      .withTestModule((builder) =>
        builder.withModule(
          TestModule.registerAsync({
            useFactory: () => ({
              value: correctValue,
            }),
          })
        )
      )
      .build();
  });

  afterEach(async () => {
    await app.close();
  });

  it("inner injected options to return the correct value", async () => {
    expect((await app.resolve(TestService)).getExample()).toBe(correctValue);
    expect((await app.resolve(InnerTestService)).getExample()).toBe(
      correctValue
    );
  });
});

import { AsyncModule } from "./async-module";
import {
  DynamicModule,
  INestApplication,
  Inject,
  Injectable,
  Module,
} from "@nestjs/common";
import { AsyncOptions } from "./interfaces";
import { NestApplicationBuilder } from '@jbiskur/nestjs-test-utilities';

interface ExampleOptions {
  name: string;
}

const PROVIDER_OPTIONS_NAME = "EXAMPLE_OPTIONS_PROVIDER";

@Injectable()
class ExampleService {
  constructor(
    @Inject(PROVIDER_OPTIONS_NAME) private readonly options: ExampleOptions,
  ) {}

  testOptions() {
    return this.options.name;
  }
}

const EXAMPLE_MESSAGE = "hello world";

@Module({})
class ExampleAsyncModule extends AsyncModule {
  public static registerAsync(
    options: AsyncOptions<ExampleOptions>,
  ): DynamicModule {
    return {
      ...this.doRegisterAsync<ExampleOptions>(
        ExampleAsyncModule,
        PROVIDER_OPTIONS_NAME,
        options,
        [ExampleService],
      ),
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

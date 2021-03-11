import { DynamicModule, INestApplication, Inject, Injectable, Module } from '@nestjs/common';
import { AsyncModule, AsyncOptions } from '@jbiskur/nestjs-async-module';
import { createOptionsModule } from "./options.module.factory";
import { NestApplicationBuilder } from '@jbiskur/nestjs-test-utilities';

const correctValue = "Hello World";
const OPTIONS_NAME = "OPTIONS_NAME";
const INNER_OPTIONS_NAME = "INNER_OPTIONS_NAME";

interface Options {
  value: string;
}

@Injectable()
class TestService {
  constructor(@Inject(OPTIONS_NAME)private readonly options: Options) {}

  getExample(): string {
    return this.options.value;
  }
}

@Injectable()
class InnerTestService {
  constructor(@Inject(INNER_OPTIONS_NAME)private readonly options: Options) {}

  getExample(): string {
    return this.options.value;
  }
}

@Module({})
class InnerTestModule extends AsyncModule {
  public static registerAsync(options: AsyncOptions<Options>): DynamicModule {
    return {
      ...this.doRegisterAsync(InnerTestModule, INNER_OPTIONS_NAME, options,{
        providers: [InnerTestService]
      })
    }
  }
}

@Module({})
class TestModule extends AsyncModule {
  public static registerAsync(options: AsyncOptions<Options>): DynamicModule {
    const optionsModule = createOptionsModule(OPTIONS_NAME, options);

    return {
      ...this.doRegisterAsync(TestModule),
      imports: [
        optionsModule,
        InnerTestModule.registerAsync({
          imports: [optionsModule],
          inject: [OPTIONS_NAME],
          useFactory: (outerOptions: Options) => ({value: outerOptions.value})
        })
      ],
      providers: [TestService]
    }
  }
}

describe("Options Module Builder", () => {
  let app: INestApplication;

  beforeEach(async ()=> {
    app = await new NestApplicationBuilder()
      .withTestModule(builder => builder.withModule(
        TestModule.registerAsync({
          useFactory: () => ({
            value: correctValue
          })
        })
      ))
      .build();
  });

  afterEach(async () => {
    await app.close();
  });

  it("inner injected options to return the correct value", async() => {
    expect((await app.resolve(TestService)).getExample()).toBe(correctValue);
    expect((await app.resolve(InnerTestService)).getExample()).toBe(correctValue);
  });
});

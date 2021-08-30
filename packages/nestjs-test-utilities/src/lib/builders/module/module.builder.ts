import {
  DynamicModule,
  ForwardReference, Global,
  Module,
  Provider,
  Type
} from "@nestjs/common";
import { Test, TestingModuleBuilder } from "@nestjs/testing";

export type NestJSModule =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<unknown>;

export interface ITestModuleBuilder {
  build(): TestingModuleBuilder | Promise<TestingModuleBuilder>;
  withModule(nestModule: NestJSModule): ITestModuleBuilder;
  withProvider(provider: Provider<unknown>): ITestModuleBuilder;
}

export class TestModuleBuilder implements ITestModuleBuilder{
  private imports: NestJSModule[] = [];
  private providers: Provider<unknown>[] = [];

  build(): TestingModuleBuilder {
    @Global()
    @Module({
      providers: [...this.providers],
      exports: [...this.providers],
    })
    class TestModuleInjector {}

    return Test.createTestingModule({
      imports: [...this.imports, TestModuleInjector]
    });
  }

  withModule(nestModule: NestJSModule): this {
    this.imports.push(nestModule);
    return this;
  }

  withProvider(provider: Provider<unknown>): this {
    this.providers.push(provider);
    return this;
  }
}

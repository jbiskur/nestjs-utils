import { DynamicModule, ForwardReference, Provider, Type } from "@nestjs/common";
import { Test, TestingModuleBuilder } from "@nestjs/testing";

export type NestJSModule =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<unknown>;

export interface ITestModuleBuilder {
  build(): TestingModuleBuilder;
  withModule(nestModule: NestJSModule): ITestModuleBuilder;
  withProvider(provider: Provider<unknown>): ITestModuleBuilder;
}

export class TestModuleBuilder implements ITestModuleBuilder{
  private imports: NestJSModule[] = [];
  private providers: Provider<unknown>[] = [];

  build(): TestingModuleBuilder {
    return Test.createTestingModule({
      imports: [...this.imports],
      providers: [...this.providers]
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

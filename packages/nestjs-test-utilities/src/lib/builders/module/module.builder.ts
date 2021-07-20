import { DynamicModule, ForwardReference, Provider, Type } from "@nestjs/common";
import { Test, TestingModuleBuilder } from "@nestjs/testing";

export type NestJSModule =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<unknown>;

export class TestModuleBuilder {
  private imports: NestJSModule[] = [];
  private providers: Provider<unknown>[] = [];

  build(): TestingModuleBuilder {
    return Test.createTestingModule({
      imports: [...this.imports],
      providers: [...this.providers]
    });
  }

  withModule(nestModule: NestJSModule): TestModuleBuilder {
    this.imports.push(nestModule);
    return this;
  }

  withProvider(provider: Provider<unknown>): TestModuleBuilder {
    this.providers.push(provider);
    return this;
  }
}

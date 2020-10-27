import { DynamicModule, ForwardReference, Type } from "@nestjs/common";
import { Test, TestingModuleBuilder } from "@nestjs/testing";

export type NestJSModule =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<unknown>;

export class TestModuleBuilder {
  private imports: NestJSModule[] = [];

  build(): TestingModuleBuilder {
    return Test.createTestingModule({
      imports: [...this.imports],
    });
  }

  withModule(nestModule: NestJSModule): TestModuleBuilder {
    this.imports.push(nestModule);
    return this;
  }
}

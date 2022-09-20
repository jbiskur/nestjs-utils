import { Module } from "@nestjs/common";
import { AsyncModule, AsyncOptions } from "@jbiskur/nestjs-async-module";

@Module({})
class OptionsModule<T> extends AsyncModule {
  public create(optionsName: string, options: AsyncOptions<T>, dynamicOptions = true) {
    return {
      ...OptionsModule.doRegisterAsync(OptionsModule, optionsName, options, undefined, dynamicOptions),
      exports: [optionsName],
    };
  }
}

export function createOptionsModule<T>(
  optionsName: string,
  options: AsyncOptions<T>
) {
  return new OptionsModule<T>().create(optionsName, options);
}

import { DynamicModule, Provider, Type } from "@nestjs/common";
import { AsyncOptions } from "./interfaces";
import { ModuleMetadata } from "@nestjs/common/interfaces";

export abstract class AsyncModule {
  protected static doRegisterAsync<TOptions>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: Type<any>,
    constProviderName: string = null,
    options: Pick<AsyncOptions<TOptions>, "imports" | "useFactory" | "inject"> | null = null,
    dynamic: ModuleMetadata = null
  ): DynamicModule {
    const optionsProvider: Provider[] = [];

    if (options.useFactory) {
      optionsProvider.push({
        provide: constProviderName,
        useFactory: options.useFactory,
        inject: options.inject || [],
      })
    }

    const moduleObject: DynamicModule = {
      module,
      imports: options && options.imports || [],
      providers: [
        ...optionsProvider,
      ],
      controllers: [],
      exports: [],
    };

    dynamic && dynamic.controllers && dynamic.controllers.forEach(controller => moduleObject.controllers.push(controller));
    dynamic && dynamic.imports && dynamic.imports.forEach(importObj => moduleObject.imports.push(importObj));
    dynamic && dynamic.providers && dynamic.providers.forEach(provider => moduleObject.providers.push(provider));
    dynamic && dynamic.exports && dynamic.exports.forEach(exportObj => moduleObject.exports.push(exportObj));

    return moduleObject;
  }
}

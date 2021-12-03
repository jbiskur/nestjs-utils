import { DynamicModule, Provider, Type } from "@nestjs/common";
import { AsyncOptions } from "./interfaces";
import { ModuleMetadata } from "@nestjs/common/interfaces";
import _ from "lodash";
import {
  createOptionsToken,
  ModuleOptions,
} from "./async-module-options.service";

export interface IAsyncModule<TOptions, COptions = unknown> {
  new (): Type<TOptions>;

  registerAsync(
    options: AsyncOptions<TOptions>,
    type?: Type<COptions>
  ): DynamicModule;

  doRegisterAsync<TOptions>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: Type,
    constProviderName: string,
    options: Pick<
      AsyncOptions<TOptions>,
      "imports" | "useFactory" | "inject"
    > | null,
    dynamic?: ModuleMetadata
  ): DynamicModule;
}

export const createAsyncModule = <TOptions = unknown>(
  optionsProviderName: string = null
) => {
  abstract class AsyncModuleDynamic extends AsyncModule {
    public static registerAsync(
      options: AsyncOptions<TOptions>,
      type?: Type
    ): DynamicModule {
      return this.doRegisterAsync(
        type,
        createOptionsToken(optionsProviderName ?? undefined),
        options
      );
    }
  }

  return AsyncModuleDynamic as unknown as IAsyncModule<TOptions>;
};

export abstract class AsyncModule {
  // eslint-disable-next-line
  protected static doRegisterAsync<TOptions>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: Type<any>,
    constProviderName: string = null,
    options: Pick<
      AsyncOptions<TOptions>,
      "imports" | "useFactory" | "inject"
    > | null = null,
    dynamic: ModuleMetadata = null
  ): DynamicModule {
    const optionsProvider: Provider[] = [];

    if (options && options.useFactory) {
      optionsProvider.push({
        provide: constProviderName,
        useFactory: options.useFactory,
        inject: options.inject || [],
      });
    }

    const moduleObject: DynamicModule = {
      module,
      imports: (options && options?.imports) || [],
      providers: [...optionsProvider, ModuleOptions],
      controllers: [],
      exports: [],
    };

    if (Reflect.getMetadata("imports", this)) {
      moduleObject.imports?.push(...Reflect.getMetadata("imports", this))
    }

    if (Reflect.getMetadata("providers", this)) {
      moduleObject.providers?.push(...Reflect.getMetadata("providers", this))
    }

    if (Reflect.getMetadata("controllers", this)) {
      moduleObject.controllers?.push(...Reflect.getMetadata("controllers", this))
    }

    if (Reflect.getMetadata("exports", this)) {
      moduleObject.exports?.push(...Reflect.getMetadata("exports", this))
    }

    if (dynamic) {
      if (dynamic.imports?.length) {
        moduleObject.imports?.push(...dynamic.imports);
      }

      if (dynamic.providers?.length) {
        moduleObject.providers?.push(...dynamic.providers);
      }

      if (dynamic.controllers?.length) {
        moduleObject.controllers?.push(...dynamic.controllers);
      }

      if (dynamic.exports?.length) {
        moduleObject.exports?.push(...dynamic.exports);
      }
    }

    return moduleObject;
  }
}

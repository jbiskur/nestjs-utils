import { DynamicModule, Provider, Type } from "@nestjs/common";
import { AsyncOptions } from "./interfaces";
import { ModuleMetadata } from "@nestjs/common/interfaces";
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
    dynamic: ModuleMetadata
  ): DynamicModule;
}

export const createAsyncModule = <TOptions = unknown>(
  optionsProviderName?: string
) => {
  abstract class AsyncModuleDynamic extends AsyncModule {
    public static registerAsync(
      options: AsyncOptions<TOptions>,
      type: Type
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
    module: Type,
    constProviderName: string,
    options: Pick<
      AsyncOptions<TOptions>,
      "imports" | "useFactory" | "inject"
    > | null = null,
    dynamic?: ModuleMetadata
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
      imports: options?.imports ?? [],
      providers: [...optionsProvider, ModuleOptions],
      controllers: [],
      exports: [],
    };

    const importsMeta: Pick<ModuleMetadata, "imports"> = {
      imports: Reflect.getMetadata("imports", this) ?? [],
    };
    const providersMeta: Pick<ModuleMetadata, "providers"> = {
      providers: Reflect.getMetadata("providers", this) ?? [],
    };
    const controllersMeta: Pick<ModuleMetadata, "controllers"> = {
      controllers: Reflect.getMetadata("controllers", this) ?? [],
    };
    const exportsMeta: Pick<ModuleMetadata, "exports"> = {
      exports: Reflect.getMetadata("exports", this) ?? [],
    };

    if (dynamic?.imports != undefined)
    {
      moduleObject.imports?.push(...dynamic.imports);
    }

    if (dynamic?.providers != undefined)
    {
      moduleObject.providers?.push(...dynamic.providers);
    }

    if (dynamic?.controllers != undefined)
    {
      moduleObject.controllers?.push(...dynamic.controllers);
    }

    if (dynamic?.exports != undefined)
    {
      moduleObject.exports?.push(...dynamic.exports);
    }

    if (importsMeta.imports != undefined)
    {
      moduleObject.imports?.push(...importsMeta.imports);
    }

    if (providersMeta.providers != undefined)
    {
      moduleObject.providers?.push(...providersMeta.providers);
    }

    if (controllersMeta.controllers != undefined)
    {
      moduleObject.controllers?.push(...controllersMeta.controllers);
    }

    if (exportsMeta.exports != undefined)
    {
      moduleObject.exports?.push(...exportsMeta.exports);
    }

    return moduleObject;
  }
}

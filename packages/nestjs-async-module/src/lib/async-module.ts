import { DynamicModule, Provider, Type } from "@nestjs/common";
import { AsyncOptions } from "./interfaces";
import { ModuleMetadata } from "@nestjs/common/interfaces";
import _ from "lodash";

export interface IAsyncModule<TOptions, COptions = unknown> {
  new (): Type<TOptions>;

  registerAsync(options: AsyncOptions<TOptions>, type?: Type<COptions>): DynamicModule;

  doRegisterAsync<TOptions>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: Type,
    constProviderName: string,
    options: Pick<AsyncOptions<TOptions>, "imports" | "useFactory" | "inject"> | null,
    dynamic: ModuleMetadata
  ): DynamicModule;
}

export const createAsyncModule = <TOptions = unknown>(optionsProviderName: string = null) => {
  abstract class AsyncModuleDynamic extends AsyncModule {
    public static registerAsync(options: AsyncOptions<TOptions>, type?: Type): DynamicModule {
      return this.doRegisterAsync(
        type,
        optionsProviderName,
        options
      );
    }
  }

  return AsyncModuleDynamic as unknown as IAsyncModule<TOptions>;
}

export abstract class AsyncModule {
  // eslint-disable-next-line
  protected static doRegisterAsync<TOptions>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: Type<any>,
    constProviderName: string = null,
    options: Pick<AsyncOptions<TOptions>, "imports" | "useFactory" | "inject"> | null = null,
    dynamic: ModuleMetadata = null
  ): DynamicModule {
    const optionsProvider: Provider[] = [];

    if (options && options.useFactory) {
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

    const importsMeta: Pick<ModuleMetadata, "imports"> = Reflect.getMetadata("imports", this);
    const providersMeta: Pick<ModuleMetadata, "providers"> = Reflect.getMetadata("providers", this);
    const controllersMeta: Pick<ModuleMetadata, "controllers"> = Reflect.getMetadata("controllers", this);
    const exportsMeta: Pick<ModuleMetadata, "exports"> = Reflect.getMetadata("exports", this);

    moduleObject.imports = _.concat(moduleObject.imports, dynamic?.imports && dynamic.imports, importsMeta).filter(Boolean);
    moduleObject.providers = _.concat(moduleObject.providers, dynamic?.providers && dynamic.providers, providersMeta).filter(Boolean);
    moduleObject.controllers = _.concat(moduleObject.controllers, dynamic?.controllers && dynamic.controllers, controllersMeta).filter(Boolean);
    moduleObject.exports = _.concat(moduleObject.exports, dynamic?.exports && dynamic.exports, exportsMeta).filter(Boolean);

    return moduleObject;
  }
}

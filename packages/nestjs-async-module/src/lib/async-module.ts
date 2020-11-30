import { DynamicModule, Provider, Type } from "@nestjs/common";
import { AsyncOptions } from "./interfaces";

export abstract class AsyncModule {
  protected static doRegisterAsync<TOptions>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: Type<any>,
    constProviderName: string = null,
    options: Pick<AsyncOptions<TOptions>, "imports" | "useFactory" | "inject"> | null = null,
    providers: Provider[] = [],
    exports: [] = [],
  ): DynamicModule {
    const optionsProvider: Provider[] = [];

    if (options) {
      optionsProvider.push({
        provide: constProviderName,
        useFactory: options.useFactory,
        inject: options.inject || [],
      })
    }

    return {
      module,
      imports: options && options.imports || [],
      providers: [
        ...providers,
        ...optionsProvider,
      ],
      exports: [...exports],
    };
  }
}

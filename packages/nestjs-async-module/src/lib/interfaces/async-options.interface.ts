/* eslint-disable @typescript-eslint/no-explicit-any */
/* Dependencies */
import { ModuleMetadata, Type } from "@nestjs/common/interfaces";
import { OptionsFactory } from "./options-factory.interface";

export interface AsyncOptions<TOptions>
  extends Pick<ModuleMetadata, "imports"> {
  inject?: any[];
  useClass?: Type<OptionsFactory<TOptions>>;
  useFactory?: (...args: any[]) => Promise<TOptions> | TOptions;
}

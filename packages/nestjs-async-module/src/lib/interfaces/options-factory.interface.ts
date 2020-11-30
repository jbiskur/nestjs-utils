export interface OptionsFactory<TOptions> {
  createOptions(): Promise<TOptions> | TOptions;
}

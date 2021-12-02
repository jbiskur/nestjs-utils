import { OverrideBy, OverrideByFactoryOptions } from "@nestjs/testing";

export type OverrideFunction = (value: OverrideBy) => void;

export class ApplicationBuilderOverrideBy {
  private override: OverrideFunction | null = null;

  constructor() {
    this.override = null;
  }

  get overriddenWith(): OverrideFunction | null {
    return this.override;
  }

  with(override: OverrideFunction): ApplicationBuilderOverrideBy {
    this.override = override;
    return this;
  }

  useValue(value: unknown) {
    return this.with((override) => override.useValue(value));
  }

  useFactory(options: OverrideByFactoryOptions) {
    return this.with((override) => override.useFactory(options));
  }

  useClass(metatype: unknown) {
    return this.with((override) => override.useClass(metatype));
  }
}

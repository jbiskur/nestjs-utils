import { TestModuleBuilder } from "../module";
import { INestApplication } from "@nestjs/common";
import { ApplicationBuilderOverrideBy } from "./application-builder-override-by";

type OverrideProvider = {
  type: unknown;
  override: ApplicationBuilderOverrideBy;
};

export interface ApplicationBuilderInterface {
  build(): Promise<INestApplication>;
}

export interface BuilderPluginInterface {
  run(appBuilder: NestApplicationBuilder): void;
}

export class NestApplicationBuilder implements ApplicationBuilderInterface {
  private testModuleBuilder: TestModuleBuilder = new TestModuleBuilder();
  private overrideProviders: OverrideProvider[] = [];

  async build(): Promise<INestApplication> {
    const testingModuleBuilder = this.testModuleBuilder.build();

    // loop through all override providers and apply them to the testing module
    this.overrideProviders.forEach((overrideProvider: OverrideProvider) => {
      const provider = testingModuleBuilder.overrideProvider(
        overrideProvider.type
      );

      // override again if already overridden with another provider
      if (overrideProvider.override.overriddenWith) {
        overrideProvider.override.overriddenWith(provider);
      }
    });

    const testingModule = await testingModuleBuilder.compile();
    const app = testingModule.createNestApplication();
    await app.init();
    return app;
  }

  withOverrideProvider<T>(
    typeOrToken: T,
    overrideBy: (
      overrideWith: ApplicationBuilderOverrideBy
    ) => ApplicationBuilderOverrideBy
  ): this {
    this.overrideProviders.push({
      type: typeOrToken,
      override: overrideBy(new ApplicationBuilderOverrideBy()),
    });
    return this;
  }

  withTestModule(
    testModuleBuilder: (builder: TestModuleBuilder) => TestModuleBuilder
  ): this {
    this.testModuleBuilder = testModuleBuilder(this.testModuleBuilder);
    return this;
  }

  with<T extends BuilderPluginInterface>(plugin: { new (): T }, pluginBuilder: (builder: T) => T = null): this {
    if (pluginBuilder) {
      const pluginInstance = pluginBuilder(new plugin());
      pluginInstance.run(this);
    }
    else {
      new plugin().run(this);
    }
    return this;
  }
}

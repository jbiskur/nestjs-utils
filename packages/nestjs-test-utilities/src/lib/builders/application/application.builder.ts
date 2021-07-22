import { ITestModuleBuilder, TestModuleBuilder } from "../module";
import { INestApplication } from "@nestjs/common";
import { ApplicationBuilderOverrideBy } from "./application-builder-override-by";
import { MicroserviceOptions } from "@nestjs/microservices";

type OverrideProvider = {
  type: unknown;
  override: ApplicationBuilderOverrideBy;
};

export interface INestApplicationBuilderPlugin {
  // executed by the nest application builder
  run(appBuilder: NestApplicationBuilder): void;
}

export class NestApplicationBuilder<T extends ITestModuleBuilder = TestModuleBuilder> {
  protected testModuleBuilder: ITestModuleBuilder;
  protected overrideProviders: OverrideProvider[] = [];

  constructor(c?: (new () => T)) {
    this.testModuleBuilder = c ? new c() : new TestModuleBuilder();
  }

  async build(): Promise<INestApplication> {
    const testingModuleBuilder = this.createTestingModule();

    const testingModule = await testingModuleBuilder.compile();
    const app = testingModule.createNestApplication();
    await app.init();
    return app;
  }

  async buildAsMicroservice(options: MicroserviceOptions) {
    const testingModuleBuilder = this.createTestingModule();

    const testingModule = await testingModuleBuilder.compile();
    const app = testingModule.createNestMicroservice<MicroserviceOptions>({
      ...testingModule,
      ...options
    });
    await app.listenAsync();
    console.log("microservice is listening");
    return app;
  }

  protected createTestingModule() {
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
    return testingModuleBuilder;
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
    testModuleBuilder: (builder: ITestModuleBuilder) => ITestModuleBuilder
  ): this {
    this.testModuleBuilder = testModuleBuilder(this.testModuleBuilder);
    return this;
  }

  with<T extends INestApplicationBuilderPlugin>(plugin: { new (): T }, pluginBuilder: (builder: T) => T = null): this {
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

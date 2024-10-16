import { CanActivate, ExceptionFilter, INestApplication, NestInterceptor, PipeTransform, Provider, Type } from "@nestjs/common";
import { MicroserviceOptions } from "@nestjs/microservices";
import * as _ from "lodash";
import * as net from "net";
import { ITestModuleBuilder, NestJSModule, TestModuleBuilder } from "../module";
import { ApplicationBuilderOverrideBy } from "./application-builder-override-by";

export enum ProviderType {
  PROVIDER = "overrideProvider",
  GUARD = "overrideGuard",
  INTERCEPTOR = "overrideInterceptor",
  FILTER = "overrideFilter",
  PIPE = "overridePipe",
}


type OverrideProvider = {
  type: unknown;
  override: ApplicationBuilderOverrideBy;
  providerType: ProviderType
};

export interface INestApplicationBuilderPlugin {
  // executed by the nest application builder
  run(appBuilder: NestApplicationBuilder): void;
}

let nextPort = 3900;

export class NestApplicationBuilder<
  T extends ITestModuleBuilder = TestModuleBuilder
> {
  protected testModuleBuilder: ITestModuleBuilder;
  protected overrideProviders: OverrideProvider[] = [];
  protected globalPipes: PipeTransform[] = [];
  protected globalGuards: CanActivate[] = [];
  protected globalInterceptors: NestInterceptor[] = [];
  protected globalFilters: ExceptionFilter[] = [];

  constructor(c?: new () => T) {
    this.testModuleBuilder = c ? new c() : new TestModuleBuilder();
  }

  withGlobalPipes(pipes: PipeTransform[]): this {
    this.globalPipes = pipes;
    return this;
  }

  withGlobalGuards(guards: CanActivate[]): this {
    this.globalGuards = guards;
    return this;
  }

  withGlobalInterceptors(interceptors: NestInterceptor[]): this {
    this.globalInterceptors = interceptors;
    return this;
  }

  withGlobalFilters(filters: ExceptionFilter[]): this {
    this.globalFilters = filters;
    return this;
  }

  async build(): Promise<INestApplication> {
    const testingModuleBuilder = await this.createTestingModule();

    const testingModule = await testingModuleBuilder.compile();
    const app = testingModule.createNestApplication();

    this.augmentApp(app);

    await app.init();
    return app;
  }

  private augmentApp(app: INestApplication<unknown>) {
    for (const pipe of this.globalPipes) {
      app.useGlobalPipes(pipe);
    }

    for (const guard of this.globalGuards) {
      app.useGlobalGuards(guard);
    }

    for (const interceptor of this.globalInterceptors) {
      app.useGlobalInterceptors(interceptor);
    }

    for (const filter of this.globalFilters) {
      app.useGlobalFilters(filter);
    }
  }

  async buildAsMicroservice(options: MicroserviceOptions | MicroserviceOptions[], port = nextPort): Promise<INestApplication> {
    const testingModuleBuilder = await this.createTestingModule();
    const testingModule = await testingModuleBuilder.compile();
    const app = testingModule.createNestApplication();

    this.augmentApp(app);

    if (_.isArray(options)) {
      for (const option of options) {
        app.connectMicroservice(option);
      }
    }
    else {
      app.connectMicroservice(options);
    }

    await app.startAllMicroservices();
    console.log("microservice is listening");
    while (await this.isPortUsed(port)) {
      console.log(`port: ${port} is used, trying next port`);
      port++;
    }
    await app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
    nextPort++;
    return app;
  }

  private async isPortUsed(port: number): Promise<boolean> {
    const server = net.createServer();
    try {
      return await new Promise((resolve, reject) => {

        server.once('error', function (err: any) {
          if (err.code === 'EADDRINUSE') {
            resolve(true);
          }
          reject(err);
        });

        server.once('listening', function () {
          // close the server if listening doesn't fail
          server.close();
          resolve(false);
        });

        server.listen(port);
      });
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  protected async createTestingModule() {
    const testingModuleBuilder = await this.testModuleBuilder.build();

    // loop through all override providers and apply them to the testing module
    this.overrideProviders.forEach((overrideProvider: OverrideProvider) => {
      const provider = testingModuleBuilder[overrideProvider.providerType](
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
    ) => ApplicationBuilderOverrideBy,
    providerType: ProviderType = ProviderType.PROVIDER
  ): this {
    this.overrideProviders.push({
      type: typeOrToken,
      override: overrideBy(new ApplicationBuilderOverrideBy()),
      providerType,
    });
    return this;
  }

  withTestModule(
    testModuleBuilder: (builder: ITestModuleBuilder) => ITestModuleBuilder
  ): this {
    this.testModuleBuilder = testModuleBuilder(this.testModuleBuilder);
    return this;
  }

  injectImports(targetModule: Type, imports: NestJSModule[]): this {
    this.testModuleBuilder.injectImports(targetModule, imports);
    return this;
  }

  injectProviders(targetModule: Type, providers: Provider[]): this {
    this.testModuleBuilder.injectProviders(targetModule, providers);
    return this;
  }

  overrideModule(parentModule: Type | string, targetModule: Type, module: NestJSModule): this {
    this.testModuleBuilder.overrideModule(parentModule, targetModule, module);
    return this;
  }

  with<T extends INestApplicationBuilderPlugin>(
    plugin: { new (): T },
    pluginBuilder?: (builder: T) => T
  ): this {
    if (pluginBuilder) {
      const pluginInstance = pluginBuilder(new plugin());
      pluginInstance.run(this);
    } else {
      new plugin().run(this);
    }
    return this;
  }
}

# nestjs-test-utilities

The test utilities contain a set of builders that should speed up testing using method chaining and make the tests more descriptive.

[toc]: # "## Table of Contents"

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Module](#module)
  - [Application](#application)
  - [Application Instance](#application-instance)
  - [Plugins](#plugins)

## Installation

Install using npm.

```npm
npm install --save-dev @jbiskur/nestjs-test-utilities
```

using yarn.

```yarn
yarn add --dev @jbiskur/nestjs-test-utilities
```

## Usage

The library provides a set of builders that can be used to test various parts of the NestJS ecosystem.

### Module

To facilitate the testing of a single module in isolation a module builder is provided that is a simple wrapper around the [@nestjs/testing](https://www.npmjs.com/package/@nestjs/testing) library.

```typescript
import { TestModuleBuilder } from "@jbiskur/nestjs-test-utilities";
//... other imports

describe("Simple Example", () => {
  it("should be get result from example service", async () => {
    const module = await new TestModuleBuilder()
      .withModule(TestModuleA)
      .build()
      .compile();

    const serviceA = module.get(TestServiceA);

    expect(await serviceA.helloFromA()).toBe("hello world");
  });
});
```

`withModule()` can be chained after each other to import additional modules, after the `build()` method is called a normal TestingModule is returned, so methods like `overrideProvider()` can be chained before the final `compile()` command.

### Application

A more useful feature of this library is the usage of the Application Builder. This creates a full NestJS application and initializes it so that all life-cycle methods are executed. Underneath the standard [@nestjs/testing](https://www.npmjs.com/package/@nestjs/testing) library is used.

```typescript
import { INestApplication } from "@nestjs/common";
import {
  NestApplicationBuilder,
} from "@jbiskur/nestjs-test-utilities";

//...import services and modules

describe("e2e test of module", () => {
  // store the application in an easily accessible variable
  let app: INestApplication;

  afterEach(async () => {
    // remember to close the application
    await app.close();
  });

  it("module and service should be defined", async () => {
    app = await new NestApplicationBuilder()
      .withTestModule((builder) => builder.withModule(TestModuleA))
      .build();

    const testModuleA = app.get(TestModuleA);
    const testServiceA = await app.resolve(TestServiceA);

    expect(testModuleA).toBeDefined();
    expect(testServiceA).toBeDefined();
  });
}
```

the code above ensures that the full life-cycle methods in `TestModuleA` are called.

A more complete example using overrides to mock data for specific services.

```typescript
import { INestApplication } from "@nestjs/common";
import {
  NestApplicationBuilder,
} from "@jbiskur/nestjs-test-utilities";

//...import services and modules

describe("Example overrides using jest Mock", () => {
    // store the application in an easily accessible variable
    let app: INestApplication;
    const mockedOutput = "Hello from a mocked service";
    let TestServiceMock: jest.Mock<TestServiceA, TestServiceA[]>;

    beforeAll(() => {
      TestServiceMock = jest
        .fn<TestServiceA, TestServiceA[]>()
        .mockImplementation(() => ({
          helloFromA: () => mockedOutput,
        }));
    });

    afterEach(async () => {
        // remember to close the application
        await app.close();
    });

    it("should work to override a provider using class", async () => {
      app = await new NestApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withOverrideProvider(TestServiceA, (overrideWith) =>
          // useFactory and useValue are also supported
          overrideWith.useClass(TestServiceMock)
        )
        .build();

      const sut = await app.resolve(TestServiceA);
      expect(sut.helloFromA()).toBe(mockedOutput);
    });
}
```

A powerful way to simplify the testing in your apps or libraries, especially in a mono-repo configuration, is to extend the application builder to configure certain modules with a single method call for generic features such as database connections, graphql setup and loggers, as the example below illustrates.

```typescript
import { GraphQLModule } from "@nestjs/graphql";
//...import logger
//...import typeorm

// first you extend the builder by extending the NestApplicationBuilder class
class ExtendedNestApplicationBuilder extends NestApplicationBuilder {
  withGraphQLModule(): this {
    this.withTestModule((builder) =>
      builder.withModule(GraphQLModule.registerAsync({ autoSchemaFile: true }))
    );
    return this;
  }

  withSomeLoggingModule(): this {
    this.withTestModule((builder) =>
      builder.withModule(/* ...registerAsync, forRoot etc.. */)
    );
    return this;
  }

  withTypeORMConnection(): this {
    this.withTestModule((builder) =>
      builder.withModule(/* ...fx sql-lite in-memory database */)
    );
    return this;
  }
}
```

this can then be use like the normal builder, but with the added functionality.

```typescript
it("should work to extend the builder", async () => {
  app = await new ExtendedNestApplicationBuilder()
    .withTestModule((builder) => builder.withModule(TestModuleB))
    .withGraphQLModule()
    .withSomeLoggingModule()
    .withTypeORMConnection()
    .build();

  const graphqlModule = await app.get(GraphQLModule);
  const serviceB = await app.resolve(TestServiceB);

  expect(graphqlModule).toBeDefined();
  expect(serviceB.helloFromB()).toBe("hello world");
});
```

this way the tests are setup consistently throughout the test suite.

### Application Instance

The last builder that is provided is a way to wrap the application builder in an instance builder. This creates a full server than can be queried on localhost.

```typescript
import fetch from "cross-fetch";
import {
  ApplicationInstance,
  ApplicationInstanceBuilder,
  NestApplicationBuilder,
} from "@jbiskur/nestjs-test-utilities";
import { INestApplication } from "@nestjs/common";

//...import modules etc..

describe("Application Server Instance", () => {
  describe("listen on port 3000", () => {
    let app: ApplicationInstance;
    let instance: INestApplication;
    const port = 3000;

    beforeAll(async () => {
      app = await new ApplicationInstanceBuilder(
        new NestApplicationBuilder().withTestModule((builder) =>
          builder.withModule(ModuleWithController)
        )
      ).build(port);

      instance = app.instance;
    });

    afterAll(async () => {
      await instance.close();
    });

    it("should respond on port", async () => {
      const result: Response = await fetch(`http://localhost:${app.port}/`);
      expect(app.port).toBe(expected);
      expect(await result.text()).toBe("hello world");
    });
  });
```

an example with overriding providers with [moq.ts](https://www.npmjs.com/package/moq.ts) for mocking the result of a service

```typescript
import { Mock } from "moq.ts";

//...setup, describe, it etc.
const mockedResponse = "Hello from a mocked ServiceA";
const MockedServiceA = new Mock<TestServiceA>()
  .setup((instance) => instance.helloFromA())
  .returns(mockedResponse);

beforeAll(async () => {
  app = await new ApplicationInstanceBuilder(
    new NestApplicationBuilder().withTestModule((builder) =>
      builder.withModule(ModuleWithController)
    )
    .withOverrideProvider(TestServiceA, (overrideWith) =>
      overrideWith.useValue(MockedServiceA.object())
    );
  ).build();

  instance = app.instance;
});

//... remember to close the instance

it("should respond with the mocked response", async () => {
  const result: Response = await fetch(`http://localhost:${app.port}/`);
  expect(await result.text()).toBe(mockedResponse);
});
```

using an extended builder this can be simplified even more if some service is constantly mocked. It can then be easy to mock generic services with a single method call.

```typescript
class ExtendedNestApplicationBuilder extends NestApplicationBuilder {
  // ...other extended methods

  withOverriddenTestServiceA(): this {
    this.withOverrideProvider(TestServiceA, (overrideWith) =>
      overrideWith.useValue(MockedServiceA.object())
    );
    return this;
  }
}

//... in test
beforeAll(async () => {
  app = await new ApplicationInstanceBuilder(
    new ExtendedNestApplicationBuilder()
      .withTestModule((builder) => builder.withModule(ModuleWithController))
      .withOverriddenTestServiceA()
  ).build();

  instance = app.instance;
});
```

### Plugins

the test builder supports plugins that can be used to share common builder patterns.

A plugin can be developed by extending the following interface

```typescript
export interface INestApplicationBuilderPlugin {
  run(appBuilder: NestApplicationBuilder): void;
}
```

An example graphql module plugin:

```typescript
import { GraphQLModule } from "@nestjs/graphql";

class GraphQL implements INestApplicationBuilderPlugin {
  private options: GraphQLOptions = {
    autoSchemaFile: true,
  };

  withPlayground(): this {
    options.playground = true;
    return this;
  }

  withProduction(): this {
    options.production = true;
  }

  // is executed last by the Application Builder
  run(appBuilder: NestApplicationBuilder): void {
    appBuilder.withTestModule((builder) =>
      builder.withModule(GraphQLModule.registerAsync(this.options))
    );
  }
}
```

and using it with no options

```typescript
app = await new NestApplicationBuilder()
  .withTestModule((builder) => builder.withModule(TestModuleA))
  .with(GraphQL)
  .build();
```

with options

```typescript
app = await new NestApplicationBuilder()
  .withTestModule((builder) => builder.withModule(TestModuleA))
  .with(GraphQL, (plugin) => plugin.withPlayground().withProduction())
  .build();
```

When sharing **NestApplicationBuilderPlugins** on npm, please use the following naming convention

`<name>-nestjs-builder-plugin`

###Using it with another TestModuleBuilder
for example using it to test [nest-commander](https://www.npmjs.com/package/nest-commander) projects with [nest-commander-testing](https://www.npmjs.com/package/nest-commander-testing).

first, add the packages

```npm
npm install --save nest-commander && npm install --save-dev nest-commander-testing
```

using yarn.

```yarn
yarn add nest-commander && yarn add --dev nest-commander-testing
```

then implement your own builder like this:

```typescript
import {
  ITestModuleBuilder,
  NestJSModule,
} from "@jbiskur/nestjs-test-utilities";

export class TestCommandBuilder implements ITestModuleBuilder {
  private imports: NestJSModule[] = [];
  private providers: Provider<unknown>[] = [];

  build(): TestingModuleBuilder {
    return CommandTestFactory.createTestingCommand({
      imports: [...this.imports],
      providers: [...this.providers],
    });
  }

  withModule(nestModule: NestJSModule): ITestModuleBuilder {
    this.imports.push(nestModule);
    return this;
  }

  withProvider(provider: Provider<unknown>): ITestModuleBuilder {
    this.providers.push(provider);
    return this;
  }
}
```

then to use it properly with nest-commander-testing extend the nestjs application builder

```typescript
import { NestApplicationBuilder } from "@jbiskur/nestjs-test-utilities";

export class GTCommandInstanceBuilder extends NestApplicationBuilder<TestCommandBuilder> {
  constructor() {
    super(TestCommandBuilder);
  }

  async buildCommandInstance(): Promise<TestingModule> {
    const testingModuleBuilder = await this.createTestingModule();

    const testingModule = await testingModuleBuilder.compile();
    return await testingModule.init();
  }
}
```

it can then be used normally

```typescript
commandInstance = await new GTCommandInstanceBuilder()
  .withTestModule((builder) =>
    builder.withModule({
      imports: [AppModule],
    })
  )
  .with(LogModulePlugin)
  .withOverrideProvider(SomeService, (overrideWith) =>
    overrideWith.useValue(someMockedService)
  )
  .buildCommandInstance();
```

# nestjs-async-module

The Async Module is a utility class, that simplifies creating dynamic NestJS modules.

[toc]: # "## Table of Contents"

- [Installation](#installation)
- [Usage](#usage)

## Installation

Install using npm.

```npm
npm install --save-dev @jbiskur/nestjs-async-module
```

using yarn.

```yarn
yarn add --dev @jbiskur/nestjs-async-module
```

## Usage

The library provides a utility class and an options factory

```typescript
//...nestjs imports
import { AsyncModule, AsyncOptions } from "@jbiskur/nestjs-async-module";

// interface for the module
interface ExampleOptions {
  name: string;
}

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
class ExampleAsyncModule extends createAsyncModule<ExampleOptions>() {}
```

to then use the module you just use the register async and then typescript uses the interface for intellisense.

```typescript
@module({
  imports: [
    ExampleAsyncModule.registerAsync(
      {
        useFactory: () => ({
          name: "hello world",
        }),
      },
      ExampleAsyncModule
    ),
  ],
})
export class AppModule {}
```

## Accessing Options

To access options registered with this dynamic module can be done with the following:

```typescript
@Injectable()
class ExampleService {
  constructor(private readonly options: ModuleOptions<ExampleOptions>) {}

  testOptions() {
    return this.options.get().name;
  }
}
```

The ModuleOptions service discovers all tokens noted with uppercase `_OPTIONS` within the current module, and they are flattened into the return of the `get()` method. TypeScript is informed via the template parameter `ModuleOptions<TOptions>`. These options are not validated on retrieval.

# Facilitate Injecting Services

another use-case is to purely use it to facilitate injecting services to dynamic modules.

```typescript
//...nestjs imports
import { AsyncModule, AsyncOptions } from "@jbiskur/nestjs-async-module";

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
class ExampleAsyncModule extends createAsyncModule() {}
```

using it is then as simple as the following.

```typescript
@module({
  imports: [
    ExampleAsyncModule.registerAsync(
      {
        imports: [SomeModule],
        inject: [AService],
      },
      ExampleAsyncModule
    ),
  ],
})
export class AppModule {}
```



# nestjs-async-module

The Async Module is a utility class, that simplifies creating dynamic NestJS modules.

[TOC]: # "## Table of Contents"
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

// const name of the options provider, than can be injected into services within the module
const PROVIDER_OPTIONS_NAME = "EXAMPLE_OPTIONS_PROVIDER";

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: []
})
class ExampleAsyncModule extends createAsyncModule<ExampleOptions>(PROVIDER_OPTIONS_NAME) {}
```

to then use the module you just use the register async and then typescript uses the interface for intellisense.

```typescript
@module({
  imports: [
    ExampleAsyncModule.registerAsync({
      useFactory: () => ({
        name: "hello world"
      })
    }, ExampleAsyncModule),  
  ]
})
export class AppModule {}
```

# Facilitate Injecting Services
another use-case is to purely use it to facilitate injecting services to dynamic modules.

```typescript
//...nestjs imports
import { AsyncModule, AsyncOptions } from "@jbiskur/nestjs-async-module";

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: []
})
class ExampleAsyncModule extends createAsyncModule() {}
```

using it is then as simple as the following.

```typescript
@module({
  imports: [
    ExampleAsyncModule.registerAsync({
      imports: [SomeModule],
      inject: [AService]
    },ExampleAsyncModule)  
  ]
})
export class AppModule {}
```

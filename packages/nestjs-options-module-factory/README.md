# nestjs-options-module-factory

The Options Module Factory provides a way to pass an options provider in the current import context by forcing the options provider to be resolved first. This is done through creating a module purely for containing and exporting the options provider.

[TOC]: # "## Table of Contents"
- [Installation](#installation)
- [Usage](#usage)

## Installation
Install using npm.

```npm  
npm install --save-dev @jbiskur/nestjs-options-module-factory
```

using yarn.
```yarn  
yarn add --dev @jbiskur/nestjs-options-module-factory
```

## Usage

The library provides a utility factory function that creates a module with the options provided. These options are exported and can be used in the import context as seen in the example below. The InnerTestModule injects the options module and uses the const import to inject in the options.

```typescript
// ...nestjs and async module imports
import { createOptionsModule } from "@jbiskur/nestjs-options-module-factory";

@Module({
  providers: [InnerTestService]
})
class InnerTestModule extends createAsyncModule<Options>() {}

@Module({})
class TestModule extends AsyncModule {
  public static registerAsync(options: AsyncOptions<Options>): DynamicModule {
    const optionsModule = createOptionsModule(OPTIONS_NAME, options);

    return this.doRegisterAsync(TestModule, null, null, {
      imports: [
        optionsModule,
        InnerTestModule.registerAsync({
          imports: [optionsModule],
          inject: [OPTIONS_NAME],
          useFactory: (outerOptions: Options) => ({ value: outerOptions.value })
        }, InnerTestModule)
      ],
      providers: [TestService]
    });
  }
}
```

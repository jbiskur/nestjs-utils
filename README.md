![Tests](https://github.com/jbiskur/nestjs-utils/workflows/Tests/badge.svg)

# NestJS Utils

This project was generated using [Nx](https://nx.dev).

The NestJS utilities libraries can be used to speed up NestJS
development.

[toc]: # "Table Of Content"

# Table Of Content

- [Test Utilities](#test-utilities)
- [Simple Async Module](#simple-async-module)
- [Options Module Factory](#options-module-factory)

## Test Utilities

The test utilities contain a set of builders that should speed up testing using method chaining and make the tests more descriptive.

install using npm

```npm
npm install --save-dev @jbiskur/nestjs-test-utilities
```

or using yarn

```npm
yarn add --dev @jbiskur/nestjs-test-utilities
```

more info [here](./packages/nestjs-test-utilities/README.md)

## Async Module

The async module is a simple utility class that helps create dynamic modules

install using npm

```npm
npm install @jbiskur/nestjs-async-module
```

or using yarn

```npm
yarn add @jbiskur/nestjs-async-module
```

more info [here](./packages/nestjs-async-module/README.md)

## Options Module Factory

The options module factory allows passing options to modules imported into the current module's context by creating a module and exporting the options; these can then be passed to the modules.

install using npm

```npm
npm install @jbiskur/nestjs-options-module-factory @jbiskur/nestjs-async-module
```

or using yarn

```npm
yarn add @jbiskur/nestjs-options-module-factory @jbiskur/nestjs-async-module
```

more info [here](./packages/nestjs-options-module-factory/README.md)

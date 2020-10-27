import { INestApplication } from "@nestjs/common";
import {
  BaseApplicationBuilder,
  NestApplicationBuilderInterface,
} from "./application.builder";
import {
  ExtendedModule,
  TestModuleA,
  TestModuleB,
} from "../test-data/test-module.data";
import {
  ExtendedService,
  SERVICE_B_RESPONSE,
  TestServiceA,
  TestServiceB,
} from "../test-data/test-service.data";
import { TestModuleBuilder } from "../module";
import { ApplicationBuilderOverrideBy } from "./application-builder-override-by";

describe("Application Builder", () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  it("module and service should be defined", async () => {
    app = await new BaseApplicationBuilder()
      .withTestModule((builder) => builder.withModule(TestModuleA))
      .build();

    const testModuleA = app.get(TestModuleA);
    const testServiceA = await app.resolve(TestServiceA);

    expect(testModuleA).toBeDefined();
    expect(testServiceA).toBeDefined();
  });

  describe("With Overrides", () => {
    const mockedOutput = "Hello from a mocked service";
    let TestServiceMock: jest.Mock<TestServiceA, TestServiceA[]>;

    beforeAll(() => {
      TestServiceMock = jest
        .fn<TestServiceA, TestServiceA[]>()
        .mockImplementation(() => ({
          helloFromA: () => mockedOutput,
        }));
    });

    it("should work to override a provider using class", async () => {
      app = await new BaseApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withOverrideProvider(TestServiceA, (overrideWith) =>
          overrideWith.useClass(TestServiceMock)
        )
        .build();

      const sut = await app.resolve(TestServiceA);
      expect(sut.helloFromA()).toBe(mockedOutput);
    });

    it("should work to override a provider using factory", async () => {
      app = await new BaseApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withOverrideProvider(TestServiceA, (overrideWith) =>
          overrideWith.useFactory({
            factory: () => new TestServiceMock(),
          })
        )
        .build();

      const sut = await app.resolve(TestServiceA);
      expect(sut.helloFromA()).toBe(mockedOutput);
    });

    it("should work to override a provider using a value", async () => {
      app = await new BaseApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withOverrideProvider(TestServiceA, (overrideWith) =>
          overrideWith.useValue(new TestServiceMock())
        )
        .build();

      const sut = await app.resolve(TestServiceA);
      expect(sut.helloFromA()).toBe(mockedOutput);
    });
  });

  describe("Extended Builder", () => {
    const mockedOutput = "Hello from a mocked service";
    let TestServiceMock: jest.Mock<TestServiceB, TestServiceB[]>;

    beforeAll(() => {
      TestServiceMock = jest
        .fn<TestServiceB, TestServiceB[]>()
        .mockImplementation(() => ({
          helloFromB: () => mockedOutput,
        }));
    });

    class NestApplicationBuilder
      implements NestApplicationBuilderInterface<NestApplicationBuilder> {
      private baseBuilder: BaseApplicationBuilder = new BaseApplicationBuilder();

      withExtendedModuleA(): NestApplicationBuilder {
        this.baseBuilder.withTestModule((builder) =>
          builder.withModule(ExtendedModule)
        );
        return this;
      }

      withSomeCentralModule(): NestApplicationBuilder {
        this.baseBuilder.withTestModule((builder) =>
          builder.withModule(TestModuleB)
        );
        return this;
      }

      withTestModule(
        testModuleBuilder: (builder: TestModuleBuilder) => TestModuleBuilder
      ): NestApplicationBuilder {
        this.baseBuilder.withTestModule(testModuleBuilder);
        return this;
      }

      async build(): Promise<INestApplication> {
        return this.baseBuilder.build();
      }

      withOverrideProvider<T>(
        typeOrToken: T,
        overrideBy: (
          overrideWith: ApplicationBuilderOverrideBy
        ) => ApplicationBuilderOverrideBy
      ): NestApplicationBuilder {
        this.baseBuilder.withOverrideProvider(typeOrToken, overrideBy);
        return this;
      }
    }

    it("should work to extend the builder", async () => {
      app = await new NestApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withExtendedModuleA()
        .withSomeCentralModule()
        .build();

      const extendedService = await app.resolve(ExtendedService);
      const serviceB = await app.resolve(TestServiceB);

      expect(extendedService.getRandomNumber()).toBeGreaterThanOrEqual(0.0);
      expect(extendedService.getRandomNumber()).toBeLessThanOrEqual(1.0);
      expect(serviceB.helloFromB()).toBe(SERVICE_B_RESPONSE);
    });

    it("should work with overrides", async () => {
      app = await new NestApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withSomeCentralModule()
        .withOverrideProvider(TestServiceB, (overrideWith) =>
          overrideWith.useClass(TestServiceMock)
        )
        .withExtendedModuleA()
        .build();

      const extendedService = await app.resolve(ExtendedService);
      const serviceB = await app.resolve(TestServiceB);

      expect(extendedService.getRandomNumber()).toBeGreaterThanOrEqual(0.0);
      expect(extendedService.getRandomNumber()).toBeLessThanOrEqual(1.0);
      expect(serviceB.helloFromB()).toBe(mockedOutput);
    });
  });
});

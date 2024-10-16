import { INestApplication, Injectable, Module } from "@nestjs/common";
import { Transport } from "@nestjs/microservices";
import supertest from "supertest";
import { MicroserviceA, MicroserviceB } from "../test-data/";
import {
  ExtendedModule,
  TestModuleA,
  TestModuleB,
} from "../test-data/test-module.data";
import {
  ExtendedService,
  MicroserviceTestingService,
  SERVICE_B_RESPONSE,
  TestServiceA,
  TestServiceB,
} from "../test-data/test-service.data";
import {
  INestApplicationBuilderPlugin,
  NestApplicationBuilder,
} from "./application.builder";
import { GlobalInterceptor, TestModule } from "../test-data/global-intercepter";

describe("Application Builder", () => {
  let app: INestApplication;

  afterEach(async () => {
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

  it("should work with global interceptors", async () => {
    const interceptor = new GlobalInterceptor();
    app = await new NestApplicationBuilder()
      .withTestModule((builder) => builder.withModule(TestModule))
      .withGlobalInterceptors([interceptor])
      .build();

    const superTest = await supertest(app.getHttpServer()).get("/");

    expect(superTest.text).toBe("hello world");
    expect(interceptor.wasCalled()).toBe(true);
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
      app = await new NestApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withOverrideProvider(TestServiceA, (overrideWith) =>
          overrideWith.useClass(TestServiceMock)
        )
        .build();

      const sut = await app.resolve(TestServiceA);
      expect(sut.helloFromA()).toBe(mockedOutput);
    });

    it("should work to override a provider using factory", async () => {
      app = await new NestApplicationBuilder()
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
      app = await new NestApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withOverrideProvider(TestServiceA, (overrideWith) =>
          overrideWith.useValue(new TestServiceMock())
        )
        .build();

      const sut = await app.resolve(TestServiceA);
      expect(sut.helloFromA()).toBe(mockedOutput);
    });

    it("should work to override a module", async () => {
      @Injectable()
      class OGService {
        hello() {
          return "hello";
        }
      }

      @Module({
        providers: [OGService],
      })
      class OGModule {}

      @Injectable()
      class MockService {
        hello() {
          return mockedOutput;
        }
      }

      @Module({
        providers: [{
          provide: OGService,
          useClass: MockService,
        }],
      })
      class MockModule {}


      @Module({
        imports: [OGModule],
      })
      class AppModule {}

      app = await new NestApplicationBuilder()
        .withTestModule((builder) => builder.withModule(AppModule))
        .overrideModule(AppModule, OGModule, MockModule)
        .build();

      const sut = await app.resolve(OGService);
      expect(sut.hello()).toBe(mockedOutput);
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

    class GraphQL implements INestApplicationBuilderPlugin {
      run(appBuilder: NestApplicationBuilder): void {
        appBuilder.withTestModule((builder) => builder.withModule(TestModuleB));
      }

      withOptions(): this {
        return this;
      }
    }

    class TypeORMConnection implements INestApplicationBuilderPlugin {
      run(appBuilder: NestApplicationBuilder): void {
        appBuilder.withTestModule((builder) => builder.withModule(TestModuleB));
      }
    }

    class ExtendedNestApplicationBuilder extends NestApplicationBuilder {
      withExtendedModuleA(): this {
        this.withTestModule((builder) => builder.withModule(ExtendedModule));
        return this;
      }
    }

    it("should work to extend the builder", async () => {
      app = await new ExtendedNestApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .withExtendedModuleA()
        .with(GraphQL, (builder) => builder.withOptions())
        .with(TypeORMConnection)
        .build();

      const extendedService = await app.resolve(ExtendedService);
      const serviceB = await app.resolve(TestServiceB);

      expect(extendedService.getRandomNumber()).toBeGreaterThanOrEqual(0.0);
      expect(extendedService.getRandomNumber()).toBeLessThanOrEqual(1.0);
      expect(serviceB.helloFromB()).toBe(SERVICE_B_RESPONSE);
    });

    it("should work with overrides", async () => {
      app = await new ExtendedNestApplicationBuilder()
        .withTestModule((builder) => builder.withModule(TestModuleA))
        .with(GraphQL)
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

describe("should work to build as microservice", () => {
  let microservice: INestApplication;
  let app: INestApplication;
  let interceptor: GlobalInterceptor;

  beforeAll(async () => {
    interceptor = new GlobalInterceptor();
    microservice = await new NestApplicationBuilder()
      .withTestModule((builder) => builder.withModule(MicroserviceA).withModule(TestModule))
      .withGlobalInterceptors([interceptor])
      .buildAsMicroservice({
        transport: Transport.TCP,
      });
  });

  afterAll(async () => {
    await microservice.close();
  });

  beforeEach(async () => {
    app = await new NestApplicationBuilder()
      .withTestModule((builder) => builder.withModule(MicroserviceB))
      .build();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should get message through nest microservice", async () => {
    const sut = await app.resolve(MicroserviceTestingService);

    expect(sut.sum([1, 2, 3, 4, 5])).toBe(15);
  });

  it("should work with global interceptors", async () => {
    const superTest = await supertest(microservice.getHttpServer()).get("/");

    expect(superTest.text).toBe("hello world");
    expect(interceptor.wasCalled()).toBe(true);
  });
});

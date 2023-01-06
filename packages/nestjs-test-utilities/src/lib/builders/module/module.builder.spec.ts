import { TestModuleBuilder } from "./module.builder";
import { TestModuleA, TestModuleB } from "../test-data/test-module.data";
import {
  SERVICE_A_RESPONSE,
  SERVICE_B_RESPONSE,
  TestServiceA,
  TestServiceB,
} from "../test-data/test-service.data";
import { Injectable, Module } from "@nestjs/common";

@Injectable()
class TestServiceC {}

describe("Module Builder", () => {
  it("should be able to build a fully functioning NestJS module", async () => {
    const module = await new TestModuleBuilder()
      .withModule(TestModuleA)
      .withModule(TestModuleB)
      .build()
      .compile();

    const serviceA = module.get(TestServiceA);
    const serviceB = module.get(TestServiceB);

    expect(await serviceA.helloFromA()).toBe(SERVICE_A_RESPONSE);
    expect(await serviceB.helloFromB()).toBe(SERVICE_B_RESPONSE);
  });

  it("should include providers passed to the builder", async () => {
    const module = await new TestModuleBuilder()
      .withModule(TestModuleA)
      .withProvider(TestServiceB)
      .withRootProvider(TestServiceC)
      .build()
      .compile();

    const serviceA = module.get(TestServiceA);
    const serviceB = await module.resolve(TestServiceB);
    const serviceC = await module.resolve(TestServiceC);

    expect(await serviceA.helloFromA()).toBe(SERVICE_A_RESPONSE);
    expect(await serviceB.helloFromB()).toBe(SERVICE_B_RESPONSE);

    expect(serviceC).toBeDefined();
  });

  it("should be able to override a module", async () => {
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
        return "mocked hello";
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

    const module = await new TestModuleBuilder()
      .withModule(AppModule)
      .overrideModule(AppModule, OGModule, MockModule)
      .build()
      .compile();

    const service = module.get(OGService);

    expect(await service.hello()).toBe("mocked hello");
  });
});

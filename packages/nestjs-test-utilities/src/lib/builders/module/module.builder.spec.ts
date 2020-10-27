import { TestModuleBuilder } from "./module.builder";
import { TestModuleA, TestModuleB } from "../test-data/test-module.data";
import {
  SERVICE_A_RESPONSE,
  SERVICE_B_RESPONSE,
  TestServiceA,
  TestServiceB,
} from "../test-data/test-service.data";

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
});

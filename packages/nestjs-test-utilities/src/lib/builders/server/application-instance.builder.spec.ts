import fetch from "cross-fetch";
import {
  ApplicationInstance,
  ApplicationInstanceBuilder,
} from "./application-instance.builder";
import {
  NestApplicationBuilder,
} from '../application';
import {
  ModuleWithController,
  SERVICE_A_RESPONSE,
  TestServiceA,
} from "../test-data";
import { INestApplication } from "@nestjs/common";
import { Mock } from "moq.ts";

describe("Application Server Instance", () => {
  describe.each([
    [undefined, 3333],
    [8765, 8765],
  ])("with port %s expected to be %i", (port, expected) => {
    let app: ApplicationInstance;
    let instance: INestApplication;

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
      expect(await result.text()).toBe(SERVICE_A_RESPONSE);
    });
  });

  describe("With extended builder", () => {
    const mockedResponse = "Hello from a mocked ServiceA";
    const MockedServiceA = new Mock<TestServiceA>()
      .setup((instance) => instance.helloFromA())
      .returns(mockedResponse);

    class ExtendedBuilder extends NestApplicationBuilder {
      withOverriddenTestServiceA(): this {
        this.withOverrideProvider(TestServiceA, (overrideWith) =>
          overrideWith.useValue(MockedServiceA.object())
        );
        return this;
      }
    }

    let app: ApplicationInstance;
    let instance: INestApplication;

    beforeAll(async () => {
      app = await new ApplicationInstanceBuilder(
        new ExtendedBuilder()
          .withTestModule((builder) => builder.withModule(ModuleWithController))
          .withOverriddenTestServiceA()
      ).build();

      instance = app.instance;
    });

    afterAll(async () => {
      await instance.close();
    });

    it("should respond with the mocked response from extended builder", async () => {
      const result: Response = await fetch(`http://localhost:${app.port}/`);
      expect(await result.text()).toBe(mockedResponse);
    });
  });
});

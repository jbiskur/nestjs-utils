import fetch from "cross-fetch";
import {
  ApplicationInstance,
  ApplicationInstanceBuilder,
} from "./application-instance.builder";
import {
  ApplicationBuilderOverrideBy,
  NestApplicationBuilder,
  NestApplicationBuilderInterface,
} from "../application";
import {
  ModuleWithController,
  SERVICE_A_RESPONSE,
  TestServiceA,
} from "../test-data";
import { INestApplication } from "@nestjs/common";
import { Mock } from "moq.ts";
import { TestModuleBuilder } from "@jbiskur/nestjs-test-utilities";

describe("Application Server Instance", () => {
  describe.each([
    [undefined, 3333],
    [8080, 8080],
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

    class ExtendedBuilder
      implements NestApplicationBuilderInterface<ExtendedBuilder> {
      private builder: NestApplicationBuilder = new NestApplicationBuilder();

      async build(): Promise<INestApplication> {
        return this.builder.build();
      }

      withOverrideProvider<T>(
        typeOrToken: T,
        overrideBy: (
          overrideWith: ApplicationBuilderOverrideBy
        ) => ApplicationBuilderOverrideBy
      ): ExtendedBuilder {
        this.builder.withOverrideProvider(typeOrToken, overrideBy);
        return this;
      }

      withTestModule(
        testModuleBuilder: (builder: TestModuleBuilder) => TestModuleBuilder
      ): ExtendedBuilder {
        this.builder.withTestModule(testModuleBuilder);
        return this;
      }

      withOverriddenTestServiceA(): ExtendedBuilder {
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

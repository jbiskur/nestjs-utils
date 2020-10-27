import { Module } from "@nestjs/common";
import {
  ExtendedService,
  TestServiceA,
  TestServiceB,
} from "./test-service.data";
import { ExampleController } from "./test-controller.data";

@Module({
  providers: [TestServiceA],
})
export class TestModuleA {}

@Module({
  providers: [TestServiceB],
})
export class TestModuleB {}

@Module({
  providers: [ExtendedService],
})
export class ExtendedModule {}

@Module({
  controllers: [ExampleController],
  providers: [TestServiceA],
})
export class ModuleWithController {}

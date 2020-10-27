import { Controller, Get } from "@nestjs/common";
import { TestServiceA } from "./test-service.data";

@Controller()
export class ExampleController {
  constructor(private readonly testService: TestServiceA) {}

  @Get()
  async getExample(): Promise<string> {
    return this.testService.helloFromA();
  }
}

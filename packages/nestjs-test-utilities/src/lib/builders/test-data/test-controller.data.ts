import { Controller, Get } from "@nestjs/common";
import { TestServiceA } from "./test-service.data";
import { MessagePattern } from "@nestjs/microservices";

@Controller()
export class ExampleController {
  constructor(private readonly testService: TestServiceA) {}

  @Get()
  async getExample(): Promise<string> {
    return this.testService.helloFromA();
  }
}

@Controller()
export class MicroserviceAController {
  @MessagePattern({ cmd: "sum" })
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}

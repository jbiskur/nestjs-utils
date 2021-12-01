import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

export const SERVICE_A_RESPONSE = "Hello from Service A";
export const SERVICE_B_RESPONSE = "Hello from Service B";

@Injectable()
export class TestServiceA {
  helloFromA(): string {
    return SERVICE_A_RESPONSE;
  }
}

@Injectable()
export class TestServiceB {
  helloFromB(): string {
    return SERVICE_B_RESPONSE;
  }
}

@Injectable()
export class ExtendedService {
  getRandomNumber(): number {
    return Math.random();
  }
}

@Injectable()
export class MicroserviceTestingService implements OnApplicationBootstrap {
  constructor(@Inject("MATH_SERVICE") private client: ClientProxy) {}

  async onApplicationBootstrap() {
    await this.client.connect();
  }

  sum(numbers: number[]) {
    return (numbers || []).reduce((a, b) => a + b);
  }
}

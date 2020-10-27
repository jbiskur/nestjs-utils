import { Injectable } from "@nestjs/common";

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

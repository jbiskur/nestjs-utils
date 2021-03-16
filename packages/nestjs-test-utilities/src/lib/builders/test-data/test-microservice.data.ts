import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import {
  MicroserviceAController, MicroserviceTestingService
} from "../test-data";

@Module({
  controllers: [MicroserviceAController],
})
export class MicroserviceA {}

@Module({
  providers: [
    MicroserviceTestingService
  ],
  imports: [
    ClientsModule.register([
      {
        name: "MATH_SERVICE", transport: Transport.TCP
      }
    ])
  ]
})
export class MicroserviceB {}

import { INestApplication } from "@nestjs/common";
import { NestApplicationBuilder } from '../application';

export interface ApplicationInstance {
  port: number;
  instance: INestApplication;
}

export class ApplicationInstanceBuilder {
  private applicationBuilder: NestApplicationBuilder;

  constructor(applicationBuilder: NestApplicationBuilder) {
    this.applicationBuilder = applicationBuilder;
  }

  async build(port = 3333): Promise<ApplicationInstance> {
    const application = await this.applicationBuilder.build();
    await application.listen(port);

    return {
      port: port,
      instance: application,
    };
  }
}

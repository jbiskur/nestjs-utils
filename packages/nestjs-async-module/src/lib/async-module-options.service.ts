import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { MetadataScanner, ModuleRef, ModulesContainer } from "@nestjs/core";
import { DiscoveryService } from "@golevelup/nestjs-discovery";
import {faker} from "@faker-js/faker";

export const createOptionsToken = (token?: string) => {
  if (token) {
    return `${token.toUpperCase()}`;
  }

  return `${faker.string.alpha({
    length: 10,
  }).toUpperCase()}_OPTIONS`;
};

@Injectable()
// eslint-disable-next-line @typescript-eslint/ban-types
export class ModuleOptions<TOptions extends {}> implements OnModuleInit {
  public options: TOptions = {} as TOptions;
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly moduleContainer: ModulesContainer
  ) {}

  get(): TOptions {
    if (Object.keys(this.options).length === 0) {
      throw new NotFoundException(
        "No module options has been found when they are requested"
      );
    }
    return this.options;
  }

  async populateOptions() {
    const metadataScanner = await this.moduleRef.create(MetadataScanner);
    const discoveryService = new DiscoveryService(
      this.moduleContainer,
      metadataScanner
    );

    const optionsModuleMatch = new RegExp("_OPTIONS");

    const discoveredOptions = await discoveryService.providers((provider) => {
      if (typeof provider.name === "string") {
        return optionsModuleMatch.test(provider.name);
      }

      return false;
    });

    discoveredOptions.forEach((option) => {
      if (typeof option.instance === "object") {
        this.options = {
          ...this.options,
          ...option.instance,
        };
      }
    });
  }

  async onModuleInit() {
    await this.populateOptions();
  }
}

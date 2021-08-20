import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { MetadataScanner, ModuleRef, ModulesContainer } from "@nestjs/core";
import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxy", 10);
export const createOptionsToken = (token?: string) => {
  if (token) {
    return `${token.toUpperCase()}`;
  }

  return `${nanoid().toUpperCase()}_OPTIONS`;
}

@Injectable()
export class ModuleOptions<TOptions> implements OnModuleInit {
  public options: TOptions = {} as TOptions;
  private foundModules: string[] = [];
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly moduleContainer: ModulesContainer
  ) {}

  get(): TOptions {
    if (Object.keys(this.options).length === 0) {
      throw new NotFoundException(this.foundModules, "No module options has been found when they are requested");
    }
    return this.options;
  }

  async onModuleInit() {
    const metadataScanner = await this.moduleRef.create(MetadataScanner);
    const discoveryService = new DiscoveryService(
      this.moduleContainer,
      metadataScanner
    );

    const optionsModuleMatch = new RegExp("_OPTIONS");

    const discoveredOptions =
      await discoveryService.providers((provider) => {
        if (typeof provider.name === "string") {
          this.foundModules.push(provider.name);
          return optionsModuleMatch.test(provider.name)
        }

        return false;
      });

    discoveredOptions.forEach(option => {
      if (typeof option.instance === "object") {
        this.options = {
          ...this.options,
          ...option.instance
        }
      }
    });
  }


}

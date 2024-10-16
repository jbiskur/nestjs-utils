import { CallHandler, Controller, ExecutionContext, Get, Module, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

export class GlobalInterceptor implements NestInterceptor {
  called = false;
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.called = true;
    return next.handle();
  }

  wasCalled() {
    return this.called;
  }
}

@Controller()
export class TestController {
  @Get()
  async getExample(): Promise<string> {
    return "hello world";
  }
}

@Module({
  controllers: [TestController],
})
export class TestModule {}
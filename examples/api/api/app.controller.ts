import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/api')
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/api')
  postHello(): string {
    return this.appService.getHello();
  }

  @Get('/')
  async home(): Promise<string> {
    return Promise.resolve('hello ditejs');
  }
}

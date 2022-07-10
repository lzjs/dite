import { Controller, Get } from '@nestjs/common';
import { PageService } from './page.service';

@Controller('/page')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get('/api')
  getHello(): string {
    return this.pageService.getHello();
  }

  @Get('/')
  async home(): Promise<string> {
    return Promise.resolve('hello ditejs');
  }
}

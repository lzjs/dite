import { Controller, Get } from '@nestjs/common';
import { TagService } from './tag.service';

@Controller('/tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get('/api')
  getHello(): string {
    return this.tagService.getHello();
  }

  @Get('/')
  async home(): Promise<string> {
    return Promise.resolve('hello ditejs');
  }
}

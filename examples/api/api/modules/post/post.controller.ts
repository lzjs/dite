import { Controller, Get } from '@nestjs/common';
import { PostService } from './post.service';

@Controller('/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/api')
  getHello(): string {
    return this.postService.getHello();
  }

  @Get('/')
  async home(): Promise<string> {
    return Promise.resolve('hello ditejs');
  }
}

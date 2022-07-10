import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('/api')
  getHello(): string {
    return this.categoryService.getHello();
  }

  @Get('/')
  async home(): Promise<string> {
    return Promise.resolve('hello ditejs');
  }
}

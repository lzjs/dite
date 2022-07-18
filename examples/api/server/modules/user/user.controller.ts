import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('/user')
export class UserController {
  constructor(private readonly appService: UserService) {}

  @Get('/api')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/')
  async home(): Promise<string> {
    return Promise.resolve('hello ditejs');
  }
}

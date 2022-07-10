import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoryModule } from './modules/category/category.module';
import { PageModule } from './modules/page/page.module';
import { PostModule } from './modules/post/post.module';
import { TagModule } from './modules/tag/tag.module';
import { UserModule } from './modules/user/user.module';
import { RenderController } from './render.controller';

@Module({
  imports: [PostModule, PageModule, TagModule, CategoryModule, UserModule],
  controllers: [AppController, RenderController],
  providers: [AppService],
})
export class AppModule {}

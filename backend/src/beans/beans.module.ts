import { Module } from '@nestjs/common';
import { BeansController } from './beans.controller.js';
import { BeansService } from './beans.service.js';

@Module({
  controllers: [BeansController],
  providers: [BeansService],
  exports: [BeansService],
})
export class BeansModule {}

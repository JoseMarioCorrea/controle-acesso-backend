import { Module } from '@nestjs/common';
import { IdfaceService } from './idface.service';
import { IdfaceController } from './idface.controller';

@Module({
  controllers: [IdfaceController],
  providers: [IdfaceService],
})
export class IdfaceModule {}

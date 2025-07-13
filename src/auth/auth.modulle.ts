// src/auth/auth.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OauthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [OauthService],
  controllers: [AuthController],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly oauth: OauthService) {}

  async onModuleInit() {
    await this.oauth.seedAdmin();
  }
}
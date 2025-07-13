// src/auth/auth.controller.ts
import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { OauthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(private readonly oauth: OauthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.oauth.login(dto);
  }
}
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GuestAuthDto } from './dto/guest-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { Actor } from '../common/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('guest')
  loginAsGuest(@Body() dto: GuestAuthDto) {
    return this.authService.loginAsGuest(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentActor() actor: Actor) {
    return this.authService.getMe(actor);
  }
}

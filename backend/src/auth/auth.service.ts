import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GuestAuthDto } from './dto/guest-auth.dto';
import { JwtPayload } from './jwt-payload.interface';
import { Actor } from '../common/types';

export interface AuthResult {
  accessToken: string;
  actor: Actor;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
    });

    return this.issueUserToken(user.id, user.name);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueUserToken(user.id, user.name);
  }

  async loginAsGuest(dto: GuestAuthDto): Promise<AuthResult> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { token: dto.token },
      include: { calendar: true },
    });
    if (!shareLink) {
      throw new NotFoundException('Share link not found or revoked');
    }

    // Upsert guest by (shareLinkId, name)
    const guest = await this.prisma.guest.upsert({
      where: {
        shareLinkId_name: { shareLinkId: shareLink.id, name: dto.name },
      },
      update: {},
      create: {
        shareLinkId: shareLink.id,
        name: dto.name,
      },
    });

    const payload: JwtPayload = {
      sub: guest.id,
      type: 'guest',
      name: guest.name,
      calendarId: shareLink.calendarId,
      shareLinkId: shareLink.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('GUEST_JWT_EXPIRES_IN', '30d'),
    });

    return {
      accessToken,
      actor: {
        type: 'guest',
        id: guest.id,
        name: guest.name,
        calendarId: shareLink.calendarId,
        shareLinkId: shareLink.id,
      },
    };
  }

  async getMe(actor: Actor): Promise<{ id: string; name: string; type: string; email?: string }> {
    if (actor.type === 'guest') {
      return { id: actor.id, name: actor.name, type: 'guest' };
    }
    const user = await this.prisma.user.findUnique({
      where: { id: actor.id },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { ...user, type: 'user' };
  }

  private async issueUserToken(userId: string, name: string): Promise<AuthResult> {
    const payload: JwtPayload = { sub: userId, type: 'user', name };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    });
    return {
      accessToken,
      actor: { type: 'user', id: userId, name },
    };
  }
}

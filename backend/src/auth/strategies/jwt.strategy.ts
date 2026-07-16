import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../jwt-payload.interface';
import { Actor } from '../../common/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev_secret_change_me'),
    });
  }

  async validate(payload: JwtPayload): Promise<Actor> {
    if (!payload.sub || !payload.type) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      type: payload.type,
      id: payload.sub,
      name: payload.name,
      calendarId: payload.calendarId,
      shareLinkId: payload.shareLinkId,
    };
  }
}

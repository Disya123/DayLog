export interface JwtPayload {
  sub: string;
  type: 'user' | 'guest';
  name: string;
  calendarId?: string;
  shareLinkId?: string;
}

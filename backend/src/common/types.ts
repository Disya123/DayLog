export type ActorType = 'user' | 'guest';

export interface Actor {
  type: ActorType;
  id: string;
  name: string;
  /** Для гостя — к какому календарю привязан */
  calendarId?: string;
  shareLinkId?: string;
}

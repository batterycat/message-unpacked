interface Env {
  ROOM: DurableObjectNamespace;
  ROOM_CREATES: RateLimit;
  TICKET_ATTEMPTS: RateLimit;
  LIVE_ROOMS_ENABLED?: string;
  ALLOWED_ORIGINS?: string;
  MAX_PARTICIPANTS?: string;
  MAX_CASES?: string;
  ROOM_TTL_MINUTES?: string;
  MAX_CHOICES_PER_CASE?: string;
  MAX_MESSAGE_BYTES?: string;
}

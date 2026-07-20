export type RoomServiceLimits = {
  maxCases: number;
  maxChoicesPerCase: number;
  maxMessageBytes: number;
  maxParticipants: number;
  roomTtlMinutes: number;
};

export type RoomServiceConfig = {
  allowedOrigins: string[];
  enabled: boolean;
  limits: RoomServiceLimits;
};

export type RoomServiceConfigResult =
  | { ok: true; value: RoomServiceConfig }
  | {
      ok: false;
      error: { code: 'config-invalid'; field: string };
    };

type RoomServiceEnvironment = Record<string, string | undefined>;

const defaults: RoomServiceLimits = {
  maxCases: 10,
  maxChoicesPerCase: 6,
  maxMessageBytes: 4096,
  maxParticipants: 60,
  roomTtlMinutes: 120,
};

type NumericSetting = {
  envName: string;
  key: keyof RoomServiceLimits;
  minimum: number;
  maximum: number;
};

const numericSettings: readonly NumericSetting[] = [
  {
    envName: 'MAX_PARTICIPANTS',
    key: 'maxParticipants',
    minimum: 1,
    maximum: 500,
  },
  { envName: 'MAX_CASES', key: 'maxCases', minimum: 1, maximum: 50 },
  {
    envName: 'ROOM_TTL_MINUTES',
    key: 'roomTtlMinutes',
    minimum: 5,
    maximum: 1440,
  },
  {
    envName: 'MAX_CHOICES_PER_CASE',
    key: 'maxChoicesPerCase',
    minimum: 2,
    maximum: 10,
  },
  {
    envName: 'MAX_MESSAGE_BYTES',
    key: 'maxMessageBytes',
    minimum: 512,
    maximum: 16_384,
  },
];

function invalid(field: string): RoomServiceConfigResult {
  return { ok: false, error: { code: 'config-invalid', field } };
}

function parseEnabled(
  value: string | undefined,
): boolean | RoomServiceConfigResult {
  if (value === undefined || value === 'false') return false;
  if (value === 'true') return true;
  return invalid('LIVE_ROOMS_ENABLED');
}

function parseOrigins(value: string | undefined): string[] | null {
  if (value === undefined || value.trim() === '') return [];

  const origins = value.split(',').map((origin) => origin.trim());
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (
        (url.protocol !== 'https:' && url.protocol !== 'http:') ||
        url.origin !== origin ||
        url.username !== '' ||
        url.password !== ''
      ) {
        return null;
      }
    } catch {
      return null;
    }
  }

  return [...new Set(origins)];
}

export function loadRoomServiceConfig(
  environment: RoomServiceEnvironment,
): RoomServiceConfigResult {
  const enabled = parseEnabled(environment.LIVE_ROOMS_ENABLED);
  if (typeof enabled !== 'boolean') return enabled;

  const allowedOrigins = parseOrigins(environment.ALLOWED_ORIGINS);
  if (allowedOrigins === null || (enabled && allowedOrigins.length === 0)) {
    return invalid('ALLOWED_ORIGINS');
  }

  const limits = { ...defaults };
  for (const setting of numericSettings) {
    const rawValue = environment[setting.envName];
    if (rawValue === undefined) continue;
    const value = Number(rawValue);
    if (
      !Number.isInteger(value) ||
      value < setting.minimum ||
      value > setting.maximum
    ) {
      return invalid(setting.envName);
    }
    limits[setting.key] = value;
  }

  return {
    ok: true,
    value: { allowedOrigins, enabled, limits },
  };
}

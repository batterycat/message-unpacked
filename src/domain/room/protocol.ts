import { z } from 'zod';

import { supportedLocales } from '../locales';

export const ROOM_PROTOCOL_VERSION = 1 as const;

const positiveIntegerSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
const nonnegativeIntegerSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
const timestampSchema = positiveIntegerSchema;

export const roomStableIdSchema = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);

export const roomCodeSchema = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/);

const contentVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
const opaqueSecretSchema = z
  .string()
  .min(22)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/);
const teacherSecretSchema = opaqueSecretSchema.min(43);

export const roomRoles = ['teacher', 'student'] as const;
export const roomPhases = [
  'lobby',
  'open',
  'revealed',
  'summary',
  'ended',
] as const;

export type RoomRole = (typeof roomRoles)[number];
export type RoomPhase = (typeof roomPhases)[number];

const roomChoiceIdsSchema = z
  .array(roomStableIdSchema)
  .min(1)
  .refine((choiceIds) => new Set(choiceIds).size === choiceIds.length, {
    message: 'Choice IDs must be unique within a live room case.',
  });

export const roomActivityCaseSchema = z.strictObject({
  id: roomStableIdSchema,
  contentVersion: contentVersionSchema,
  choiceIds: roomChoiceIdsSchema,
});

export const roomActivityManifestSchema = z
  .strictObject({
    protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
    locale: z.enum(supportedLocales),
    cases: z.array(roomActivityCaseSchema).min(1),
  })
  .refine(
    (manifest) =>
      new Set(manifest.cases.map((activityCase) => activityCase.id)).size ===
      manifest.cases.length,
    { message: 'Case IDs must be unique within a live room manifest.' },
  );

export type RoomActivityCase = z.infer<typeof roomActivityCaseSchema>;
export type RoomActivityManifest = z.infer<typeof roomActivityManifestSchema>;

export function parseRoomActivityManifest(
  value: unknown,
): RoomActivityManifest | null {
  const parsed = roomActivityManifestSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const roomPolicySchema = z.strictObject({
  maxParticipants: positiveIntegerSchema,
  maxCases: positiveIntegerSchema,
  maxChoicesPerCase: positiveIntegerSchema,
  roomLifetimeSeconds: positiveIntegerSchema,
  maxMessageBytes: positiveIntegerSchema,
  ticketLifetimeSeconds: positiveIntegerSchema,
  maxPendingConnections: positiveIntegerSchema,
  pendingConnectionTimeoutSeconds: positiveIntegerSchema,
  roomCreatesPerMinute: positiveIntegerSchema,
  ticketAttemptsPerMinute: positiveIntegerSchema,
  participantMessageBurst: positiveIntegerSchema,
  participantMessagesPerMinute: positiveIntegerSchema,
  roomMessagesPerMinute: positiveIntegerSchema,
  malformedFrameLimit: positiveIntegerSchema,
});

export type RoomPolicy = z.infer<typeof roomPolicySchema>;

export function parseRoomPolicy(value: unknown): RoomPolicy | null {
  const parsed = roomPolicySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const roomCapabilitiesSchema = z.strictObject({
  protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
  maxParticipants: positiveIntegerSchema,
  maxCases: positiveIntegerSchema,
  maxChoicesPerCase: positiveIntegerSchema,
  roomLifetimeSeconds: positiveIntegerSchema,
  maxMessageBytes: positiveIntegerSchema,
});

export type RoomCapabilities = z.infer<typeof roomCapabilitiesSchema>;

export function roomCapabilitiesFromPolicy(
  policy: RoomPolicy,
): RoomCapabilities {
  return {
    protocolVersion: ROOM_PROTOCOL_VERSION,
    maxParticipants: policy.maxParticipants,
    maxCases: policy.maxCases,
    maxChoicesPerCase: policy.maxChoicesPerCase,
    roomLifetimeSeconds: policy.roomLifetimeSeconds,
    maxMessageBytes: policy.maxMessageBytes,
  };
}

export function parseRoomCapabilities(value: unknown): RoomCapabilities | null {
  const parsed = roomCapabilitiesSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type RoomManifestValidationResult =
  | { success: true; manifest: RoomActivityManifest }
  | {
      success: false;
      reason: 'too-many-cases' | 'too-many-choices';
      caseId?: string;
    };

export function validateRoomActivityManifest(
  manifest: RoomActivityManifest,
  policy: RoomPolicy,
): RoomManifestValidationResult {
  if (manifest.cases.length > policy.maxCases) {
    return { success: false, reason: 'too-many-cases' };
  }

  const oversizedCase = manifest.cases.find(
    (activityCase) => activityCase.choiceIds.length > policy.maxChoicesPerCase,
  );
  if (oversizedCase) {
    return {
      success: false,
      reason: 'too-many-choices',
      caseId: oversizedCase.id,
    };
  }

  return { success: true, manifest };
}

export const createRoomRequestSchema = z.strictObject({
  protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
  manifest: roomActivityManifestSchema,
});

export const createRoomResponseSchema = z.strictObject({
  protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
  roomCode: roomCodeSchema,
  expiresAt: timestampSchema,
  teacherSecret: teacherSecretSchema,
});

const teacherTicketRequestSchema = z.strictObject({
  protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
  role: z.literal('teacher'),
  teacherSecret: teacherSecretSchema,
});

const studentTicketRequestSchema = z.strictObject({
  protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
  role: z.literal('student'),
  participantToken: opaqueSecretSchema.optional(),
});

export const roomTicketRequestSchema = z.discriminatedUnion('role', [
  teacherTicketRequestSchema,
  studentTicketRequestSchema,
]);

const ticketResponseBase = {
  protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
  ticket: opaqueSecretSchema,
  ticketExpiresAt: timestampSchema,
};

const teacherTicketResponseSchema = z.strictObject({
  ...ticketResponseBase,
  role: z.literal('teacher'),
});

const studentTicketResponseSchema = z.strictObject({
  ...ticketResponseBase,
  role: z.literal('student'),
  participantToken: opaqueSecretSchema.optional(),
});

export const roomTicketResponseSchema = z.discriminatedUnion('role', [
  teacherTicketResponseSchema,
  studentTicketResponseSchema,
]);

export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>;
export type CreateRoomResponse = z.infer<typeof createRoomResponseSchema>;
export type RoomTicketRequest = z.infer<typeof roomTicketRequestSchema>;
export type RoomTicketResponse = z.infer<typeof roomTicketResponseSchema>;

function parseWith<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseCreateRoomRequest(
  value: unknown,
): CreateRoomRequest | null {
  return parseWith(createRoomRequestSchema, value);
}

export function parseCreateRoomResponse(
  value: unknown,
): CreateRoomResponse | null {
  return parseWith(createRoomResponseSchema, value);
}

export function parseRoomTicketRequest(
  value: unknown,
): RoomTicketRequest | null {
  return parseWith(roomTicketRequestSchema, value);
}

export function parseRoomTicketResponse(
  value: unknown,
): RoomTicketResponse | null {
  return parseWith(roomTicketResponseSchema, value);
}

const versionedCommandBase = {
  protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
};

export const roomClientMessageSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...versionedCommandBase, type: z.literal('hello') }),
  z.strictObject({ ...versionedCommandBase, type: z.literal('open-case') }),
  z.strictObject({
    ...versionedCommandBase,
    type: z.literal('reveal-current'),
  }),
  z.strictObject({ ...versionedCommandBase, type: z.literal('show-summary') }),
  z.strictObject({ ...versionedCommandBase, type: z.literal('end-room') }),
  z.strictObject({
    ...versionedCommandBase,
    type: z.literal('answer'),
    caseId: roomStableIdSchema,
    choiceId: roomStableIdSchema,
  }),
]);

export type RoomClientMessage = z.infer<typeof roomClientMessageSchema>;
export type RoomCommand = Exclude<RoomClientMessage, { type: 'hello' }>;

export function parseRoomClientMessage(
  value: unknown,
): RoomClientMessage | null {
  return parseWith(roomClientMessageSchema, value);
}

const currentCaseReferenceSchema = z.strictObject({
  id: roomStableIdSchema,
  contentVersion: contentVersionSchema,
  position: positiveIntegerSchema,
});

const studentCurrentCaseSchema = z.strictObject({
  id: roomStableIdSchema,
  contentVersion: contentVersionSchema,
  position: positiveIntegerSchema,
  choiceIds: roomChoiceIdsSchema,
});

const teacherProjectionBase = {
  role: z.literal('teacher'),
  revision: nonnegativeIntegerSchema,
  participantCount: nonnegativeIntegerSchema,
  totalCaseCount: positiveIntegerSchema,
};

export const teacherRoomProjectionSchema = z.discriminatedUnion('phase', [
  z.strictObject({ ...teacherProjectionBase, phase: z.literal('lobby') }),
  z.strictObject({
    ...teacherProjectionBase,
    phase: z.literal('open'),
    currentCase: currentCaseReferenceSchema,
    answeredCount: nonnegativeIntegerSchema,
  }),
  z.strictObject({
    ...teacherProjectionBase,
    phase: z.literal('revealed'),
    currentCase: currentCaseReferenceSchema,
    answeredCount: nonnegativeIntegerSchema,
    counts: z.record(roomStableIdSchema, nonnegativeIntegerSchema),
  }),
  z.strictObject({
    ...teacherProjectionBase,
    phase: z.literal('summary'),
    results: z.array(
      z.strictObject({
        caseId: roomStableIdSchema,
        answeredCount: nonnegativeIntegerSchema,
        counts: z.record(roomStableIdSchema, nonnegativeIntegerSchema),
      }),
    ),
  }),
  z.strictObject({
    ...teacherProjectionBase,
    phase: z.literal('ended'),
    reason: z.enum(['teacher-ended', 'expired']),
  }),
]);

const studentProjectionBase = {
  role: z.literal('student'),
  revision: nonnegativeIntegerSchema,
  totalCaseCount: positiveIntegerSchema,
};

export const studentRoomProjectionSchema = z.discriminatedUnion('phase', [
  z.strictObject({ ...studentProjectionBase, phase: z.literal('lobby') }),
  z.strictObject({
    ...studentProjectionBase,
    phase: z.literal('open'),
    currentCase: studentCurrentCaseSchema,
    submittedChoiceId: roomStableIdSchema.optional(),
  }),
  z.strictObject({
    ...studentProjectionBase,
    phase: z.literal('revealed'),
    currentCase: currentCaseReferenceSchema,
  }),
  z.strictObject({ ...studentProjectionBase, phase: z.literal('summary') }),
  z.strictObject({
    ...studentProjectionBase,
    phase: z.literal('ended'),
    reason: z.enum(['teacher-ended', 'expired']),
  }),
]);

export const roomProjectionSchema = z.union([
  teacherRoomProjectionSchema,
  studentRoomProjectionSchema,
]);

export type TeacherRoomProjection = z.infer<typeof teacherRoomProjectionSchema>;
export type StudentRoomProjection = z.infer<typeof studentRoomProjectionSchema>;
export type RoomProjection = z.infer<typeof roomProjectionSchema>;

export const roomErrorCodes = [
  'malformed-message',
  'incompatible-protocol',
  'teacher-only',
  'student-only',
  'invalid-phase',
  'invalid-case',
  'invalid-choice',
  'cases-remaining',
  'room-full',
  'room-expired',
  'room-ended',
  'unauthorized',
  'stale-activity',
  'service-disabled',
  'service-unavailable',
  'configuration-error',
  'rate-limited',
] as const;

export type RoomErrorCode = (typeof roomErrorCodes)[number];

export const roomHttpErrorResponseSchema = z.strictObject({
  protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
  error: z.strictObject({
    code: z.enum(roomErrorCodes),
    message: z.string().min(1).max(240),
    retryable: z.boolean(),
  }),
});

export type RoomHttpErrorResponse = z.infer<typeof roomHttpErrorResponseSchema>;

export function parseRoomHttpErrorResponse(
  value: unknown,
): RoomHttpErrorResponse | null {
  return parseWith(roomHttpErrorResponseSchema, value);
}

export const roomServerMessageSchema = z.discriminatedUnion('type', [
  z.strictObject({
    protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
    type: z.literal('welcome'),
    projection: roomProjectionSchema,
  }),
  z.strictObject({
    protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
    type: z.literal('room-state'),
    projection: roomProjectionSchema,
  }),
  z.strictObject({
    protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
    type: z.literal('answer-ack'),
    caseId: roomStableIdSchema,
    choiceId: roomStableIdSchema,
    outcome: z.enum(['accepted', 'revised', 'unchanged']),
    revision: nonnegativeIntegerSchema,
  }),
  z.strictObject({
    protocolVersion: z.literal(ROOM_PROTOCOL_VERSION),
    type: z.literal('error'),
    code: z.enum(roomErrorCodes),
    message: z.string().min(1).max(240),
    retryable: z.boolean(),
  }),
]);

export type RoomServerMessage = z.infer<typeof roomServerMessageSchema>;

export function parseRoomServerMessage(
  value: unknown,
): RoomServerMessage | null {
  return parseWith(roomServerMessageSchema, value);
}

export {
  calculateClassScores,
  type CaseClassScore,
  type CaseScoreInput,
  type ClassScores,
} from './scoring';

export {
  applyRoomCommand,
  createRoomState,
  projectRoomForStudent,
  projectRoomForTeacher,
  type AnswerAcknowledgement,
  type RoomActor,
  type RoomCommandResult,
  type RoomRevealedResult,
  type RoomState,
} from './state';

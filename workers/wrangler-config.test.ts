import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('Durable Object provisioning', () => {
  it('provisions only the deployable SQLite room class', async () => {
    const config = await readFile(
      `${process.cwd()}/workers/wrangler.toml`,
      'utf8',
    );

    expect(config).not.toMatch(/^new_classes\s*=/m);
    expect(config).toContain('class_name = "ClassroomRoomV2"');
    expect(config).toContain('new_sqlite_classes = ["ClassroomRoomV2"]');
    expect(config).toContain('name = "ROOM_CREATES"');
    expect(config).toContain('name = "TICKET_ATTEMPTS"');
  });
});

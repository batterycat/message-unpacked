import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { scenarioMachine } from './machine';

describe('scenarioMachine', () => {
  it('records an answer, reveals the debrief, and resets', () => {
    const actor = createActor(scenarioMachine).start();

    actor.send({ type: 'ANSWER', choiceId: 'choice.verify' });
    expect(actor.getSnapshot().matches('debrief')).toBe(true);
    expect(actor.getSnapshot().context.selectedChoiceId).toBe('choice.verify');

    actor.send({ type: 'RESTART' });
    expect(actor.getSnapshot().matches('question')).toBe(true);
    expect(actor.getSnapshot().context.selectedChoiceId).toBeNull();
  });
});

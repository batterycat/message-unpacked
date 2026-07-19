import { assign, setup } from 'xstate';

type ScenarioContext = {
  selectedChoiceId: string | null;
};

type ScenarioEvent = { type: 'ANSWER'; choiceId: string } | { type: 'RESTART' };

export const scenarioMachine = setup({
  types: {
    context: {} as ScenarioContext,
    events: {} as ScenarioEvent,
  },
  actions: {
    selectChoice: assign({
      selectedChoiceId: ({ event }) =>
        event.type === 'ANSWER' ? event.choiceId : null,
    }),
    clearChoice: assign({ selectedChoiceId: null }),
  },
}).createMachine({
  id: 'scenario',
  initial: 'question',
  context: {
    selectedChoiceId: null,
  },
  states: {
    question: {
      on: {
        ANSWER: {
          target: 'debrief',
          actions: 'selectChoice',
        },
      },
    },
    debrief: {
      on: {
        RESTART: {
          target: 'question',
          actions: 'clearChoice',
        },
      },
    },
  },
});

import {
  buildAllowedActionLabel,
  buildUnavailableTradeActionHints,
  evaluateTradeAction,
  getAllowedTradeActions,
  isTradeActionAllowed,
} from '../../../../src/features/trades/tradeActionRules';

describe('tradeActionRules', () => {
  it('returns expected actions per known status', () => {
    expect(getAllowedTradeActions('proposed')).toEqual(['accept', 'deny', 'cancel', 'delete']);
    expect(getAllowedTradeActions('pending')).toEqual(['complete', 'cancel']);
    expect(getAllowedTradeActions('denied')).toEqual(['repropose', 'delete']);
    expect(getAllowedTradeActions('cancelled')).toEqual(['repropose', 'delete']);
    expect(getAllowedTradeActions('completed')).toEqual(['delete']);
    expect(getAllowedTradeActions('deleted')).toEqual(['repropose']);
  });

  it('handles casing/whitespace and unknown statuses safely', () => {
    expect(getAllowedTradeActions('  ProPosed ')).toEqual(['accept', 'deny', 'cancel', 'delete']);
    expect(getAllowedTradeActions('unknown')).toEqual([]);
    expect(getAllowedTradeActions(null)).toEqual([]);
  });

  it('checks single-action availability and summary label', () => {
    expect(isTradeActionAllowed('pending', 'complete')).toBe(true);
    expect(isTradeActionAllowed('pending', 'accept')).toBe(false);
    expect(buildAllowedActionLabel('pending')).toBe('Allowed actions: complete, cancel');
    expect(buildAllowedActionLabel('other')).toBe('No actions available for this status.');
  });

  it('evaluates completion action with participant confirmation context', () => {
    const decision = evaluateTradeAction('pending', 'complete', {
      viewerUsername: 'ash',
      trade: {
        username_proposed: 'ash',
        username_accepting: 'misty',
        user_proposed_completion_confirmed: true,
      },
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('complete: you already confirmed completion.');
  });

  it('builds unavailable action hints for current status', () => {
    const hints = buildUnavailableTradeActionHints('proposed');
    expect(hints).toEqual(
      expect.arrayContaining([
        'complete: available only when status is pending.',
        're-propose: available only when status is denied/cancelled/deleted.',
      ]),
    );
  });
});

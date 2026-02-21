import type { TradeAction } from './tradeActionRules';
import type { TradeRow } from './tradeMutations';

type ConfirmationContent = {
  title: string;
  message: string;
};

const formatDateSafe = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
};

export const buildTradeActionConfirmation = (
  action: TradeAction,
  trade: TradeRow,
): ConfirmationContent => {
  const tradeLabel = `${trade.trade_id} (${trade.username_proposed ?? '-'} -> ${trade.username_accepting ?? '-'})`;
  switch (action) {
    case 'accept':
      return {
        title: 'Accept trade?',
        message: `Confirm accepting trade ${tradeLabel}.`,
      };
    case 'deny':
      return {
        title: 'Deny trade?',
        message: `Confirm denying trade ${tradeLabel}. This action can be reversed via re-propose.`,
      };
    case 'cancel':
      return {
        title: 'Cancel trade?',
        message: `Confirm cancelling trade ${tradeLabel}.`,
      };
    case 'complete':
      return {
        title: 'Confirm completion?',
        message: `Mark completion confirmation for trade ${tradeLabel}.`,
      };
    case 'repropose':
      return {
        title: 'Re-propose trade?',
        message: `Re-open trade ${tradeLabel} as proposed.`,
      };
    case 'delete':
      return {
        title: 'Delete trade?',
        message: `Mark trade ${tradeLabel} as deleted.`,
      };
    default:
      return {
        title: 'Update trade?',
        message: `Apply update to trade ${tradeLabel}.`,
      };
  }
};

export const buildTradeStatusDetail = (
  trade: TradeRow | null,
  viewerUsername: string,
): string => {
  if (!trade) return 'Select a trade to view lifecycle details.';

  const status = String(trade.trade_status ?? '').toLowerCase();
  const acceptedAt = formatDateSafe(trade.trade_accepted_date);
  const completedAt = formatDateSafe(trade.trade_completed_date);
  const cancelledAt = formatDateSafe(trade.trade_cancelled_date);
  const deletedAt = formatDateSafe(trade.trade_deleted_date);
  const isProposer = viewerUsername === (trade.username_proposed ?? '');

  switch (status) {
    case 'proposed':
      return isProposer
        ? 'Trade proposed. Waiting for the other trainer to accept.'
        : 'Trade proposed to you. Review then accept or deny.';
    case 'pending':
      if (acceptedAt) {
        return `Trade accepted at ${acceptedAt}. Awaiting completion confirmations.`;
      }
      return 'Trade pending. Awaiting completion confirmations.';
    case 'completed':
      return completedAt ? `Trade completed at ${completedAt}.` : 'Trade completed.';
    case 'cancelled':
      return cancelledAt
        ? `Trade cancelled at ${cancelledAt} by ${trade.trade_cancelled_by ?? 'unknown'}.`
        : `Trade cancelled by ${trade.trade_cancelled_by ?? 'unknown'}.`;
    case 'denied':
      return 'Trade denied. You can re-propose if still interested.';
    case 'deleted':
      return deletedAt ? `Trade deleted at ${deletedAt}.` : 'Trade deleted.';
    default:
      return `Trade status: ${trade.trade_status ?? 'unknown'}.`;
  }
};

export const buildTradeAuditDetails = (trade: TradeRow | null): string[] => {
  if (!trade) return [];
  const details: string[] = [];
  const proposalAt = formatDateSafe(trade.trade_proposal_date);
  const acceptedAt = formatDateSafe(trade.trade_accepted_date);
  const completedAt = formatDateSafe(trade.trade_completed_date);
  const cancelledAt = formatDateSafe(trade.trade_cancelled_date);
  const deletedAt = formatDateSafe(trade.trade_deleted_date);

  if (proposalAt) details.push(`Proposed: ${proposalAt}`);
  if (acceptedAt) details.push(`Accepted: ${acceptedAt}`);
  if (completedAt) details.push(`Completed: ${completedAt}`);
  if (cancelledAt) details.push(`Cancelled: ${cancelledAt}`);
  if (deletedAt) details.push(`Deleted: ${deletedAt}`);
  if (trade.trade_cancelled_by) details.push(`Cancelled by: ${trade.trade_cancelled_by}`);

  if (details.length === 0) return ['No audit timestamps yet.'];
  return details;
};

import { useModal } from '@/contexts/ModalContext';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import type { Instances } from '@/types/instances';
import type { PokemonVariant } from '@/types/pokemonVariants';
import CancelledTradeView from '@/pages/Trades/views/CancelledTradeView';
import CompletedTradeView from '@/pages/Trades/views/CompletedTradeView';
import OffersTradeView from '@/pages/Trades/views/OffersTradeView';
import PendingTradeView from '@/pages/Trades/views/PendingTradeView';
import ProposedTradeView from '@/pages/Trades/views/ProposedTradeView';
import { handleAcceptTrade } from '@/pages/Trades/handlers/handleAcceptTrade';
import { handleCancelTrade } from '@/pages/Trades/handlers/handleCancelTrade';
import { handleCompleteTrade } from '@/pages/Trades/handlers/handleCompleteTrade';
import { handleDeleteTrade } from '@/pages/Trades/handlers/handleDeleteTrade';
import { handleDenyTrade } from '@/pages/Trades/handlers/handleDenyTrade';
import { handleReProposeTrade } from '@/pages/Trades/handlers/handleReProposeTrade';
import { handleThumbsUpTrade } from '@/pages/Trades/handlers/handleThumbsUpTrade';
import { usePokemonDetails } from '@/pages/Trades/hooks/usePokemonDetails';
import type { RelatedInstancesMap, TradeStatusFilter } from '@/pages/Trades/types';

import './TradeCard.css';

interface TradeCardTrade {
  trade_id?: string;
  trade_status?: string | null;
  username_proposed?: string | null;
  username_accepting?: string | null;
  pokemon_instance_id_user_proposed?: string | null;
  pokemon_instance_id_user_accepting?: string | null;
  [key: string]: unknown;
}

interface TradeCardProps {
  trade: TradeCardTrade;
  relatedInstances: RelatedInstancesMap;
  selectedStatus: TradeStatusFilter;
  setInstances: (updatedData: Instances) => void | Promise<void>;
  variants: PokemonVariant[];
  instances?: Instances | null;
  loading: boolean;
  periodicUpdates: () => void;
}

const readCurrentUsername = (): string => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return '';

  try {
    const parsed = JSON.parse(storedUser) as { username?: unknown };
    return typeof parsed.username === 'string' ? parsed.username : '';
  } catch {
    return '';
  }
};

function TradeCard({
  trade,
  relatedInstances,
  selectedStatus,
  setInstances,
  variants,
  instances,
  loading,
  periodicUpdates,
}: TradeCardProps) {
  const setTradeData = useTradeStore((state) => state.setTradeData);
  const trades = useTradeStore((state) => state.trades);
  const { confirm } = useModal();

  const currentUsername = readCurrentUsername();
  const usernameProposed = trade.username_proposed ?? '';
  const isCurrentUserProposer = usernameProposed === currentUsername;
  const resolvedInstances = (instances ?? {}) as Instances;

  const currentUserInstanceId =
    (isCurrentUserProposer
      ? trade.pokemon_instance_id_user_proposed
      : trade.pokemon_instance_id_user_accepting) ?? '';

  const partnerInstanceId =
    (isCurrentUserProposer
      ? trade.pokemon_instance_id_user_accepting
      : trade.pokemon_instance_id_user_proposed) ?? '';

  const currentUserDetails = usePokemonDetails(
    currentUserInstanceId,
    variants,
    relatedInstances,
    resolvedInstances,
  );

  const partnerDetails = usePokemonDetails(
    partnerInstanceId,
    variants,
    relatedInstances,
    resolvedInstances,
  );

  // Handlers expect a Promise<void> setter. Store setter returns Promise<Record|void>.
  const persistTradeData = async (updatedTrades: Record<string, unknown>): Promise<void> => {
    await setTradeData(updatedTrades as Record<string, any>);
  };

  const handleAccept = async () => {
    const isConfirmed = await confirm('Are you sure you want to accept this trade?');
    if (!isConfirmed) return;

    await handleAcceptTrade({
      trade: trade as any,
      trades: trades as any,
      setTradeData: persistTradeData,
      periodicUpdates,
    });
  };

  const handleDeny = async () => {
    const isConfirmed = await confirm('Are you sure you want to deny this trade?');
    if (!isConfirmed) return;

    await handleDenyTrade({
      trade: trade as any,
      trades: trades as any,
      setTradeData: persistTradeData,
      periodicUpdates,
    });
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm('Are you sure you want to delete this trade?');
    if (!isConfirmed) return;

    await handleDeleteTrade({
      trade: trade as any,
      trades: trades as any,
      setTradeData: persistTradeData,
      periodicUpdates,
    });
  };

  const handleComplete = async () => {
    const isConfirmed = await confirm('Are you sure you want to complete this trade?');
    if (!isConfirmed) return;

    await handleCompleteTrade({
      trade: trade as any,
      trades: trades as any,
      setTradeData: persistTradeData,
      periodicUpdates,
      relatedInstances: relatedInstances as any,
      instances: resolvedInstances as any,
      setInstances: setInstances as any,
      currentUsername,
    });
  };

  const handleCancel = async () => {
    const isConfirmed = await confirm('Are you sure you want to cancel this trade?');
    if (!isConfirmed) return;

    await handleCancelTrade({
      trade: trade as any,
      trades: trades as any,
      setTradeData: persistTradeData,
      periodicUpdates,
      currentUsername,
    });
  };

  const handleRePropose = async () => {
    const isConfirmed = await confirm('Are you sure you want to re-propose this trade?');
    if (!isConfirmed) return;

    await handleReProposeTrade({
      trade: trade as any,
      trades: trades as any,
      setTradeData: persistTradeData,
      periodicUpdates,
      currentUsername,
    });
  };

  const handleThumbsUp = async () => {
    await handleThumbsUpTrade({
      trade: trade as any,
      trades: trades as any,
      setTradeData: persistTradeData,
      periodicUpdates,
      currentUsername,
    });
  };

  const normalizedStatus = selectedStatus.toLowerCase();
  const isProposed = normalizedStatus === 'proposed';
  const offeringHeading = isProposed ? 'Offered:' : 'Offering:';
  const receivingHeading = isProposed ? 'For Trade:' : 'Receiving:';

  if (normalizedStatus === 'accepting') {
    return (
      <OffersTradeView
        trade={trade}
        currentUsername={currentUsername}
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
        loading={loading}
        handleAccept={handleAccept}
        handleDeny={handleDeny}
      />
    );
  }

  if (normalizedStatus === 'proposed') {
    return (
      <ProposedTradeView
        trade={trade}
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
        loading={loading}
        offeringHeading={offeringHeading}
        receivingHeading={receivingHeading}
        handleDelete={handleDelete}
      />
    );
  }

  if (normalizedStatus === 'pending') {
    return (
      <PendingTradeView
        trade={trade}
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
        loading={loading}
        handleComplete={handleComplete}
        handleCancel={handleCancel}
      />
    );
  }

  if (normalizedStatus === 'cancelled') {
    return (
      <CancelledTradeView
        trade={trade}
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
        loading={loading}
        handleRePropose={handleRePropose}
      />
    );
  }

  if (normalizedStatus === 'completed') {
    return (
      <CompletedTradeView
        trade={trade}
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
        loading={loading}
        handleThumbsUp={handleThumbsUp}
      />
    );
  }

  return <div className="trade-card">Unknown trade status: {selectedStatus}</div>;
}

export default TradeCard;

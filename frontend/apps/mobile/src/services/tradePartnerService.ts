import {
  tradesContract,
  type PartnerInfo,
  type RevealPartnerInfoRequest,
  type TradeReference,
} from '@pokemongonexus/shared-contracts/trades';
import { runtimeConfig } from '../config/runtimeConfig';
import { requestJson } from './httpClient';

export const revealTradePartnerInfo = async (trade: TradeReference): Promise<PartnerInfo> => {
  const payload: RevealPartnerInfoRequest = { trade };
  return requestJson<PartnerInfo>(
    runtimeConfig.api.authApiUrl,
    tradesContract.endpoints.revealPartnerInfo,
    'POST',
    payload,
  );
};

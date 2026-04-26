import type { GeneratedOffer, RedemptionToken } from '@/services/api';

export type TabParamList = {
  Explore: undefined;
  Nearby: undefined;
  Wallet: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Offer: { offer: GeneratedOffer };
  Redemption: { offer: GeneratedOffer; token: RedemptionToken };
  Expired: { offer: GeneratedOffer };
  Dismissed: { offer: GeneratedOffer };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

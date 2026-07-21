export type Category = 'Politics' | 'Sports' | 'Crypto' | 'Economy' | 'Pop Culture';
export type MarketType = 'binary' | 'multi';

export interface Outcome {
  name: string;
  price: number; // cents / probability %
  color: string;
  tokenId?: string;
}

export interface Market {
  id: string;
  category: Category;
  type: MarketType;
  question: string;
  initials: string;
  color: string;
  /** binary markets: Yes price in cents */
  yes?: number;
  /** multi markets */
  outcomes?: Outcome[];
  volume: number;
  /** 24-hour trading volume in USD */
  volume24h?: number;
  /** Order book liquidity in USD */
  liquidity?: number;
  /** Gamma active flag */
  active?: boolean;
  closed?: boolean;
  acceptingOrders?: boolean;
  enableOrderBook?: boolean;
  /** ISO end date for expiry checks */
  endDateIso?: string;
  end: string;
  change: number; // 24h change in points
  trend: number[]; // probability history 0-100
  /** Polymarket token IDs — [yes, no] for binary, all outcomes for multi */
  tokenIds?: string[];
  conditionId?: string;
  tickSize?: string;
  negRisk?: boolean;
  slug?: string;
  image?: string;
}

export interface Position {
  id: string;
  marketId: string;
  question: string;
  side: string; // 'Yes' | 'No' | outcome name
  sideColor: string;
  shares: number;
  avgPrice: number; // cents
  currentPrice: number; // cents
  initials: string;
  marketColor: string;
  tokenId?: string;
  tickSize?: string;
  negRisk?: boolean;
}

export interface Order {
  id: string;
  time: string;
  question: string;
  side: string;
  shares: number;
  amount: number;
  action?: 'buy' | 'sell';
}

/** Resting CLOB limit order (not yet filled). */
export interface OpenOrder {
  id: string;
  marketId: string;
  question: string;
  side: string;
  outcome: string;
  price: number; // cents
  originalSize: number;
  sizeMatched: number;
  remaining: number;
  orderType: string;
  createdAt: number;
  assetId: string;
}

export interface BookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  yes: BookLevel[];
  no: BookLevel[];
}

export interface ActivityItem {
  name: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  badge?: string;
}

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMsg {
  title: string;
  msg: string;
  variant?: ToastVariant;
}

export interface TicketInfo {
  marketId: string;
  question: string;
  initials: string;
  marketColor: string;
  sideLabel: string;
  price: number; // cents
  color: string;
  tokenId: string;
  mode: 'buy' | 'sell';
  maxShares?: number;
  positionId?: string;
  tickSize?: string;
  negRisk?: boolean;
  openPrice?: number;
  orderKind?: 'market' | 'limit';
}

export interface UserProfile {
  id: string;
  name: string;
  address: string;
  initials: string;
  depositWalletAddress?: string;
  /** @deprecated Use depositWalletAddress */
  safeAddress?: string;
}

export interface PortfolioSnapshot {
  cash: number;
  positions: Position[];
  orders: Order[];
}

export type Phase = 'landing' | 'onboarding' | 'app';
export type Tab = 'markets' | 'search' | 'portfolio' | 'profile';

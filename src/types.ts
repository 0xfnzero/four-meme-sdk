/**
 * Type definitions for FOUR Trading Platform
 */

export interface TokenInfo {
  base: string;
  quote: string;
  template: bigint;
  totalSupply: bigint;
  maxOffers: bigint;
  maxRaising: bigint;
  launchTime: bigint;
  offers: bigint;
  funds: bigint;
  lastPrice: bigint;
  K: bigint;
  T: bigint;
  status: bigint;
}

export interface TokenInfoEx {
  creator: string;
  founder: string;
  reserves: bigint;
}

export interface Template {
  quote: string;
  initialLiquidity: bigint;
  maxRaising: bigint;
  totalSupply: bigint;
  maxOffers: bigint;
  minTradingFee: bigint;
}

export interface TokenStatus {
  TRADING: bigint;
  ADDING_LIQUIDITY: bigint;
  COMPLETED: bigint;
  HALT: bigint;
}

export interface TransactionResult {
  success: boolean;
  txHash: string;
  receipt: any;
}

export interface TokenCreateEvent {
  creator: string;
  token: string;
  requestId: bigint;
  name: string;
  symbol: string;
  totalSupply: bigint;
  launchTime: bigint;
  launchFee: bigint;
}

export interface TokenPurchaseEvent {
  token: string;
  account: string;
  price: bigint;
  amount: bigint;
  cost: bigint;
  fee: bigint;
  offers: bigint;
  funds: bigint;
}

export interface TokenSaleEvent {
  token: string;
  account: string;
  price: bigint;
  amount: bigint;
  cost: bigint;
  fee: bigint;
  offers: bigint;
  funds: bigint;
}

export interface LiquidityAddedEvent {
  base: string;
  offers: bigint;
  quote: string;
  funds: bigint;
}

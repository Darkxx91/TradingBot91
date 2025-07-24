// ULTIMATE TRADING EMPIRE - DEX INTERFACE
// Common interface for all DEX implementations

import { BigNumber } from 'ethers';

export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  network: string;
}

export interface PairInfo {
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  pairAddress?: string;
  pairName: string;
}

export interface PriceQuote {
  price: number;
  rawPrice: BigNumber;
  liquidity: BigNumber;
  liquidityUSD: number;
  timestamp: Date;
  source: string;
  gasEstimate: number;
}

export interface TradeParams {
  pair: PairInfo;
  amount: BigNumber;
  side: 'buy' | 'sell';
  slippage: number;
  deadline: number;
}

export interface TradeResult {
  success: boolean;
  txHash?: string;
  executedPrice: number;
  executedAmount: BigNumber;
  fee: BigNumber;
  gasUsed: number;
  timestamp: Date;
}

/**
 * Common interface for all DEX implementations
 */
export interface DexInterface {
  /**
   * Get the name of the DEX
   */
  getName(): string;
  
  /**
   * Get the supported networks
   */
  getSupportedNetworks(): string[];
  
  /**
   * Get the supported pairs
   */
  getSupportedPairs(network: string): Promise<PairInfo[]>;
  
  /**
   * Get the price quote for a pair
   */
  getPrice(pair: PairInfo): Promise<PriceQuote>;
  
  /**
   * Execute a trade
   */
  executeTrade(params: TradeParams): Promise<TradeResult>;
  
  /**
   * Get the fee for a trade
   */
  getFee(params: TradeParams): Promise<BigNumber>;
  
  /**
   * Get the gas estimate for a trade
   */
  estimateGas(params: TradeParams): Promise<number>;
  
  /**
   * Check if a token is supported
   */
  isTokenSupported(token: string, network: string): boolean;
  
  /**
   * Get the liquidity for a pair
   */
  getLiquidity(pair: PairInfo): Promise<BigNumber>;
}
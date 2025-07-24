// STABLECOIN DEPEG EXPLOITATION SYSTEM - TYPES
// Revolutionary mathematical certainty profits with guaranteed mean reversion

/**
 * Time frame for historical data queries
 */
export enum TimeFrame {
  HOUR = '1h',
  DAY = '1d',
  WEEK = '1w',
  MONTH = '1m',
  YEAR = '1y',
  ALL = 'all'
}

/**
 * Severity classification for depeg events
 */
export enum DepegSeverity {
  MINOR = 'minor',     // 0.05-0.2%
  MODERATE = 'moderate', // 0.2-1%
  SEVERE = 'severe',    // >1%
  EXTREME = 'extreme'   // >5%
}

/**
 * Direction of the depeg event
 */
export type DepegDirection = 'premium' | 'discount';

/**
 * Status of the depeg event
 */
export type DepegStatus = 'active' | 'resolved' | 'worsening';

/**
 * Range for filtering depeg events by magnitude
 */
export interface Range {
  min: number;
  max: number;
}

/**
 * Price information for a stablecoin on a specific exchange
 */
export interface ExchangePrice {
  exchange: string;
  price: number;
  volume24h: number;
  liquidity: number;
  timestamp: Date;
}

/**
 * Depeg event data structure
 */
export interface DepegEvent {
  id: string;
  stablecoin: string;
  exchanges: ExchangePrice[];
  startTime: Date;
  endTime?: Date;
  magnitude: number;
  direction: DepegDirection;
  severity: DepegSeverity;
  averagePrice: number;
  pegValue: number;
  liquidityScore: number;
  estimatedReversionTime: number;
  actualReversionTime?: number;
  status: DepegStatus;
  profitPotential: number;
  tradingVolume: number;
  maxDeviation: number;
  reversionPattern: string;
  correlatedEvents?: string[];
  marketConditions: {
    overallVolatility: number;
    marketDirection: string;
    significantNews?: string[];
  };
}

/**
 * Statistics about depeg events for a specific stablecoin
 */
export interface DepegStatistics {
  stablecoin: string;
  totalEvents: number;
  averageMagnitude: number;
  averageReversionTime: number;
  successRate: number;
  profitPotential: number;
  byDirection: {
    premium: number;
    discount: number;
  };
  bySeverity: {
    minor: number;
    moderate: number;
    severe: number;
    extreme: number;
  };
  byExchange: Record<string, number>;
  correlations: {
    marketVolatility: number;
    bitcoinPrice: number;
    regulatoryEvents: number;
  };
}

/**
 * Query parameters for filtering depeg events
 */
export interface DepegQueryParams {
  stablecoin?: string;
  exchange?: string;
  timeframe?: TimeFrame;
  startDate?: Date;
  endDate?: Date;
  magnitudeRange?: Range;
  direction?: DepegDirection;
  severity?: DepegSeverity;
  status?: DepegStatus;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
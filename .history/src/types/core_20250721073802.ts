// ULTIMATE TRADING EMPIRE - CORE TYPES
// Built for unlimited scaling from £3 to £1M+ with AI enhancement

export interface TradingAccount {
  id: string;
  name: string;
  exchange: string;
  balance: number;
  availableBalance: number;
  totalPnL: number;
  dailyPnL: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  isActive: boolean;
  riskLevel: 'conservative' | 'moderate' | 'aggressive' | 'maniac';
  specialization: StrategyType[];
  createdAt: Date;
  lastTradeAt?: Date;
}

export interface WhaleMovement {
  id: string;
  walletAddress: string;
  blockchain: string;
  asset: string;
  amount: number;
  usdValue: number;
  transactionHash: string;
  timestamp: Date;
  predictedImpact: number;
  confidence: number;
  marketCapRatio: number;
  isClusterMovement: boolean;
  clusterSize?: number;
  executionWindow: number; // milliseconds
}

export interface WhaleCluster {
  id: string;
  wallets: string[];
  coordinatedMovements: WhaleMovement[];
  totalValue: number;
  impactMultiplier: number;
  confidence: number;
  detectedAt: Date;
  estimatedExecutionTime: Date;
}

export interface ArbitrageOpportunity {
  id: string;
  type: 'exchange' | 'listing' | 'cross-chain' | 'maintenance' | 'time-zone';
  buyExchange: string;
  sellExchange: string;
  asset: string;
  buyPrice: number;
  sellPrice: number;
  priceDifference: number;
  profitPotential: number;
  executionWindow: number;
  requiredCapital: number;
  fees: number;
  slippage: number;
  confidence: number;
  detectedAt: Date;
  expiresAt: Date;
}

export interface LiquidationSignal {
  id: string;
  exchange: string;
  asset: string;
  liquidationPrice: number;
  liquidationVolume: number;
  openInterest: number;
  cascadeRisk: number;
  timeToLiquidation: number;
  reversalProbability: number;
  confidence: number;
  detectedAt: Date;
  estimatedCascadeAt: Date;
}

export interface FlashLoanOpportunity {
  id: string;
  protocol: string;
  asset: string;
  maxLoanAmount: number;
  arbitragePath: string[];
  expectedProfit: number;
  gasCost: number;
  netProfit: number;
  riskScore: number;
  executionComplexity: number;
  detectedAt: Date;
  expiresAt: Date;
}

export interface StablecoinDepeg {
  id: string;
  stablecoin: string;
  currentPrice: number;
  depegPercentage: number;
  volume: number;
  liquidity: number;
  expectedReversionTime: number;
  maxLeverage: number;
  confidence: number;
  detectedAt: Date;
  estimatedReversionAt: Date;
}

export interface FuturesConvergence {
  id: string;
  asset: string;
  spotPrice: number;
  futuresPrice: number;
  convergenceGap: number;
  timeToExpiration: number;
  convergenceRate: number;
  confidence: number;
  maxPosition: number;
  detectedAt: Date;
  expirationAt: Date;
}

export interface CrossChainArbitrage {
  id: string;
  asset: string;
  sourceChain: string;
  targetChain: string;
  sourcePrice: number;
  targetPrice: number;
  bridgeDelay: number;
  bridgeFee: number;
  profitPotential: number;
  confidence: number;
  detectedAt: Date;
  optimalExecutionAt: Date;
}

export interface FundingRateOpportunity {
  id: string;
  exchange: string;
  asset: string;
  fundingRate: number;
  dailyRate: number;
  nextFundingAt: Date;
  optimalLeverage: number;
  deltaHedgeRequired: boolean;
  expectedDailyReturn: number;
  confidence: number;
}

export interface OptionsLeverage {
  id: string;
  exchange: string;
  asset: string;
  optionType: 'call' | 'put';
  strike: number;
  expiration: Date;
  premium: number;
  impliedVolatility: number;
  effectiveLeverage: number;
  maxReturn: number;
  breakeven: number;
  confidence: number;
}

export interface SyntheticInstrument {
  id: string;
  name: string;
  components: {
    instrument: string;
    quantity: number;
    side: 'long' | 'short';
  }[];
  syntheticPrice: number;
  realPrice?: number;
  arbitrageOpportunity: number;
  complexity: number;
  confidence: number;
}

export interface TimeZoneArbitrage {
  id: string;
  asset: string;
  closingMarket: string;
  openingMarket: string;
  priceGap: number;
  volume: number;
  executionWindow: number;
  confidence: number;
  detectedAt: Date;
  optimalExecutionAt: Date;
}

export interface RegulatoryEvent {
  id: string;
  source: string;
  title: string;
  content: string;
  sentiment: number; // -1 to 1
  impactScore: number;
  affectedAssets: string[];
  detectedAt: Date;
  scheduledAt?: Date;
  executionDeadline: Date;
}

export interface EarningsEvent {
  id: string;
  company: string;
  affectedAssets: string[];
  scheduledAt: Date;
  expectedVolatility: number;
  optimalLeverage: number;
  positionDirection: 'long' | 'short' | 'straddle';
  confidence: number;
}

export interface CorrelationBreakdown {
  id: string;
  asset1: string;
  asset2: string;
  normalCorrelation: number;
  currentCorrelation: number;
  breakdownMagnitude: number;
  expectedReversionTime: number;
  tradingStrategy: 'long-short' | 'short-long';
  confidence: number;
  detectedAt: Date;
}

export type StrategyType = 
  | 'whale-tracking'
  | 'whale-clustering'
  | 'exchange-arbitrage'
  | 'listing-arbitrage'
  | 'liquidation-cascade'
  | 'momentum-transfer'
  | 'correlation-breakdown'
  | 'regulatory-frontrun'
  | 'flash-loan-arbitrage'
  | 'meme-coin-patterns'
  | 'stablecoin-depeg'
  | 'futures-convergence'
  | 'cross-chain-arbitrage'
  | 'funding-rate-arbitrage'
  | 'exchange-maintenance'
  | 'insider-detection'
  | 'governance-voting'
  | 'options-leverage'
  | 'synthetic-instruments'
  | 'time-zone-arbitrage'
  | 'regulatory-calendar'
  | 'earnings-events'
  | 'ai-generated'; // NEW: AI creates strategies we haven't thought of!

export interface TradeSignal {
  id: string;
  strategyType: StrategyType;
  account: string;
  asset: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  orderType: 'market' | 'limit' | 'stop';
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  executionDeadline: Date;
  expectedProfit: number;
  maxRisk: number;
  createdAt: Date;
}

export interface ExecutionResult {
  id: string;
  signalId: string;
  account: string;
  status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'failed';
  executedQuantity: number;
  executedPrice: number;
  fees: number;
  slippage: number;
  pnl: number;
  executionTime: number; // milliseconds
  executedAt: Date;
  error?: string;
}

export interface MarketRegime {
  id: string;
  type: 'bull' | 'bear' | 'sideways' | 'volatile' | 'low-vol';
  confidence: number;
  duration: number;
  optimalStrategies: StrategyType[];
  riskMultiplier: number;
  leverageMultiplier: number;
  detectedAt: Date;
  estimatedEndAt: Date;
}

export interface AIStrategy {
  id: string;
  name: string;
  description: string;
  code: string; // AI-generated strategy code
  backtestResults: {
    winRate: number;
    avgReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  confidence: number;
  createdAt: Date;
  lastOptimizedAt: Date;
  isActive: boolean;
}

export interface PerformanceMetrics {
  accountId: string;
  totalReturn: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  totalTrades: number;
  successfulTrades: number;
  lastUpdated: Date;
}

export interface RiskParameters {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxLeverage: number;
  maxConcurrentTrades: number;
  emergencyStopLoss: number;
  riskPerTrade: number;
  correlationLimit: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  latency: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  lastHealthCheck: Date;
  issues: string[];
}
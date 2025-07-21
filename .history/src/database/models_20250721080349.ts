// ULTIMATE TRADING EMPIRE - DATABASE MODELS
// AI-Enhanced, Evolutionary, Multi-Account Trading System

import { Schema, model, Document } from 'mongoose';
import { 
  TradingAccount, 
  WhaleMovement, 
  WhaleCluster,
  ArbitrageOpportunity,
  LiquidationSignal,
  FlashLoanOpportunity,
  StablecoinDepeg,
  FuturesConvergence,
  CrossChainArbitrage,
  FundingRateOpportunity,
  OptionsLeverage,
  SyntheticInstrument,
  TimeZoneArbitrage,
  RegulatoryEvent,
  EarningsEvent,
  CorrelationBreakdown,
  TradeSignal,
  ExecutionResult,
  MarketRegime,
  AIStrategy,
  PerformanceMetrics,
  SystemHealth
} from '../types/core';

// TRADING ACCOUNT MODEL - Multi-Account Scaling Foundation
const TradingAccountSchema = new Schema<TradingAccount>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  exchange: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  availableBalance: { type: Number, required: true, default: 0 },
  totalPnL: { type: Number, required: true, default: 0 },
  dailyPnL: { type: Number, required: true, default: 0 },
  maxDrawdown: { type: Number, required: true, default: 0 },
  winRate: { type: Number, required: true, default: 0 },
  totalTrades: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, required: true, default: true },
  riskLevel: { 
    type: String, 
    enum: ['conservative', 'moderate', 'aggressive', 'maniac'],
    required: true,
    default: 'moderate'
  },
  specialization: [{ type: String }],
  createdAt: { type: Date, required: true, default: Date.now },
  lastTradeAt: { type: Date }
}, {
  timestamps: true,
  collection: 'trading_accounts'
});

// WHALE MOVEMENT MODEL - 500ms Front-Running System
const WhaleMovementSchema = new Schema<WhaleMovement>({
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  blockchain: { type: String, required: true },
  asset: { type: String, required: true },
  amount: { type: Number, required: true },
  usdValue: { type: Number, required: true },
  transactionHash: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, index: true },
  predictedImpact: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  marketCapRatio: { type: Number, required: true },
  isClusterMovement: { type: Boolean, required: true, default: false },
  clusterSize: { type: Number },
  executionWindow: { type: Number, required: true } // milliseconds
}, {
  timestamps: true,
  collection: 'whale_movements'
});

// WHALE CLUSTER MODEL - Coordinated Movement Detection
const WhaleClusterSchema = new Schema<WhaleCluster>({
  id: { type: String, required: true, unique: true },
  wallets: [{ type: String, required: true }],
  coordinatedMovements: [{ type: Schema.Types.ObjectId, ref: 'WhaleMovement' }],
  totalValue: { type: Number, required: true },
  impactMultiplier: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  detectedAt: { type: Date, required: true, default: Date.now },
  estimatedExecutionTime: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'whale_clusters'
});

// ARBITRAGE OPPORTUNITY MODEL - Multi-Exchange Exploitation
const ArbitrageOpportunitySchema = new Schema<ArbitrageOpportunity>({
  id: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['exchange', 'listing', 'cross-chain', 'maintenance', 'time-zone'],
    required: true 
  },
  buyExchange: { type: String, required: true },
  sellExchange: { type: String, required: true },
  asset: { type: String, required: true },
  buyPrice: { type: Number, required: true },
  sellPrice: { type: Number, required: true },
  priceDifference: { type: Number, required: true },
  profitPotential: { type: Number, required: true },
  executionWindow: { type: Number, required: true },
  requiredCapital: { type: Number, required: true },
  fees: { type: Number, required: true },
  slippage: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  detectedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'arbitrage_opportunities'
});

// LIQUIDATION SIGNAL MODEL - Cascade Prediction System
const LiquidationSignalSchema = new Schema<LiquidationSignal>({
  id: { type: String, required: true, unique: true },
  exchange: { type: String, required: true },
  asset: { type: String, required: true },
  liquidationPrice: { type: Number, required: true },
  liquidationVolume: { type: Number, required: true },
  openInterest: { type: Number, required: true },
  cascadeRisk: { type: Number, required: true, min: 0, max: 1 },
  timeToLiquidation: { type: Number, required: true },
  reversalProbability: { type: Number, required: true, min: 0, max: 1 },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  detectedAt: { type: Date, required: true, default: Date.now },
  estimatedCascadeAt: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'liquidation_signals'
});

// FLASH LOAN OPPORTUNITY MODEL - Unlimited Capital Arbitrage
const FlashLoanOpportunitySchema = new Schema<FlashLoanOpportunity>({
  id: { type: String, required: true, unique: true },
  protocol: { type: String, required: true },
  asset: { type: String, required: true },
  maxLoanAmount: { type: Number, required: true },
  arbitragePath: [{ type: String, required: true }],
  expectedProfit: { type: Number, required: true },
  gasCost: { type: Number, required: true },
  netProfit: { type: Number, required: true },
  riskScore: { type: Number, required: true, min: 0, max: 1 },
  executionComplexity: { type: Number, required: true, min: 1, max: 10 },
  detectedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'flash_loan_opportunities'
});

// AI STRATEGY MODEL - Self-Evolving Strategy Creation
const AIStrategySchema = new Schema<AIStrategy>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: String, required: true }, // AI-generated strategy code
  backtestResults: {
    winRate: { type: Number, required: true },
    avgReturn: { type: Number, required: true },
    maxDrawdown: { type: Number, required: true },
    sharpeRatio: { type: Number, required: true }
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  createdAt: { type: Date, required: true, default: Date.now },
  lastOptimizedAt: { type: Date, required: true, default: Date.now },
  isActive: { type: Boolean, required: true, default: false }
}, {
  timestamps: true,
  collection: 'ai_strategies'
});

// MARKET REGIME MODEL - Adaptive Market Condition Detection
const MarketRegimeSchema = new Schema<MarketRegime>({
  id: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['bull', 'bear', 'sideways', 'volatile', 'low-vol'],
    required: true 
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  duration: { type: Number, required: true },
  optimalStrategies: [{ type: String }],
  riskMultiplier: { type: Number, required: true },
  leverageMultiplier: { type: Number, required: true },
  detectedAt: { type: Date, required: true, default: Date.now },
  estimatedEndAt: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'market_regimes'
});

// TRADE SIGNAL MODEL - Multi-Strategy Signal Generation
const TradeSignalSchema = new Schema<TradeSignal>({
  id: { type: String, required: true, unique: true },
  strategyType: { type: String, required: true },
  account: { type: String, required: true },
  asset: { type: String, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number },
  orderType: { type: String, enum: ['market', 'limit', 'stop'], required: true },
  leverage: { type: Number },
  stopLoss: { type: Number },
  takeProfit: { type: Number },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true 
  },
  executionDeadline: { type: Date, required: true },
  expectedProfit: { type: Number, required: true },
  maxRisk: { type: Number, required: true },
  createdAt: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true,
  collection: 'trade_signals'
});

// EXECUTION RESULT MODEL - Trade Execution Tracking
const ExecutionResultSchema = new Schema<ExecutionResult>({
  id: { type: String, required: true, unique: true },
  signalId: { type: String, required: true },
  account: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'filled', 'partial', 'cancelled', 'failed'],
    required: true 
  },
  executedQuantity: { type: Number, required: true },
  executedPrice: { type: Number, required: true },
  fees: { type: Number, required: true },
  slippage: { type: Number, required: true },
  pnl: { type: Number, required: true },
  executionTime: { type: Number, required: true }, // milliseconds
  executedAt: { type: Date, required: true, default: Date.now },
  error: { type: String }
}, {
  timestamps: true,
  collection: 'execution_results'
});

// PERFORMANCE METRICS MODEL - Real-Time Performance Tracking
const PerformanceMetricsSchema = new Schema<PerformanceMetrics>({
  accountId: { type: String, required: true, unique: true },
  totalReturn: { type: Number, required: true, default: 0 },
  dailyReturn: { type: Number, required: true, default: 0 },
  weeklyReturn: { type: Number, required: true, default: 0 },
  monthlyReturn: { type: Number, required: true, default: 0 },
  winRate: { type: Number, required: true, default: 0 },
  avgWin: { type: Number, required: true, default: 0 },
  avgLoss: { type: Number, required: true, default: 0 },
  profitFactor: { type: Number, required: true, default: 0 },
  sharpeRatio: { type: Number, required: true, default: 0 },
  maxDrawdown: { type: Number, required: true, default: 0 },
  currentDrawdown: { type: Number, required: true, default: 0 },
  totalTrades: { type: Number, required: true, default: 0 },
  successfulTrades: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true,
  collection: 'performance_metrics'
});

// SYSTEM HEALTH MODEL - Real-Time System Monitoring
const SystemHealthSchema = new Schema<SystemHealth>({
  status: { 
    type: String, 
    enum: ['healthy', 'warning', 'critical', 'offline'],
    required: true 
  },
  uptime: { type: Number, required: true },
  latency: { type: Number, required: true },
  errorRate: { type: Number, required: true },
  activeConnections: { type: Number, required: true },
  memoryUsage: { type: Number, required: true },
  cpuUsage: { type: Number, required: true },
  lastHealthCheck: { type: Date, required: true, default: Date.now },
  issues: [{ type: String }]
}, {
  timestamps: true,
  collection: 'system_health'
});

// EXPORT ALL MODELS
export const TradingAccountModel = model<TradingAccount>('TradingAccount', TradingAccountSchema);
export const WhaleMovementModel = model<WhaleMovement>('WhaleMovement', WhaleMovementSchema);
export const WhaleClusterModel = model<WhaleCluster>('WhaleCluster', WhaleClusterSchema);
export const ArbitrageOpportunityModel = model<ArbitrageOpportunity>('ArbitrageOpportunity', ArbitrageOpportunitySchema);
export const LiquidationSignalModel = model<LiquidationSignal>('LiquidationSignal', LiquidationSignalSchema);
export const FlashLoanOpportunityModel = model<FlashLoanOpportunity>('FlashLoanOpportunity', FlashLoanOpportunitySchema);
export const AIStrategyModel = model<AIStrategy>('AIStrategy', AIStrategySchema);
export const MarketRegimeModel = model<MarketRegime>('MarketRegime', MarketRegimeSchema);
export const TradeSignalModel = model<TradeSignal>('TradeSignal', TradeSignalSchema);
export const ExecutionResultModel = model<ExecutionResult>('ExecutionResult', ExecutionResultSchema);
export const PerformanceMetricsModel = model<PerformanceMetrics>('PerformanceMetrics', PerformanceMetricsSchema);
export const SystemHealthModel = model<SystemHealth>('SystemHealth', SystemHealthSchema);
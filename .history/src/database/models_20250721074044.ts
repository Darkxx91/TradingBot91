// ULTIMATE TRADING EMPIRE - DATABASE MODELS
// Evolved thinking: Dynamic schemas that adapt to new strategy types

import mongoose, { Schema, Document } from 'mongoose';
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
  RiskParameters,
  SystemHealth
} from '../types/core';

// EVOLUTION: Dynamic account model that adapts to new strategies
const TradingAccountSchema = new Schema<TradingAccount & Document>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  exchange: { type: String, required: true },
  balance: { type: Number, required: true, min: 0 },
  availableBalance: { type: Number, required: true, min: 0 },
  totalPnL: { type: Number, default: 0 },
  dailyPnL: { type: Number, default: 0 },
  maxDrawdown: { type: Number, default: 0 },
  winRate: { type: Number, default: 0, min: 0, max: 1 },
  totalTrades: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  riskLevel: { 
    type: String, 
    enum: ['conservative', 'moderate', 'aggressive', 'maniac'], 
    default: 'moderate' 
  },
  specialization: [{ type: String }], // Dynamic strategy types
  createdAt: { type: Date, default: Date.now },
  lastTradeAt: { type: Date },
  // EVOLUTION: AI learning fields
  aiConfidence: { type: Number, default: 0.5, min: 0, max: 1 },
  adaptationRate: { type: Number, default: 0.1, min: 0, max: 1 },
  evolutionHistory: [{ 
    timestamp: Date, 
    change: String, 
    performance: Number 
  }]
}, {
  timestamps: true,
  collection: 'trading_accounts'
});

// WHALE TRACKING WITH CLUSTER INTELLIGENCE
const WhaleMovementSchema = new Schema<WhaleMovement & Document>({
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  blockchain: { type: String, required: true },
  asset: { type: String, required: true },
  amount: { type: Number, required: true },
  usdValue: { type: Number, required: true },
  transactionHash: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, index: true },
  predictedImpact: { type: Number, required: true, min: 0, max: 1 },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  marketCapRatio: { type: Number, required: true },
  isClusterMovement: { type: Boolean, default: false },
  clusterSize: { type: Number },
  executionWindow: { type: Number, required: true }, // milliseconds
  // EVOLUTION: AI enhancement fields
  aiPredictedDirection: { type: String, enum: ['up', 'down', 'neutral'] },
  historicalAccuracy: { type: Number, default: 0.5 },
  marketRegimeContext: { type: String }
}, {
  timestamps: true,
  collection: 'whale_movements'
});

const WhaleClusterSchema = new Schema<WhaleCluster & Document>({
  id: { type: String, required: true, unique: true },
  wallets: [{ type: String, required: true }],
  coordinatedMovements: [{ type: Schema.Types.ObjectId, ref: 'WhaleMovement' }],
  totalValue: { type: Number, required: true },
  impactMultiplier: { type: Number, required: true, min: 1 },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  detectedAt: { type: Date, required: true },
  estimatedExecutionTime: { type: Date, required: true },
  // EVOLUTION: Cluster intelligence
  networkStrength: { type: Number, default: 0.5 },
  historicalSuccess: { type: Number, default: 0.5 },
  riskScore: { type: Number, default: 0.5 }
}, {
  timestamps: true,
  collection: 'whale_clusters'
});

// ARBITRAGE OPPORTUNITIES WITH AI OPTIMIZATION
const ArbitrageOpportunitySchema = new Schema<ArbitrageOpportunity & Document>({
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
  detectedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  // EVOLUTION: AI-enhanced arbitrage
  aiOptimalTiming: { type: Date },
  aiOptimalSize: { type: Number },
  competitionLevel: { type: Number, default: 0.5 }
}, {
  timestamps: true,
  collection: 'arbitrage_opportunities'
});

// LIQUIDATION CASCADE PREDICTION
const LiquidationSignalSchema = new Schema<LiquidationSignal & Document>({
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
  detectedAt: { type: Date, required: true },
  estimatedCascadeAt: { type: Date, required: true },
  // EVOLUTION: Cascade intelligence
  cascadeMagnitude: { type: Number, default: 1 },
  recoveryTime: { type: Number },
  optimalEntryPrice: { type: Number },
  optimalExitPrice: { type: Number }
}, {
  timestamps: true,
  collection: 'liquidation_signals'
});

// AI-GENERATED STRATEGIES (REVOLUTIONARY!)
const AIStrategySchema = new Schema<AIStrategy & Document>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: String, required: true }, // AI-generated strategy code
  backtestResults: {
    winRate: { type: Number, required: true, min: 0, max: 1 },
    avgReturn: { type: Number, required: true },
    maxDrawdown: { type: Number, required: true },
    sharpeRatio: { type: Number, required: true }
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  createdAt: { type: Date, default: Date.now },
  lastOptimizedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false },
  // EVOLUTION: Self-improving strategies
  evolutionGeneration: { type: Number, default: 1 },
  parentStrategyId: { type: String },
  mutationRate: { type: Number, default: 0.1 },
  fitnessScore: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'ai_strategies'
});

// MARKET REGIME DETECTION
const MarketRegimeSchema = new Schema<MarketRegime & Document>({
  id: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['bull', 'bear', 'sideways', 'volatile', 'low-vol'], 
    required: true 
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  duration: { type: Number, required: true },
  optimalStrategies: [{ type: String }],
  riskMultiplier: { type: Number, required: true, min: 0.1, max: 10 },
  leverageMultiplier: { type: Number, required: true, min: 0.1, max: 10 },
  detectedAt: { type: Date, required: true },
  estimatedEndAt: { type: Date, required: true },
  // EVOLUTION: Regime intelligence
  transitionProbability: { type: Number, default: 0.5 },
  volatilityForecast: { type: Number },
  optimalPositionSizing: { type: Number }
}, {
  timestamps: true,
  collection: 'market_regimes'
});

// TRADE SIGNALS WITH AI ENHANCEMENT
const TradeSignalSchema = new Schema<TradeSignal & Document>({
  id: { type: String, required: true, unique: true },
  strategyType: { type: String, required: true },
  account: { type: String, required: true },
  asset: { type: String, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number },
  orderType: { type: String, enum: ['market', 'limit', 'stop'], required: true },
  leverage: { type: Number, min: 1, max: 1000 },
  stopLoss: { type: Number },
  takeProfit: { type: Number },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  executionDeadline: { type: Date, required: true },
  expectedProfit: { type: Number, required: true },
  maxRisk: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  // EVOLUTION: AI signal enhancement
  aiConfidenceBoost: { type: Number, default: 0 },
  marketRegimeAlignment: { type: Number, default: 0.5 },
  crossStrategyConfirmation: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'trade_signals'
});

// EXECUTION RESULTS WITH LEARNING
const ExecutionResultSchema = new Schema<ExecutionResult & Document>({
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
  executedAt: { type: Date, required: true },
  error: { type: String },
  // EVOLUTION: Learning from execution
  expectedVsActual: { type: Number },
  marketImpact: { type: Number },
  timingQuality: { type: Number, default: 0.5 }
}, {
  timestamps: true,
  collection: 'execution_results'
});

// PERFORMANCE METRICS WITH AI ANALYSIS
const PerformanceMetricsSchema = new Schema<PerformanceMetrics & Document>({
  accountId: { type: String, required: true, unique: true },
  totalReturn: { type: Number, required: true },
  dailyReturn: { type: Number, required: true },
  weeklyReturn: { type: Number, required: true },
  monthlyReturn: { type: Number, required: true },
  winRate: { type: Number, required: true, min: 0, max: 1 },
  avgWin: { type: Number, required: true },
  avgLoss: { type: Number, required: true },
  profitFactor: { type: Number, required: true },
  sharpeRatio: { type: Number, required: true },
  maxDrawdown: { type: Number, required: true },
  currentDrawdown: { type: Number, required: true },
  totalTrades: { type: Number, required: true, min: 0 },
  successfulTrades: { type: Number, required: true, min: 0 },
  lastUpdated: { type: Date, default: Date.now },
  // EVOLUTION: AI performance analysis
  aiPerformanceScore: { type: Number, default: 0.5 },
  improvementSuggestions: [{ type: String }],
  riskAdjustedScore: { type: Number, default: 0.5 }
}, {
  timestamps: true,
  collection: 'performance_metrics'
});

// Export all models
export const TradingAccountModel = mongoose.model<TradingAccount & Document>('TradingAccount', TradingAccountSchema);
export const WhaleMovementModel = mongoose.model<WhaleMovement & Document>('WhaleMovement', WhaleMovementSchema);
export const WhaleClusterModel = mongoose.model<WhaleCluster & Document>('WhaleCluster', WhaleClusterSchema);
export const ArbitrageOpportunityModel = mongoose.model<ArbitrageOpportunity & Document>('ArbitrageOpportunity', ArbitrageOpportunitySchema);
export const LiquidationSignalModel = mongoose.model<LiquidationSignal & Document>('LiquidationSignal', LiquidationSignalSchema);
export const AIStrategyModel = mongoose.model<AIStrategy & Document>('AIStrategy', AIStrategySchema);
export const MarketRegimeModel = mongoose.model<MarketRegime & Document>('MarketRegime', MarketRegimeSchema);
export const TradeSignalModel = mongoose.model<TradeSignal & Document>('TradeSignal', TradeSignalSchema);
export const ExecutionResultModel = mongoose.model<ExecutionResult & Document>('ExecutionResult', ExecutionResultSchema);
export const PerformanceMetricsModel = mongoose.model<PerformanceMetrics & Document>('PerformanceMetrics', PerformanceMetricsSchema);

// EVOLUTION: Dynamic model creation for new strategy types
export class DynamicModelFactory {
  static createStrategyModel(strategyType: string, schema: any) {
    return mongoose.model(strategyType, new Schema(schema, {
      timestamps: true,
      collection: `${strategyType.toLowerCase()}_opportunities`
    }));
  }
}
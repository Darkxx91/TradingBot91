// ULTIMATE TRADING EMPIRE - DATABASE MODELS
// Designed for unlimited scaling and AI evolution

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
  SystemHealth
} from '../types/core';

// 🚀 TRADING ACCOUNT MODEL - Supports unlimited accounts
export interface ITradingAccount extends TradingAccount, Document {}
const TradingAccountSchema = new Schema<ITradingAccount>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  exchange: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  availableBalance: { type: Number, required: true, default: 0 },
  totalPnL: { type: Number, default: 0 },
  dailyPnL: { type: Number, default: 0 },
  maxDrawdown: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  riskLevel: { 
    type: String, 
    enum: ['conservative', 'moderate', 'aggressive', 'maniac'],
    default: 'moderate'
  },
  specialization: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  lastTradeAt: { type: Date }
}, {
  timestamps: true,
  collection: 'trading_accounts'
});

// 🐋 WHALE MOVEMENT MODEL - Track massive wallet movements
export interface IWhaleMovement extends WhaleMovement, Document {}
const WhaleMovementSchema = new Schema<IWhaleMovement>({
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  blockchain: { type: String, required: true },
  asset: { type: String, required: true },
  amount: { type: Number, required: true },
  usdValue: { type: Number, required: true },
  transactionHash: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, index: true },
  predictedImpact: { type: Number, required: true },
  confidence: { type: Number, required: true },
  marketCapRatio: { type: Number, required: true },
  isClusterMovement: { type: Boolean, default: false },
  clusterSize: { type: Number },
  executionWindow: { type: Number, required: true }
}, {
  timestamps: true,
  collection: 'whale_movements'
});

// 🐋 WHALE CLUSTER MODEL - Coordinated whale movements
export interface IWhaleCluster extends WhaleCluster, Document {}
const WhaleClusterSchema = new Schema<IWhaleCluster>({
  id: { type: String, required: true, unique: true },
  wallets: [{ type: String, required: true }],
  coordinatedMovements: [{ type: Schema.Types.ObjectId, ref: 'WhaleMovement' }],
  totalValue: { type: Number, required: true },
  impactMultiplier: { type: Number, required: true },
  confidence: { type: Number, required: true },
  detectedAt: { type: Date, required: true },
  estimatedExecutionTime: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'whale_clusters'
});

// ⚡ ARBITRAGE OPPORTUNITY MODEL - All types of arbitrage
export interface IArbitrageOpportunity extends ArbitrageOpportunity, Document {}
const ArbitrageOpportunitySchema = new Schema<IArbitrageOpportunity>({
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
  confidence: { type: Number, required: true },
  detectedAt: { type: Date, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true }
}, {
  timestamps: true,
  collection: 'arbitrage_opportunities'
});

// 💥 LIQUIDATION SIGNAL MODEL - Cascade predictions
export interface ILiquidationSignal extends LiquidationSignal, Document {}
const LiquidationSignalSchema = new Schema<ILiquidationSignal>({
  id: { type: String, required: true, unique: true },
  exchange: { type: String, required: true },
  asset: { type: String, required: true },
  liquidationPrice: { type: Number, required: true },
  liquidationVolume: { type: Number, required: true },
  openInterest: { type: Number, required: true },
  cascadeRisk: { type: Number, required: true },
  timeToLiquidation: { type: Number, required: true },
  reversalProbability: { type: Number, required: true },
  confidence: { type: Number, required: true },
  detectedAt: { type: Date, required: true },
  estimatedCascadeAt: { type: Date, required: true, index: true }
}, {
  timestamps: true,
  collection: 'liquidation_signals'
});

// 💰 STABLECOIN DEPEG MODEL - Mathematical certainty trades
export interface IStablecoinDepeg extends StablecoinDepeg, Document {}
const StablecoinDepegSchema = new Schema<IStablecoinDepeg>({
  id: { type: String, required: true, unique: true },
  stablecoin: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  depegPercentage: { type: Number, required: true },
  volume: { type: Number, required: true },
  liquidity: { type: Number, required: true },
  expectedReversionTime: { type: Number, required: true },
  maxLeverage: { type: Number, required: true },
  confidence: { type: Number, required: true },
  detectedAt: { type: Date, required: true },
  estimatedReversionAt: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'stablecoin_depegs'
});

// 🎯 TRADE SIGNAL MODEL - All trading signals
export interface ITradeSignal extends TradeSignal, Document {}
const TradeSignalSchema = new Schema<ITradeSignal>({
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
  confidence: { type: Number, required: true },
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true 
  },
  executionDeadline: { type: Date, required: true, index: true },
  expectedProfit: { type: Number, required: true },
  maxRisk: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'trade_signals'
});

// ✅ EXECUTION RESULT MODEL - Track all executions
export interface IExecutionResult extends ExecutionResult, Document {}
const ExecutionResultSchema = new Schema<IExecutionResult>({
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
  error: { type: String }
}, {
  timestamps: true,
  collection: 'execution_results'
});

// 🧠 AI STRATEGY MODEL - AI-generated strategies
export interface IAIStrategy extends AIStrategy, Document {}
const AIStrategySchema = new Schema<IAIStrategy>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: String, required: true },
  backtestResults: {
    winRate: { type: Number, required: true },
    avgReturn: { type: Number, required: true },
    maxDrawdown: { type: Number, required: true },
    sharpeRatio: { type: Number, required: true }
  },
  confidence: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  lastOptimizedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'ai_strategies'
});

// 📊 MARKET REGIME MODEL - Market condition detection
export interface IMarketRegime extends MarketRegime, Document {}
const MarketRegimeSchema = new Schema<IMarketRegime>({
  id: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['bull', 'bear', 'sideways', 'volatile', 'low-vol'],
    required: true 
  },
  confidence: { type: Number, required: true },
  duration: { type: Number, required: true },
  optimalStrategies: [{ type: String }],
  riskMultiplier: { type: Number, required: true },
  leverageMultiplier: { type: Number, required: true },
  detectedAt: { type: Date, required: true },
  estimatedEndAt: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'market_regimes'
});

// 📈 PERFORMANCE METRICS MODEL - Track all performance
export interface IPerformanceMetrics extends PerformanceMetrics, Document {}
const PerformanceMetricsSchema = new Schema<IPerformanceMetrics>({
  accountId: { type: String, required: true, index: true },
  totalReturn: { type: Number, required: true },
  dailyReturn: { type: Number, required: true },
  weeklyReturn: { type: Number, required: true },
  monthlyReturn: { type: Number, required: true },
  winRate: { type: Number, required: true },
  avgWin: { type: Number, required: true },
  avgLoss: { type: Number, required: true },
  profitFactor: { type: Number, required: true },
  sharpeRatio: { type: Number, required: true },
  maxDrawdown: { type: Number, required: true },
  currentDrawdown: { type: Number, required: true },
  totalTrades: { type: Number, required: true },
  successfulTrades: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'performance_metrics'
});

// 🏥 SYSTEM HEALTH MODEL - Monitor everything
export interface ISystemHealth extends SystemHealth, Document {}
const SystemHealthSchema = new Schema<ISystemHealth>({
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
  lastHealthCheck: { type: Date, default: Date.now },
  issues: [{ type: String }]
}, {
  timestamps: true,
  collection: 'system_health'
});

// 🚀 CREATE ALL MODELS
export const TradingAccountModel = mongoose.model<ITradingAccount>('TradingAccount', TradingAccountSchema);
export const WhaleMovementModel = mongoose.model<IWhaleMovement>('WhaleMovement', WhaleMovementSchema);
export const WhaleClusterModel = mongoose.model<IWhaleCluster>('WhaleCluster', WhaleClusterSchema);
export const ArbitrageOpportunityModel = mongoose.model<IArbitrageOpportunity>('ArbitrageOpportunity', ArbitrageOpportunitySchema);
export const LiquidationSignalModel = mongoose.model<ILiquidationSignal>('LiquidationSignal', LiquidationSignalSchema);
export const StablecoinDepegModel = mongoose.model<IStablecoinDepeg>('StablecoinDepeg', StablecoinDepegSchema);
export const TradeSignalModel = mongoose.model<ITradeSignal>('TradeSignal', TradeSignalSchema);
export const ExecutionResultModel = mongoose.model<IExecutionResult>('ExecutionResult', ExecutionResultSchema);
export const AIStrategyModel = mongoose.model<IAIStrategy>('AIStrategy', AIStrategySchema);
export const MarketRegimeModel = mongoose.model<IMarketRegime>('MarketRegime', MarketRegimeSchema);
export const PerformanceMetricsModel = mongoose.model<IPerformanceMetrics>('PerformanceMetrics', PerformanceMetricsSchema);
export const SystemHealthModel = mongoose.model<ISystemHealth>('SystemHealth', SystemHealthSchema);

// 🎯 DATABASE CONNECTION AND SETUP
export class DatabaseManager {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.connectionString, {
        maxPoolSize: 100, // Support unlimited scaling
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('🚀 Database connected for UNLIMITED SCALING!');
      
      // Create indexes for performance
      await this.createIndexes();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    // Performance-critical indexes for high-frequency trading
    await WhaleMovementModel.collection.createIndex({ timestamp: -1, walletAddress: 1 });
    await ArbitrageOpportunityModel.collection.createIndex({ detectedAt: -1, expiresAt: 1 });
    await LiquidationSignalModel.collection.createIndex({ estimatedCascadeAt: 1, confidence: -1 });
    await TradeSignalModel.collection.createIndex({ executionDeadline: 1, urgency: -1 });
    await ExecutionResultModel.collection.createIndex({ executedAt: -1, account: 1 });
    await PerformanceMetricsModel.collection.createIndex({ accountId: 1, lastUpdated: -1 });
    
    console.log('📊 Database indexes created for MAXIMUM PERFORMANCE!');
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

export default DatabaseManager;
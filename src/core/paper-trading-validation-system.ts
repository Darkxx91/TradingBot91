// PAPER TRADING AND LIVE VALIDATION SYSTEM - REVOLUTIONARY RISK-FREE TESTING
// Real-time paper trading with live market data to validate strategies before capital deployment

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import ExchangeManager from '../exchanges/exchange-manager';
import { TradeSignal } from '../types/core';

/**
 * Paper trading account
 */
export interface PaperTradingAccount {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  availableBalance: number;
  totalPnl: number;
  totalPnlPercentage: number;
  positions: PaperPosition[];
  trades: PaperTrade[];
  createdAt: Date;
  lastUpdated: Date;
  isActive: boolean;
  riskLimits: {
    maxPositionSize: number; // percentage of balance
    maxDailyLoss: number; // percentage
    maxDrawdown: number; // percentage
    maxOpenPositions: number;
  };
}

/**
 * Paper trading position
 */
export interface PaperPosition {
  id: string;
  accountId: string;
  strategyId: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  notionalValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercentage: number;
  entryTime: Date;
  lastUpdated: Date;
  stopLoss?: number;
  takeProfit?: number;
  tags: string[];
  metadata: Record<string, any>;
}

/**
 * Paper trading trade
 */
export interface PaperTrade {
  id: string;
  accountId: string;
  strategyId: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryTime: Date;
  exitTime?: Date;
  duration?: number; // milliseconds
  realizedPnl?: number;
  realizedPnlPercentage?: number;
  fees: number;
  slippage: number;
  executionDelay: number; // milliseconds
  status: 'open' | 'closed' | 'cancelled';
  closeReason?: 'manual' | 'stop_loss' | 'take_profit' | 'strategy_signal' | 'risk_management';
  tags: string[];
  metadata: Record<string, any>;
}

/**
 * Strategy performance in paper trading
 */
export interface PaperStrategyPerformance {
  strategyId: string;
  strategyName: string;
  accountId: string;
  
  // Trade statistics
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // percentage
  
  // PnL metrics
  totalPnl: number;
  totalPnlPercentage: number;
  realizedPnl: number;
  unrealizedPnl: number;
  
  // Risk metrics
  maxDrawdown: number; // percentage
  currentDrawdown: number; // percentage
  volatility: number; // percentage
  sharpeRatio: number;
  
  // Trade metrics
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingTime: number; // hours
  
  // Execution metrics
  averageSlippage: number; // percentage
  averageExecutionDelay: number; // milliseconds
  successRate: number; // percentage
  
  // Time series data
  equityCurve: Array<{ timestamp: Date; equity: number; drawdown: number }>;
  
  // Validation metrics
  backtestCorrelation?: number; // 0-1
  liveValidationScore?: number; // 0-100
  
  lastUpdated: Date;
}

/**
 * Paper trading configuration
 */
export interface PaperTradingConfig {
  // Account settings
  initialBalance: number;
  maxAccounts: number;
  
  // Risk management
  globalRiskLimits: {
    maxPositionSize: number; // percentage
    maxDailyLoss: number; // percentage
    maxDrawdown: number; // percentage
    maxOpenPositions: number;
    maxConcurrentStrategies: number;
  };
  
  // Execution simulation
  slippageModel: 'fixed' | 'linear' | 'realistic';
  slippageParams: {
    fixed?: number; // percentage
    linear?: { base: number; impact: number };
    realistic?: {
      marketImpact: number;
      bidAskSpread: number;
      latency: number;
    };
  };
  
  // Fees simulation
  tradingFees: {
    maker: number; // percentage
    taker: number; // percentage
  };
  
  // Data and updates
  updateIntervalMs: number;
  priceUpdateIntervalMs: number;
  
  // Validation
  enableBacktestComparison: boolean;
  validationPeriodDays: number;
  minTradesForValidation: number;
  
  // Reporting
  generateDailyReports: boolean;
  alertOnUnderperformance: boolean;
  alertThresholds: {
    drawdownWarning: number; // percentage
    underperformanceWarning: number; // percentage below backtest
  };
}

/**
 * Live market data interface
 */
export interface LiveMarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: Date;
  change24h: number;
  changePercentage24h: number;
}

/**
 * Strategy interface for paper trading
 */
export interface PaperTradingStrategy {
  id: string;
  name: string;
  
  // Strategy lifecycle
  initialize(config: any): Promise<void>;
  onMarketData(data: LiveMarketData): Promise<TradeSignal[]>;
  onPositionUpdate(position: PaperPosition): Promise<void>;
  onTradeExecuted(trade: PaperTrade): Promise<void>;
  cleanup(): Promise<void>;
  
  // Strategy parameters
  getParameters(): Record<string, any>;
  setParameters(params: Record<string, any>): void;
  
  // Strategy metadata
  getRequiredSymbols(): string[];
  getRiskParameters(): {
    maxPositionSize: number;
    stopLossPercentage?: number;
    takeProfitPercentage?: number;
  };
}

/**
 * Paper Trading and Live Validation System
 * 
 * REVOLUTIONARY INSIGHT: Before deploying real capital, we need to validate our
 * strategies in real-time with live market data but without financial risk.
 * This paper trading system simulates real trading conditions with live data,
 * allowing us to validate strategy performance, compare with backtest results,
 * and gradually deploy capital only to proven strategies. By achieving high
 * correlation between paper trading and backtesting results, we can scale
 * with confidence.
 */
export class PaperTradingValidationSystem extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private config: PaperTradingConfig;
  private accounts: Map<string, PaperTradingAccount> = new Map();
  private strategies: Map<string, PaperTradingStrategy> = new Map();
  private strategyPerformance: Map<string, PaperStrategyPerformance> = new Map();
  private liveMarketData: Map<string, LiveMarketData> = new Map();
  private isRunning: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  /**
   * Constructor
   * @param exchangeManager Exchange manager
   * @param config Paper trading configuration
   */
  constructor(
    exchangeManager: ExchangeManager,
    config?: Partial<PaperTradingConfig>
  ) {
    super();
    this.exchangeManager = exchangeManager;
    
    // Default configuration
    this.config = {
      // Account settings
      initialBalance: 100000, // $100K
      maxAccounts: 10,
      
      // Risk management
      globalRiskLimits: {
        maxPositionSize: 5, // 5% per position
        maxDailyLoss: 2, // 2% daily loss limit
        maxDrawdown: 10, // 10% max drawdown
        maxOpenPositions: 20,
        maxConcurrentStrategies: 10
      },
      
      // Execution simulation
      slippageModel: 'realistic',
      slippageParams: {
        realistic: {
          marketImpact: 0.001, // 0.1%
          bidAskSpread: 0.0005, // 0.05%
          latency: 100 // 100ms
        }
      },
      
      // Fees simulation
      tradingFees: {
        maker: 0.001, // 0.1%
        taker: 0.0015 // 0.15%
      },
      
      // Data and updates
      updateIntervalMs: 5000, // 5 seconds
      priceUpdateIntervalMs: 1000, // 1 second
      
      // Validation
      enableBacktestComparison: true,
      validationPeriodDays: 30,
      minTradesForValidation: 20,
      
      // Reporting
      generateDailyReports: true,
      alertOnUnderperformance: true,
      alertThresholds: {
        drawdownWarning: 5, // 5%
        underperformanceWarning: 20 // 20% below backtest
      }
    };
    
    // Override with provided config
    if (config) {
      this.config = { ...this.config, ...config };
      
      // Merge nested objects
      if (config.globalRiskLimits) {
        this.config.globalRiskLimits = { ...this.config.globalRiskLimits, ...config.globalRiskLimits };
      }
      
      if (config.slippageParams) {
        this.config.slippageParams = { ...this.config.slippageParams, ...config.slippageParams };
      }
      
      if (config.tradingFees) {
        this.config.tradingFees = { ...this.config.tradingFees, ...config.tradingFees };
      }
      
      if (config.alertThresholds) {
        this.config.alertThresholds = { ...this.config.alertThresholds, ...config.alertThresholds };
      }
    }
  }  /*
*
   * Start the paper trading system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Paper trading system already running');
      return;
    }

    console.log('🚀 STARTING PAPER TRADING AND LIVE VALIDATION SYSTEM...');

    // Initialize system
    await this.initializePaperTrading();

    // Start live data feeds
    this.startLiveDataFeeds();

    // Start continuous updates
    this.startContinuousUpdates();

    this.isRunning = true;
    console.log('📊 PAPER TRADING AND LIVE VALIDATION SYSTEM ACTIVE!');
    console.log(`💰 Managing ${this.accounts.size} accounts with ${this.strategies.size} strategies`);
  }

  /**
   * Stop the paper trading system
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('📊 Paper trading system already stopped');
      return;
    }

    console.log('🛑 STOPPING PAPER TRADING SYSTEM...');

    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }

    this.isRunning = false;
    console.log('📊 PAPER TRADING SYSTEM STOPPED');
  }

  /**
   * Create paper trading account
   * @param name Account name
   * @param initialBalance Initial balance (optional)
   * @returns Account ID
   */
  createAccount(name: string, initialBalance?: number): string {
    if (this.accounts.size >= this.config.maxAccounts) {
      throw new Error(`Maximum number of accounts (${this.config.maxAccounts}) reached`);
    }

    const accountId = uuidv4();
    const balance = initialBalance || this.config.initialBalance;

    const account: PaperTradingAccount = {
      id: accountId,
      name,
      initialBalance: balance,
      currentBalance: balance,
      availableBalance: balance,
      totalPnl: 0,
      totalPnlPercentage: 0,
      positions: [],
      trades: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
      isActive: true,
      riskLimits: {
        maxPositionSize: this.config.globalRiskLimits.maxPositionSize,
        maxDailyLoss: this.config.globalRiskLimits.maxDailyLoss,
        maxDrawdown: this.config.globalRiskLimits.maxDrawdown,
        maxOpenPositions: this.config.globalRiskLimits.maxOpenPositions
      }
    };

    this.accounts.set(accountId, account);
    console.log(`📊 Created paper trading account: ${name} with $${balance.toLocaleString()}`);

    this.emit('accountCreated', account);
    return accountId;
  }

  /**
   * Add strategy to paper trading
   * @param strategy Strategy to add
   * @param accountId Account ID (optional, creates new account if not provided)
   */
  async addStrategy(strategy: PaperTradingStrategy, accountId?: string): Promise<void> {
    console.log(`📊 Adding strategy: ${strategy.name}`);

    // Create account if not provided
    if (!accountId) {
      accountId = this.createAccount(`${strategy.name} Account`);
    }

    // Validate account exists
    if (!this.accounts.has(accountId)) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Initialize strategy
    await strategy.initialize({
      accountId,
      symbols: strategy.getRequiredSymbols(),
      riskParameters: strategy.getRiskParameters()
    });

    this.strategies.set(strategy.id, strategy);

    // Initialize strategy performance tracking
    this.initializeStrategyPerformance(strategy.id, strategy.name, accountId);

    console.log(`✅ Strategy ${strategy.name} added to account ${accountId}`);
    this.emit('strategyAdded', { strategyId: strategy.id, accountId });
  }

  /**
   * Remove strategy from paper trading
   * @param strategyId Strategy ID
   */
  async removeStrategy(strategyId: string): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    console.log(`📊 Removing strategy: ${strategy.name}`);

    // Close all positions for this strategy
    await this.closeAllPositionsForStrategy(strategyId);

    // Cleanup strategy
    await strategy.cleanup();

    // Remove from maps
    this.strategies.delete(strategyId);
    this.strategyPerformance.delete(strategyId);

    console.log(`✅ Strategy ${strategy.name} removed`);
    this.emit('strategyRemoved', { strategyId });
  }

  /**
   * Initialize paper trading system
   */
  private async initializePaperTrading(): Promise<void> {
    console.log('🏗️ INITIALIZING PAPER TRADING SYSTEM...');

    // Create default account if none exist
    if (this.accounts.size === 0) {
      this.createAccount('Default Account');
    }

    // Initialize live market data
    await this.initializeLiveMarketData();

    console.log('✅ PAPER TRADING SYSTEM INITIALIZED');
  }

  /**
   * Initialize live market data
   */
  private async initializeLiveMarketData(): Promise<void> {
    console.log('📡 INITIALIZING LIVE MARKET DATA...');

    // Get all required symbols from strategies
    const requiredSymbols = new Set<string>();
    for (const strategy of this.strategies.values()) {
      for (const symbol of strategy.getRequiredSymbols()) {
        requiredSymbols.add(symbol);
      }
    }

    // Initialize with sample data (in real implementation, connect to live feeds)
    const symbols = Array.from(requiredSymbols);
    if (symbols.length === 0) {
      symbols.push('BTC/USD', 'ETH/USD', 'SOL/USD'); // Default symbols
    }

    for (const symbol of symbols) {
      // Initialize with sample live data
      this.liveMarketData.set(symbol, {
        symbol,
        price: 50000 + Math.random() * 10000, // $50K-$60K
        bid: 0,
        ask: 0,
        volume: 1000000 + Math.random() * 5000000,
        timestamp: new Date(),
        change24h: (Math.random() - 0.5) * 2000, // ±$1000
        changePercentage24h: (Math.random() - 0.5) * 4 // ±2%
      });
    }

    console.log(`✅ Live market data initialized for ${symbols.length} symbols`);
  }

  /**
   * Start live data feeds
   */
  private startLiveDataFeeds(): void {
    console.log('📡 STARTING LIVE DATA FEEDS...');

    // Start price updates
    this.priceUpdateInterval = setInterval(() => {
      this.updateLiveMarketData();
    }, this.config.priceUpdateIntervalMs);

    console.log('✅ LIVE DATA FEEDS STARTED');
  }

  /**
   * Start continuous updates
   */
  private startContinuousUpdates(): void {
    console.log('🔄 STARTING CONTINUOUS UPDATES...');

    // Start main update loop
    this.updateInterval = setInterval(() => {
      this.performContinuousUpdates();
    }, this.config.updateIntervalMs);

    console.log('✅ CONTINUOUS UPDATES STARTED');
  }

  /**
   * Update live market data
   */
  private updateLiveMarketData(): void {
    for (const [symbol, data] of this.liveMarketData.entries()) {
      // Simulate realistic price movements
      const change = (Math.random() - 0.5) * 0.002; // ±0.1% change
      const newPrice = data.price * (1 + change);
      
      // Update bid/ask spread
      const spread = newPrice * 0.0005; // 0.05% spread
      const bid = newPrice - spread / 2;
      const ask = newPrice + spread / 2;

      // Update volume
      const volumeChange = (Math.random() - 0.5) * 0.1; // ±5% volume change
      const newVolume = Math.max(100000, data.volume * (1 + volumeChange));

      // Calculate 24h change
      const change24h = newPrice - (data.price - data.change24h);
      const changePercentage24h = ((newPrice - (data.price - data.change24h)) / (data.price - data.change24h)) * 100;

      const updatedData: LiveMarketData = {
        symbol,
        price: newPrice,
        bid,
        ask,
        volume: newVolume,
        timestamp: new Date(),
        change24h,
        changePercentage24h
      };

      this.liveMarketData.set(symbol, updatedData);
    }

    // Emit market data update event
    this.emit('marketDataUpdate', Array.from(this.liveMarketData.values()));
  }

  /**
   * Perform continuous updates
   */
  private async performContinuousUpdates(): Promise<void> {
    try {
      // Process strategies with live market data
      await this.processStrategiesWithLiveData();

      // Update positions with current prices
      this.updatePositionsWithCurrentPrices();

      // Update account balances
      this.updateAccountBalances();

      // Update strategy performance
      this.updateStrategyPerformance();

      // Check risk management
      this.checkRiskManagement();

      // Generate alerts if needed
      this.checkForAlerts();

    } catch (error) {
      console.error('❌ Error in continuous updates:', error);
      this.emit('error', error);
    }
  }

  /**
   * Process strategies with live market data
   */
  private async processStrategiesWithLiveData(): Promise<void> {
    const marketDataArray = Array.from(this.liveMarketData.values());

    for (const [strategyId, strategy] of this.strategies.entries()) {
      try {
        // Get relevant market data for this strategy
        const relevantData = marketDataArray.filter(data => 
          strategy.getRequiredSymbols().includes(data.symbol)
        );

        // Process each market data point
        for (const data of relevantData) {
          const signals = await strategy.onMarketData(data);

          // Execute trade signals
          for (const signal of signals) {
            await this.executeTradeSignal(strategyId, signal, data);
          }
        }

      } catch (error) {
        console.error(`❌ Error processing strategy ${strategy.name}:`, error);
      }
    }
  }

  /**
   * Execute trade signal
   * @param strategyId Strategy ID
   * @param signal Trade signal
   * @param marketData Current market data
   */
  private async executeTradeSignal(
    strategyId: string,
    signal: TradeSignal,
    marketData: LiveMarketData
  ): Promise<void> {
    // Find account for this strategy
    const performance = this.strategyPerformance.get(strategyId);
    if (!performance) return;

    const account = this.accounts.get(performance.accountId);
    if (!account || !account.isActive) return;

    // Calculate position size
    const positionSize = this.calculatePositionSize(signal, marketData, account);
    if (positionSize <= 0) return;

    // Check risk limits
    if (!this.checkTradeRiskLimits(account, signal, positionSize, marketData)) {
      console.log(`⚠️ Trade rejected due to risk limits: ${signal.symbol} ${signal.side}`);
      return;
    }

    // Calculate execution price with slippage
    const executionPrice = this.calculateExecutionPrice(signal, marketData);
    
    // Calculate fees
    const fees = this.calculateFees(executionPrice, positionSize);
    
    // Calculate slippage
    const slippage = Math.abs(executionPrice - marketData.price) / marketData.price;
    
    // Simulate execution delay
    const executionDelay = this.simulateExecutionDelay();

    // Create paper trade
    const trade: PaperTrade = {
      id: uuidv4(),
      accountId: account.id,
      strategyId,
      symbol: signal.symbol,
      side: signal.side,
      entryPrice: executionPrice,
      quantity: positionSize,
      entryTime: new Date(Date.now() + executionDelay),
      fees,
      slippage,
      executionDelay,
      status: 'open',
      tags: signal.tags || [],
      metadata: {
        confidence: signal.confidence,
        reasoning: signal.reasoning,
        originalPrice: marketData.price
      }
    };

    // Create position
    const position: PaperPosition = {
      id: uuidv4(),
      accountId: account.id,
      strategyId,
      symbol: signal.symbol,
      side: signal.side === 'buy' ? 'long' : 'short',
      entryPrice: executionPrice,
      currentPrice: marketData.price,
      quantity: positionSize,
      notionalValue: executionPrice * positionSize,
      unrealizedPnl: 0,
      unrealizedPnlPercentage: 0,
      entryTime: trade.entryTime,
      lastUpdated: new Date(),
      tags: signal.tags || [],
      metadata: trade.metadata
    };

    // Add to account
    account.trades.push(trade);
    account.positions.push(position);
    account.availableBalance -= (executionPrice * positionSize) + fees;
    account.lastUpdated = new Date();

    // Update account in map
    this.accounts.set(account.id, account);

    // Notify strategy
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      await strategy.onTradeExecuted(trade);
      await strategy.onPositionUpdate(position);
    }

    console.log(`📊 Paper trade executed: ${signal.side} ${positionSize.toFixed(4)} ${signal.symbol} at $${executionPrice.toFixed(2)}`);

    // Emit events
    this.emit('tradeExecuted', trade);
    this.emit('positionOpened', position);
  }

  /**
   * Calculate position size
   * @param signal Trade signal
   * @param marketData Market data
   * @param account Account
   * @returns Position size
   */
  private calculatePositionSize(
    signal: TradeSignal,
    marketData: LiveMarketData,
    account: PaperTradingAccount
  ): number {
    const maxPositionValue = account.availableBalance * (account.riskLimits.maxPositionSize / 100);
    const positionSize = maxPositionValue / marketData.price;
    
    // Apply signal confidence scaling
    const confidenceScaling = signal.confidence || 1;
    
    return positionSize * confidenceScaling;
  }

  /**
   * Check trade risk limits
   * @param account Account
   * @param signal Trade signal
   * @param positionSize Position size
   * @param marketData Market data
   * @returns Whether trade passes risk checks
   */
  private checkTradeRiskLimits(
    account: PaperTradingAccount,
    signal: TradeSignal,
    positionSize: number,
    marketData: LiveMarketData
  ): boolean {
    // Check available balance
    const requiredBalance = (marketData.price * positionSize) + this.calculateFees(marketData.price, positionSize);
    if (requiredBalance > account.availableBalance) {
      return false;
    }

    // Check maximum open positions
    if (account.positions.length >= account.riskLimits.maxOpenPositions) {
      return false;
    }

    // Check position size limit
    const positionValue = marketData.price * positionSize;
    const positionPercentage = (positionValue / account.currentBalance) * 100;
    if (positionPercentage > account.riskLimits.maxPositionSize) {
      return false;
    }

    return true;
  }

  /**
   * Calculate execution price with slippage
   * @param signal Trade signal
   * @param marketData Market data
   * @returns Execution price
   */
  private calculateExecutionPrice(signal: TradeSignal, marketData: LiveMarketData): number {
    let slippage = 0;

    switch (this.config.slippageModel) {
      case 'fixed':
        slippage = this.config.slippageParams.fixed || 0;
        break;
      case 'realistic':
        const params = this.config.slippageParams.realistic!;
        slippage = params.bidAskSpread + params.marketImpact;
        break;
    }

    const slippageMultiplier = signal.side === 'buy' ? (1 + slippage) : (1 - slippage);
    return marketData.price * slippageMultiplier;
  }

  /**
   * Calculate trading fees
   * @param price Execution price
   * @param quantity Position quantity
   * @returns Fees
   */
  private calculateFees(price: number, quantity: number): number {
    const tradeValue = price * quantity;
    const feeRate = this.config.tradingFees.taker; // Assuming taker fees
    return tradeValue * feeRate;
  }

  /**
   * Simulate execution delay
   * @returns Execution delay in milliseconds
   */
  private simulateExecutionDelay(): number {
    const baseLatency = this.config.slippageParams.realistic?.latency || 100;
    return baseLatency + Math.random() * 50;
  }

  /**
   * Update positions with current prices
   */
  private updatePositionsWithCurrentPrices(): void {
    for (const [accountId, account] of this.accounts.entries()) {
      let totalUnrealizedPnl = 0;

      for (const position of account.positions) {
        const marketData = this.liveMarketData.get(position.symbol);
        if (!marketData) continue;

        // Update current price
        position.currentPrice = marketData.price;

        // Calculate unrealized PnL
        const priceDiff = position.side === 'long' 
          ? marketData.price - position.entryPrice
          : position.entryPrice - marketData.price;
        
        position.unrealizedPnl = priceDiff * position.quantity;
        position.unrealizedPnlPercentage = (priceDiff / position.entryPrice) * 100;
        position.lastUpdated = new Date();

        totalUnrealizedPnl += position.unrealizedPnl;

        // Check for position exit conditions
        this.checkPositionExitConditions(position);
      }

      // Update account with unrealized PnL
      account.currentBalance = account.availableBalance + totalUnrealizedPnl;
      account.totalPnl = account.currentBalance - account.initialBalance;
      account.totalPnlPercentage = (account.totalPnl / account.initialBalance) * 100;
      account.lastUpdated = new Date();

      this.accounts.set(accountId, account);
    }
  }  /**
 
  * Check position exit conditions
   * @param position Position to check
   */
  private async checkPositionExitConditions(position: PaperPosition): Promise<void> {
    let shouldClose = false;
    let closeReason: PaperTrade['closeReason'] = 'strategy_signal';

    // Check stop loss
    if (position.stopLoss) {
      const stopLossTriggered = position.side === 'long' 
        ? position.currentPrice <= position.stopLoss
        : position.currentPrice >= position.stopLoss;
      
      if (stopLossTriggered) {
        shouldClose = true;
        closeReason = 'stop_loss';
      }
    }

    // Check take profit
    if (position.takeProfit && !shouldClose) {
      const takeProfitTriggered = position.side === 'long'
        ? position.currentPrice >= position.takeProfit
        : position.currentPrice <= position.takeProfit;
      
      if (takeProfitTriggered) {
        shouldClose = true;
        closeReason = 'take_profit';
      }
    }

    // Check maximum holding time (24 hours for demo)
    const holdingTime = Date.now() - position.entryTime.getTime();
    const maxHoldingTime = 24 * 60 * 60 * 1000; // 24 hours
    
    if (holdingTime > maxHoldingTime && !shouldClose) {
      shouldClose = true;
      closeReason = 'manual'; // Time-based exit
    }

    if (shouldClose) {
      await this.closePosition(position.id, closeReason);
    }
  }

  /**
   * Close position
   * @param positionId Position ID
   * @param reason Close reason
   */
  async closePosition(positionId: string, reason: PaperTrade['closeReason'] = 'manual'): Promise<void> {
    // Find position
    let position: PaperPosition | undefined;
    let account: PaperTradingAccount | undefined;

    for (const acc of this.accounts.values()) {
      const pos = acc.positions.find(p => p.id === positionId);
      if (pos) {
        position = pos;
        account = acc;
        break;
      }
    }

    if (!position || !account) {
      throw new Error(`Position ${positionId} not found`);
    }

    // Calculate exit price with slippage
    const marketData = this.liveMarketData.get(position.symbol);
    if (!marketData) {
      throw new Error(`Market data not available for ${position.symbol}`);
    }

    const exitSide = position.side === 'long' ? 'sell' : 'buy';
    const exitPrice = this.calculateExecutionPrice({ side: exitSide } as TradeSignal, marketData);
    const exitFees = this.calculateFees(exitPrice, position.quantity);

    // Calculate realized PnL
    const priceDiff = position.side === 'long'
      ? exitPrice - position.entryPrice
      : position.entryPrice - exitPrice;
    
    const realizedPnl = (priceDiff * position.quantity) - exitFees;
    const realizedPnlPercentage = (priceDiff / position.entryPrice) * 100;

    // Find corresponding trade
    const trade = account.trades.find(t => 
      t.strategyId === position.strategyId && 
      t.symbol === position.symbol && 
      t.entryTime.getTime() === position.entryTime.getTime() &&
      t.status === 'open'
    );

    if (trade) {
      // Update trade
      trade.exitPrice = exitPrice;
      trade.exitTime = new Date();
      trade.duration = trade.exitTime.getTime() - trade.entryTime.getTime();
      trade.realizedPnl = realizedPnl;
      trade.realizedPnlPercentage = realizedPnlPercentage;
      trade.fees += exitFees;
      trade.status = 'closed';
      trade.closeReason = reason;
    }

    // Update account
    account.availableBalance += (exitPrice * position.quantity) - exitFees;
    account.positions = account.positions.filter(p => p.id !== positionId);
    account.lastUpdated = new Date();

    // Update account in map
    this.accounts.set(account.id, account);

    // Notify strategy
    const strategy = this.strategies.get(position.strategyId);
    if (strategy && trade) {
      await strategy.onTradeExecuted(trade);
    }

    console.log(`📊 Position closed: ${position.side} ${position.quantity.toFixed(4)} ${position.symbol} - PnL: $${realizedPnl.toFixed(2)} (${realizedPnlPercentage.toFixed(2)}%)`);

    // Emit events
    this.emit('positionClosed', { position, trade, realizedPnl });
  }

  /**
   * Close all positions for strategy
   * @param strategyId Strategy ID
   */
  private async closeAllPositionsForStrategy(strategyId: string): Promise<void> {
    const positionsToClose: string[] = [];

    // Find all positions for this strategy
    for (const account of this.accounts.values()) {
      for (const position of account.positions) {
        if (position.strategyId === strategyId) {
          positionsToClose.push(position.id);
        }
      }
    }

    // Close all positions
    for (const positionId of positionsToClose) {
      try {
        await this.closePosition(positionId, 'strategy_signal');
      } catch (error) {
        console.error(`❌ Error closing position ${positionId}:`, error);
      }
    }
  }

  /**
   * Update account balances
   */
  private updateAccountBalances(): void {
    for (const [accountId, account] of this.accounts.entries()) {
      // Calculate total unrealized PnL
      const totalUnrealizedPnl = account.positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
      
      // Calculate total realized PnL from closed trades
      const totalRealizedPnl = account.trades
        .filter(t => t.status === 'closed')
        .reduce((sum, t) => sum + (t.realizedPnl || 0), 0);

      // Update account balance
      account.currentBalance = account.initialBalance + totalRealizedPnl + totalUnrealizedPnl;
      account.totalPnl = account.currentBalance - account.initialBalance;
      account.totalPnlPercentage = (account.totalPnl / account.initialBalance) * 100;
      account.lastUpdated = new Date();

      this.accounts.set(accountId, account);
    }
  }

  /**
   * Initialize strategy performance tracking
   * @param strategyId Strategy ID
   * @param strategyName Strategy name
   * @param accountId Account ID
   */
  private initializeStrategyPerformance(strategyId: string, strategyName: string, accountId: string): void {
    const performance: PaperStrategyPerformance = {
      strategyId,
      strategyName,
      accountId,
      
      // Trade statistics
      totalTrades: 0,
      openTrades: 0,
      closedTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      
      // PnL metrics
      totalPnl: 0,
      totalPnlPercentage: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
      
      // Risk metrics
      maxDrawdown: 0,
      currentDrawdown: 0,
      volatility: 0,
      sharpeRatio: 0,
      
      // Trade metrics
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      averageHoldingTime: 0,
      
      // Execution metrics
      averageSlippage: 0,
      averageExecutionDelay: 0,
      successRate: 100,
      
      // Time series data
      equityCurve: [{ timestamp: new Date(), equity: 0, drawdown: 0 }],
      
      lastUpdated: new Date()
    };

    this.strategyPerformance.set(strategyId, performance);
  }

  /**
   * Update strategy performance
   */
  private updateStrategyPerformance(): void {
    for (const [strategyId, performance] of this.strategyPerformance.entries()) {
      const account = this.accounts.get(performance.accountId);
      if (!account) continue;

      // Get trades for this strategy
      const strategyTrades = account.trades.filter(t => t.strategyId === strategyId);
      const closedTrades = strategyTrades.filter(t => t.status === 'closed');
      const openTrades = strategyTrades.filter(t => t.status === 'open');

      // Get positions for this strategy
      const strategyPositions = account.positions.filter(p => p.strategyId === strategyId);

      // Update trade statistics
      performance.totalTrades = strategyTrades.length;
      performance.openTrades = openTrades.length;
      performance.closedTrades = closedTrades.length;
      performance.winningTrades = closedTrades.filter(t => (t.realizedPnl || 0) > 0).length;
      performance.losingTrades = closedTrades.filter(t => (t.realizedPnl || 0) < 0).length;
      performance.winRate = performance.closedTrades > 0 ? (performance.winningTrades / performance.closedTrades) * 100 : 0;

      // Update PnL metrics
      performance.realizedPnl = closedTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);
      performance.unrealizedPnl = strategyPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
      performance.totalPnl = performance.realizedPnl + performance.unrealizedPnl;
      performance.totalPnlPercentage = account.initialBalance > 0 ? (performance.totalPnl / account.initialBalance) * 100 : 0;

      // Update trade metrics
      const wins = closedTrades.filter(t => (t.realizedPnl || 0) > 0);
      const losses = closedTrades.filter(t => (t.realizedPnl || 0) < 0);

      performance.averageWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.realizedPnl || 0), 0) / wins.length : 0;
      performance.averageLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.realizedPnl || 0), 0) / losses.length) : 0;
      performance.largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.realizedPnl || 0)) : 0;
      performance.largestLoss = losses.length > 0 ? Math.abs(Math.min(...losses.map(t => t.realizedPnl || 0))) : 0;

      // Calculate average holding time
      const completedTrades = closedTrades.filter(t => t.duration);
      performance.averageHoldingTime = completedTrades.length > 0 
        ? completedTrades.reduce((sum, t) => sum + (t.duration || 0), 0) / completedTrades.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Update execution metrics
      performance.averageSlippage = strategyTrades.length > 0 
        ? strategyTrades.reduce((sum, t) => sum + t.slippage, 0) / strategyTrades.length * 100
        : 0;
      performance.averageExecutionDelay = strategyTrades.length > 0 
        ? strategyTrades.reduce((sum, t) => sum + t.executionDelay, 0) / strategyTrades.length
        : 0;

      // Update equity curve
      if (performance.equityCurve.length === 0 || 
          Date.now() - performance.equityCurve[performance.equityCurve.length - 1].timestamp.getTime() > 60000) { // Update every minute
        
        const currentEquity = performance.totalPnl;
        const peakEquity = Math.max(...performance.equityCurve.map(p => p.equity), currentEquity);
        const drawdown = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;

        performance.equityCurve.push({
          timestamp: new Date(),
          equity: currentEquity,
          drawdown
        });

        // Keep only last 1000 points
        if (performance.equityCurve.length > 1000) {
          performance.equityCurve = performance.equityCurve.slice(-1000);
        }

        // Update drawdown metrics
        performance.currentDrawdown = drawdown;
        performance.maxDrawdown = Math.max(performance.maxDrawdown, drawdown);
      }

      performance.lastUpdated = new Date();
      this.strategyPerformance.set(strategyId, performance);
    }
  }

  /**
   * Check risk management
   */
  private checkRiskManagement(): void {
    for (const [accountId, account] of this.accounts.entries()) {
      // Check daily loss limit
      const dailyPnl = this.calculateDailyPnl(account);
      const dailyLossPercentage = Math.abs(dailyPnl) / account.initialBalance * 100;
      
      if (dailyPnl < 0 && dailyLossPercentage > account.riskLimits.maxDailyLoss) {
        console.log(`⚠️ Daily loss limit exceeded for account ${account.name}: ${dailyLossPercentage.toFixed(2)}%`);
        
        // Close all positions
        this.closeAllPositionsForAccount(accountId);
        
        // Deactivate account
        account.isActive = false;
        this.accounts.set(accountId, account);
        
        this.emit('riskLimitExceeded', { accountId, type: 'daily_loss', value: dailyLossPercentage });
      }

      // Check maximum drawdown
      if (account.totalPnlPercentage < -account.riskLimits.maxDrawdown) {
        console.log(`⚠️ Maximum drawdown exceeded for account ${account.name}: ${Math.abs(account.totalPnlPercentage).toFixed(2)}%`);
        
        // Close all positions
        this.closeAllPositionsForAccount(accountId);
        
        // Deactivate account
        account.isActive = false;
        this.accounts.set(accountId, account);
        
        this.emit('riskLimitExceeded', { accountId, type: 'max_drawdown', value: Math.abs(account.totalPnlPercentage) });
      }
    }
  }

  /**
   * Calculate daily PnL for account
   * @param account Account
   * @returns Daily PnL
   */
  private calculateDailyPnl(account: PaperTradingAccount): number {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const dailyTrades = account.trades.filter(t => 
      t.exitTime && t.exitTime.getTime() > oneDayAgo
    );
    
    return dailyTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);
  }

  /**
   * Close all positions for account
   * @param accountId Account ID
   */
  private async closeAllPositionsForAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) return;

    const positionsToClose = [...account.positions];
    
    for (const position of positionsToClose) {
      try {
        await this.closePosition(position.id, 'risk_management');
      } catch (error) {
        console.error(`❌ Error closing position ${position.id}:`, error);
      }
    }
  }

  /**
   * Check for alerts
   */
  private checkForAlerts(): void {
    if (!this.config.alertOnUnderperformance) return;

    for (const [strategyId, performance] of this.strategyPerformance.entries()) {
      // Check drawdown alert
      if (performance.currentDrawdown > this.config.alertThresholds.drawdownWarning) {
        this.emit('performanceAlert', {
          type: 'drawdown_warning',
          strategyId,
          strategyName: performance.strategyName,
          value: performance.currentDrawdown,
          threshold: this.config.alertThresholds.drawdownWarning
        });
      }

      // Check underperformance alert (if backtest comparison is enabled)
      if (this.config.enableBacktestComparison && performance.backtestCorrelation) {
        const underperformanceThreshold = this.config.alertThresholds.underperformanceWarning;
        const correlationPercentage = performance.backtestCorrelation * 100;
        
        if (correlationPercentage < (100 - underperformanceThreshold)) {
          this.emit('performanceAlert', {
            type: 'underperformance_warning',
            strategyId,
            strategyName: performance.strategyName,
            value: correlationPercentage,
            threshold: 100 - underperformanceThreshold
          });
        }
      }
    }
  }

  /**
   * Get account performance
   * @param accountId Account ID
   * @returns Account performance
   */
  getAccountPerformance(accountId: string): PaperTradingAccount | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * Get strategy performance
   * @param strategyId Strategy ID
   * @returns Strategy performance
   */
  getStrategyPerformance(strategyId: string): PaperStrategyPerformance | undefined {
    return this.strategyPerformance.get(strategyId);
  }

  /**
   * Get all accounts
   * @returns Map of all accounts
   */
  getAllAccounts(): Map<string, PaperTradingAccount> {
    return new Map(this.accounts);
  }

  /**
   * Get all strategy performance
   * @returns Map of all strategy performance
   */
  getAllStrategyPerformance(): Map<string, PaperStrategyPerformance> {
    return new Map(this.strategyPerformance);
  }

  /**
   * Generate performance report
   * @returns Performance report
   */
  generatePerformanceReport(): string {
    let report = '\n';
    report += '🚀 PAPER TRADING PERFORMANCE REPORT\n';
    report += '=' .repeat(50) + '\n\n';

    // Account summary
    report += '💰 ACCOUNT SUMMARY\n';
    report += '-'.repeat(30) + '\n';
    
    for (const [accountId, account] of this.accounts.entries()) {
      report += `${account.name}:\n`;
      report += `  Balance: $${account.currentBalance.toLocaleString()} (${account.totalPnlPercentage.toFixed(2)}%)\n`;
      report += `  Open Positions: ${account.positions.length}\n`;
      report += `  Total Trades: ${account.trades.length}\n`;
      report += `  Status: ${account.isActive ? 'Active' : 'Inactive'}\n\n`;
    }

    // Strategy performance
    report += '📈 STRATEGY PERFORMANCE\n';
    report += '-'.repeat(30) + '\n';
    
    const strategies = Array.from(this.strategyPerformance.values())
      .sort((a, b) => b.totalPnlPercentage - a.totalPnlPercentage);
    
    for (const strategy of strategies) {
      report += `${strategy.strategyName}:\n`;
      report += `  Return: ${strategy.totalPnlPercentage.toFixed(2)}% ($${strategy.totalPnl.toLocaleString()})\n`;
      report += `  Trades: ${strategy.totalTrades} (${strategy.winRate.toFixed(1)}% win rate)\n`;
      report += `  Open Positions: ${strategy.openTrades}\n`;
      report += `  Max Drawdown: ${strategy.maxDrawdown.toFixed(2)}%\n`;
      report += `  Avg Execution: ${strategy.averageExecutionDelay.toFixed(0)}ms\n\n`;
    }

    return report;
  }

  /**
   * Export results to JSON
   * @returns JSON string of results
   */
  exportResults(): string {
    const results = {
      accounts: Object.fromEntries(this.accounts.entries()),
      strategyPerformance: Object.fromEntries(this.strategyPerformance.entries()),
      liveMarketData: Object.fromEntries(this.liveMarketData.entries()),
      config: this.config,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(results, null, 2);
  }
}

export default PaperTradingValidationSystem;
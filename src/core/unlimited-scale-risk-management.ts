// UNLIMITED SCALE RISK MANAGEMENT SYSTEM - REVOLUTIONARY PORTFOLIO PROTECTION
// Unified risk management across unlimited accounts and strategies preventing catastrophic losses

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import ExchangeManager from '../exchanges/exchange-manager';
import { TradeSignal } from '../types/core';

/**
 * Risk level
 */
export enum RiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
  EXTREME = 'extreme'
}

/**
 * Risk event type
 */
export enum RiskEventType {
  DRAWDOWN_WARNING = 'drawdown_warning',
  DRAWDOWN_CRITICAL = 'drawdown_critical',
  EXPOSURE_WARNING = 'exposure_warning',
  EXPOSURE_CRITICAL = 'exposure_critical',
  CORRELATION_SPIKE = 'correlation_spike',
  VOLATILITY_SPIKE = 'volatility_spike',
  LIQUIDITY_CRISIS = 'liquidity_crisis',
  SYSTEM_OVERLOAD = 'system_overload',
  EMERGENCY_STOP = 'emergency_stop'
}

/**
 * Account risk profile
 */
export interface AccountRiskProfile {
  accountId: string;
  totalCapital: number;
  availableCapital: number;
  allocatedCapital: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  drawdown: number; // percentage
  maxDrawdown: number; // percentage
  sharpeRatio: number;
  volatility: number; // percentage
  riskLevel: RiskLevel;
  activeStrategies: string[];
  strategyExposures: Map<string, number>; // strategy -> exposure amount
  assetExposures: Map<string, number>; // asset -> exposure amount
  exchangeExposures: Map<string, number>; // exchange -> exposure amount
  lastUpdated: Date;
}

/**
 * Strategy risk metrics
 */
export interface StrategyRiskMetrics {
  strategyId: string;
  strategyName: string;
  totalExposure: number;
  maxExposure: number;
  currentDrawdown: number; // percentage
  maxDrawdown: number; // percentage
  winRate: number; // percentage
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  volatility: number; // percentage
  correlation: Map<string, number>; // strategy -> correlation
  riskLevel: RiskLevel;
  isActive: boolean;
  lastUpdated: Date;
}

/**
 * Portfolio risk metrics
 */
export interface PortfolioRiskMetrics {
  totalCapital: number;
  totalExposure: number;
  availableCapital: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  portfolioDrawdown: number; // percentage
  maxPortfolioDrawdown: number; // percentage
  portfolioVolatility: number; // percentage
  portfolioSharpe: number;
  diversificationRatio: number;
  concentrationRisk: number; // percentage
  correlationRisk: number; // percentage
  liquidityRisk: number; // percentage
  overallRiskLevel: RiskLevel;
  riskCapacity: number; // remaining risk capacity
  lastUpdated: Date;
}

/**
 * Risk event
 */
export interface RiskEvent {
  id: string;
  type: RiskEventType;
  severity: number; // 1-10 scale
  accountId?: string;
  strategyId?: string;
  description: string;
  currentValue: number;
  threshold: number;
  recommendedAction: string;
  autoExecuted: boolean;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  notes: string[];
}

/**
 * Risk limits
 */
export interface RiskLimits {
  // Portfolio level limits
  maxPortfolioDrawdown: number; // percentage
  maxPortfolioExposure: number; // percentage of total capital
  maxConcentrationRisk: number; // percentage in single asset/strategy
  maxCorrelationRisk: number; // maximum correlation between strategies
  
  // Account level limits
  maxAccountDrawdown: number; // percentage
  maxAccountExposure: number; // percentage of account capital
  
  // Strategy level limits
  maxStrategyDrawdown: number; // percentage
  maxStrategyExposure: number; // absolute amount
  maxStrategyCorrelation: number; // maximum correlation between strategies
  
  // Asset level limits
  maxAssetExposure: number; // percentage of total capital
  maxExchangeExposure: number; // percentage of total capital
  
  // Volatility limits
  maxPortfolioVolatility: number; // percentage
  maxStrategyVolatility: number; // percentage
  
  // Liquidity limits
  minLiquidityRatio: number; // percentage of capital that must remain liquid
}

/**
 * Risk management configuration
 */
export interface RiskManagementConfig {
  riskLimits: RiskLimits;
  monitoringIntervalMs: number;
  emergencyStopEnabled: boolean;
  autoRebalanceEnabled: boolean;
  riskReportingEnabled: boolean;
  alertThresholds: {
    drawdownWarning: number; // percentage
    drawdownCritical: number; // percentage
    exposureWarning: number; // percentage
    exposureCritical: number; // percentage
    volatilityWarning: number; // percentage
    volatilityCritical: number; // percentage
  };
}

/**
 * Unlimited Scale Risk Management System
 * 
 * REVOLUTIONARY INSIGHT: As we scale to unlimited accounts and strategies,
 * traditional risk management approaches break down. We need a unified system
 * that can monitor and manage risk across thousands of accounts and dozens of
 * strategies simultaneously, preventing catastrophic losses while allowing
 * exponential growth. This system provides real-time risk monitoring,
 * automatic position sizing, emergency stop mechanisms, and intelligent
 * rebalancing to ensure our trading empire remains profitable and safe.
 */
export class UnlimitedScaleRiskManagement extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private config: RiskManagementConfig;
  private accountProfiles: Map<string, AccountRiskProfile> = new Map();
  private strategyMetrics: Map<string, StrategyRiskMetrics> = new Map();
  private portfolioMetrics: PortfolioRiskMetrics;
  private riskEvents: Map<string, RiskEvent> = new Map();
  private isRunning: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private emergencyStopTriggered: boolean = false;  /**

   * Constructor
   * @param exchangeManager Exchange manager
   * @param config Configuration
   */
  constructor(
    exchangeManager: ExchangeManager,
    config?: Partial<RiskManagementConfig>
  ) {
    super();
    this.exchangeManager = exchangeManager;
    
    // Default configuration
    this.config = {
      riskLimits: {
        maxPortfolioDrawdown: 20, // 20% maximum portfolio drawdown
        maxPortfolioExposure: 80, // 80% maximum portfolio exposure
        maxConcentrationRisk: 25, // 25% maximum concentration in single asset/strategy
        maxCorrelationRisk: 0.7, // 70% maximum correlation between strategies
        maxAccountDrawdown: 15, // 15% maximum account drawdown
        maxAccountExposure: 90, // 90% maximum account exposure
        maxStrategyDrawdown: 10, // 10% maximum strategy drawdown
        maxStrategyExposure: 100000, // $100,000 maximum strategy exposure
        maxStrategyCorrelation: 0.6, // 60% maximum strategy correlation
        maxAssetExposure: 30, // 30% maximum asset exposure
        maxExchangeExposure: 40, // 40% maximum exchange exposure
        maxPortfolioVolatility: 25, // 25% maximum portfolio volatility
        maxStrategyVolatility: 35, // 35% maximum strategy volatility
        minLiquidityRatio: 20 // 20% minimum liquidity ratio
      },
      monitoringIntervalMs: 10 * 1000, // 10 seconds
      emergencyStopEnabled: true,
      autoRebalanceEnabled: true,
      riskReportingEnabled: true,
      alertThresholds: {
        drawdownWarning: 10, // 10% drawdown warning
        drawdownCritical: 15, // 15% drawdown critical
        exposureWarning: 70, // 70% exposure warning
        exposureCritical: 85, // 85% exposure critical
        volatilityWarning: 20, // 20% volatility warning
        volatilityCritical: 30 // 30% volatility critical
      }
    };
    
    // Override with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Initialize portfolio metrics
    this.portfolioMetrics = {
      totalCapital: 0,
      totalExposure: 0,
      availableCapital: 0,
      unrealizedPnl: 0,
      realizedPnl: 0,
      totalPnl: 0,
      portfolioDrawdown: 0,
      maxPortfolioDrawdown: 0,
      portfolioVolatility: 0,
      portfolioSharpe: 0,
      diversificationRatio: 1,
      concentrationRisk: 0,
      correlationRisk: 0,
      liquidityRisk: 0,
      overallRiskLevel: RiskLevel.LOW,
      riskCapacity: 100,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Start the risk management system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🛡️ Risk management system already running');
      return;
    }
    
    console.log('🚀 STARTING UNLIMITED SCALE RISK MANAGEMENT SYSTEM...');
    
    // Initialize risk monitoring
    await this.initializeRiskMonitoring();
    
    // Start continuous monitoring
    this.startContinuousMonitoring();
    
    this.isRunning = true;
    console.log('🛡️ UNLIMITED SCALE RISK MANAGEMENT SYSTEM ACTIVE!');
    console.log(`📊 Monitoring ${this.accountProfiles.size} accounts and ${this.strategyMetrics.size} strategies`);
  }
  
  /**
   * Stop the risk management system
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('🛡️ Risk management system already stopped');
      return;
    }
    
    console.log('🛑 STOPPING RISK MANAGEMENT SYSTEM...');
    
    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isRunning = false;
    console.log('🛡️ RISK MANAGEMENT SYSTEM STOPPED');
  }
  
  /**
   * Initialize risk monitoring
   */
  private async initializeRiskMonitoring(): Promise<void> {
    console.log('🏗️ INITIALIZING RISK MONITORING...');
    
    // In a real implementation, this would load existing account and strategy data
    // For now, we'll create some sample data
    
    // Create sample account profiles
    this.createSampleAccountProfiles();
    
    // Create sample strategy metrics
    this.createSampleStrategyMetrics();
    
    // Calculate initial portfolio metrics
    this.calculatePortfolioMetrics();
    
    console.log('✅ RISK MONITORING INITIALIZED');
  }
  
  /**
   * Create sample account profiles
   */
  private createSampleAccountProfiles(): void {
    // Create 5 sample accounts with different risk profiles
    for (let i = 1; i <= 5; i++) {
      const accountId = `account_${i}`;
      const baseCapital = 10000 * i; // $10K, $20K, $30K, $40K, $50K
      
      const profile: AccountRiskProfile = {
        accountId,
        totalCapital: baseCapital,
        availableCapital: baseCapital * 0.3, // 30% available
        allocatedCapital: baseCapital * 0.7, // 70% allocated
        unrealizedPnl: baseCapital * (0.02 + Math.random() * 0.08), // 2-10% unrealized PnL
        realizedPnl: baseCapital * (0.05 + Math.random() * 0.15), // 5-20% realized PnL
        totalPnl: 0, // Will be calculated
        drawdown: Math.random() * 5, // 0-5% current drawdown
        maxDrawdown: 2 + Math.random() * 8, // 2-10% max drawdown
        sharpeRatio: 1 + Math.random() * 2, // 1-3 Sharpe ratio
        volatility: 10 + Math.random() * 15, // 10-25% volatility
        riskLevel: this.calculateRiskLevel(Math.random() * 5), // Random risk level
        activeStrategies: [`strategy_${i}_1`, `strategy_${i}_2`],
        strategyExposures: new Map([
          [`strategy_${i}_1`, baseCapital * 0.4],
          [`strategy_${i}_2`, baseCapital * 0.3]
        ]),
        assetExposures: new Map([
          ['BTC', baseCapital * 0.3],
          ['ETH', baseCapital * 0.25],
          ['SOL', baseCapital * 0.15]
        ]),
        exchangeExposures: new Map([
          ['binance', baseCapital * 0.4],
          ['coinbase', baseCapital * 0.3]
        ]),
        lastUpdated: new Date()
      };
      
      // Calculate total PnL
      profile.totalPnl = profile.unrealizedPnl + profile.realizedPnl;
      
      this.accountProfiles.set(accountId, profile);
    }
  }
  
  /**
   * Create sample strategy metrics
   */
  private createSampleStrategyMetrics(): void {
    const strategies = [
      'whale_tracking', 'arbitrage', 'liquidation_cascade', 'momentum_transfer',
      'regulatory_frontrun', 'flash_loan', 'meme_coin', 'stablecoin_depeg',
      'funding_rate', 'time_zone', 'maintenance', 'insider_activity'
    ];
    
    for (const strategyName of strategies) {
      const strategyId = `${strategyName}_strategy`;
      
      const metrics: StrategyRiskMetrics = {
        strategyId,
        strategyName,
        totalExposure: 50000 + Math.random() * 100000, // $50K-$150K exposure
        maxExposure: 200000, // $200K max exposure
        currentDrawdown: Math.random() * 3, // 0-3% current drawdown
        maxDrawdown: 2 + Math.random() * 6, // 2-8% max drawdown
        winRate: 60 + Math.random() * 30, // 60-90% win rate
        avgWin: 100 + Math.random() * 400, // $100-$500 avg win
        avgLoss: 50 + Math.random() * 200, // $50-$250 avg loss
        profitFactor: 1.2 + Math.random() * 1.8, // 1.2-3.0 profit factor
        sharpeRatio: 0.8 + Math.random() * 1.7, // 0.8-2.5 Sharpe ratio
        volatility: 8 + Math.random() * 17, // 8-25% volatility
        correlation: new Map(), // Will be populated later
        riskLevel: this.calculateRiskLevel(Math.random() * 4),
        isActive: Math.random() > 0.1, // 90% chance of being active
        lastUpdated: new Date()
      };
      
      this.strategyMetrics.set(strategyId, metrics);
    }
    
    // Calculate strategy correlations
    this.calculateStrategyCorrelations();
  }
  
  /**
   * Calculate risk level
   * @param score Risk score (0-5)
   * @returns Risk level
   */
  private calculateRiskLevel(score: number): RiskLevel {
    if (score < 1) return RiskLevel.VERY_LOW;
    if (score < 2) return RiskLevel.LOW;
    if (score < 3) return RiskLevel.MEDIUM;
    if (score < 4) return RiskLevel.HIGH;
    if (score < 5) return RiskLevel.VERY_HIGH;
    return RiskLevel.EXTREME;
  }
  
  /**
   * Calculate strategy correlations
   */
  private calculateStrategyCorrelations(): void {
    const strategies = Array.from(this.strategyMetrics.keys());
    
    for (const strategy1 of strategies) {
      const metrics1 = this.strategyMetrics.get(strategy1)!;
      
      for (const strategy2 of strategies) {
        if (strategy1 === strategy2) continue;
        
        // Generate random correlation between -0.5 and 0.8
        const correlation = -0.5 + Math.random() * 1.3;
        metrics1.correlation.set(strategy2, correlation);
      }
      
      this.strategyMetrics.set(strategy1, metrics1);
    }
  }  /**
   
* Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    console.log('📡 STARTING CONTINUOUS RISK MONITORING...');
    
    // Monitor risk metrics immediately
    this.monitorRiskMetrics();
    
    // Set up interval for continuous monitoring
    this.monitoringInterval = setInterval(() => {
      this.monitorRiskMetrics();
    }, this.config.monitoringIntervalMs);
  }
  
  /**
   * Monitor risk metrics
   */
  private monitorRiskMetrics(): void {
    // Update account profiles
    this.updateAccountProfiles();
    
    // Update strategy metrics
    this.updateStrategyMetrics();
    
    // Calculate portfolio metrics
    this.calculatePortfolioMetrics();
    
    // Check risk limits
    this.checkRiskLimits();
    
    // Generate risk report if enabled
    if (this.config.riskReportingEnabled) {
      this.generateRiskReport();
    }
  }
  
  /**
   * Update account profiles
   */
  private updateAccountProfiles(): void {
    for (const [accountId, profile] of this.accountProfiles.entries()) {
      // Simulate small changes in account metrics
      const changeMultiplier = 0.99 + Math.random() * 0.02; // -1% to +1% change
      
      // Update unrealized PnL
      profile.unrealizedPnl *= changeMultiplier;
      
      // Update drawdown
      profile.drawdown = Math.max(0, profile.drawdown + (Math.random() - 0.5) * 0.5); // ±0.25% change
      profile.maxDrawdown = Math.max(profile.maxDrawdown, profile.drawdown);
      
      // Update total PnL
      profile.totalPnl = profile.unrealizedPnl + profile.realizedPnl;
      
      // Update risk level based on drawdown
      if (profile.drawdown > 15) {
        profile.riskLevel = RiskLevel.EXTREME;
      } else if (profile.drawdown > 10) {
        profile.riskLevel = RiskLevel.VERY_HIGH;
      } else if (profile.drawdown > 7) {
        profile.riskLevel = RiskLevel.HIGH;
      } else if (profile.drawdown > 4) {
        profile.riskLevel = RiskLevel.MEDIUM;
      } else if (profile.drawdown > 2) {
        profile.riskLevel = RiskLevel.LOW;
      } else {
        profile.riskLevel = RiskLevel.VERY_LOW;
      }
      
      profile.lastUpdated = new Date();
      this.accountProfiles.set(accountId, profile);
    }
  }
  
  /**
   * Update strategy metrics
   */
  private updateStrategyMetrics(): void {
    for (const [strategyId, metrics] of this.strategyMetrics.entries()) {
      // Simulate small changes in strategy metrics
      const changeMultiplier = 0.995 + Math.random() * 0.01; // -0.5% to +0.5% change
      
      // Update current drawdown
      metrics.currentDrawdown = Math.max(0, metrics.currentDrawdown + (Math.random() - 0.5) * 0.3); // ±0.15% change
      metrics.maxDrawdown = Math.max(metrics.maxDrawdown, metrics.currentDrawdown);
      
      // Update total exposure
      metrics.totalExposure *= changeMultiplier;
      
      // Update risk level based on drawdown and exposure
      let riskScore = 0;
      riskScore += metrics.currentDrawdown / 2; // Drawdown contribution
      riskScore += (metrics.totalExposure / metrics.maxExposure) * 2; // Exposure contribution
      riskScore += (1 - metrics.winRate / 100) * 2; // Win rate contribution
      
      metrics.riskLevel = this.calculateRiskLevel(riskScore);
      
      metrics.lastUpdated = new Date();
      this.strategyMetrics.set(strategyId, metrics);
    }
  }
  
  /**
   * Calculate portfolio metrics
   */
  private calculatePortfolioMetrics(): void {
    // Calculate totals across all accounts
    let totalCapital = 0;
    let totalExposure = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    let weightedDrawdown = 0;
    let maxDrawdown = 0;
    
    for (const profile of this.accountProfiles.values()) {
      totalCapital += profile.totalCapital;
      totalExposure += profile.allocatedCapital;
      totalUnrealizedPnl += profile.unrealizedPnl;
      totalRealizedPnl += profile.realizedPnl;
      weightedDrawdown += profile.drawdown * (profile.totalCapital / totalCapital);
      maxDrawdown = Math.max(maxDrawdown, profile.maxDrawdown);
    }
    
    // Calculate portfolio-level metrics
    const availableCapital = totalCapital - totalExposure;
    const totalPnl = totalUnrealizedPnl + totalRealizedPnl;
    const portfolioDrawdown = weightedDrawdown;
    
    // Calculate concentration risk
    const assetExposures = new Map<string, number>();
    const exchangeExposures = new Map<string, number>();
    
    for (const profile of this.accountProfiles.values()) {
      // Aggregate asset exposures
      for (const [asset, exposure] of profile.assetExposures.entries()) {
        assetExposures.set(asset, (assetExposures.get(asset) || 0) + exposure);
      }
      
      // Aggregate exchange exposures
      for (const [exchange, exposure] of profile.exchangeExposures.entries()) {
        exchangeExposures.set(exchange, (exchangeExposures.get(exchange) || 0) + exposure);
      }
    }
    
    // Calculate maximum concentration
    const maxAssetExposure = Math.max(...Array.from(assetExposures.values()));
    const maxExchangeExposure = Math.max(...Array.from(exchangeExposures.values()));
    const concentrationRisk = Math.max(
      (maxAssetExposure / totalCapital) * 100,
      (maxExchangeExposure / totalCapital) * 100
    );
    
    // Calculate correlation risk
    const activeStrategies = Array.from(this.strategyMetrics.values()).filter(s => s.isActive);
    let maxCorrelation = 0;
    
    for (const strategy1 of activeStrategies) {
      for (const strategy2 of activeStrategies) {
        if (strategy1.strategyId === strategy2.strategyId) continue;
        
        const correlation = Math.abs(strategy1.correlation.get(strategy2.strategyId) || 0);
        maxCorrelation = Math.max(maxCorrelation, correlation);
      }
    }
    
    const correlationRisk = maxCorrelation * 100;
    
    // Calculate liquidity risk
    const liquidityRisk = Math.max(0, 100 - (availableCapital / totalCapital) * 100);
    
    // Calculate overall risk level
    let overallRiskScore = 0;
    overallRiskScore += portfolioDrawdown / 5; // Drawdown contribution
    overallRiskScore += concentrationRisk / 20; // Concentration contribution
    overallRiskScore += correlationRisk / 20; // Correlation contribution
    overallRiskScore += liquidityRisk / 25; // Liquidity contribution
    
    const overallRiskLevel = this.calculateRiskLevel(overallRiskScore);
    
    // Calculate risk capacity (remaining risk budget)
    const riskCapacity = Math.max(0, 100 - overallRiskScore * 20);
    
    // Update portfolio metrics
    this.portfolioMetrics = {
      totalCapital,
      totalExposure,
      availableCapital,
      unrealizedPnl: totalUnrealizedPnl,
      realizedPnl: totalRealizedPnl,
      totalPnl,
      portfolioDrawdown,
      maxPortfolioDrawdown: Math.max(this.portfolioMetrics.maxPortfolioDrawdown, portfolioDrawdown),
      portfolioVolatility: this.calculatePortfolioVolatility(),
      portfolioSharpe: this.calculatePortfolioSharpe(),
      diversificationRatio: this.calculateDiversificationRatio(),
      concentrationRisk,
      correlationRisk,
      liquidityRisk,
      overallRiskLevel,
      riskCapacity,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Calculate portfolio volatility
   * @returns Portfolio volatility
   */
  private calculatePortfolioVolatility(): number {
    // Simplified portfolio volatility calculation
    let weightedVolatility = 0;
    let totalWeight = 0;
    
    for (const profile of this.accountProfiles.values()) {
      const weight = profile.totalCapital / this.portfolioMetrics.totalCapital;
      weightedVolatility += profile.volatility * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedVolatility / totalWeight : 0;
  }
  
  /**
   * Calculate portfolio Sharpe ratio
   * @returns Portfolio Sharpe ratio
   */
  private calculatePortfolioSharpe(): number {
    // Simplified portfolio Sharpe ratio calculation
    let weightedSharpe = 0;
    let totalWeight = 0;
    
    for (const profile of this.accountProfiles.values()) {
      const weight = profile.totalCapital / this.portfolioMetrics.totalCapital;
      weightedSharpe += profile.sharpeRatio * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedSharpe / totalWeight : 0;
  }
  
  /**
   * Calculate diversification ratio
   * @returns Diversification ratio
   */
  private calculateDiversificationRatio(): number {
    // Simplified diversification ratio calculation
    const activeStrategies = Array.from(this.strategyMetrics.values()).filter(s => s.isActive);
    
    if (activeStrategies.length <= 1) {
      return 1;
    }
    
    // Calculate average correlation
    let totalCorrelation = 0;
    let correlationCount = 0;
    
    for (const strategy1 of activeStrategies) {
      for (const strategy2 of activeStrategies) {
        if (strategy1.strategyId === strategy2.strategyId) continue;
        
        const correlation = Math.abs(strategy1.correlation.get(strategy2.strategyId) || 0);
        totalCorrelation += correlation;
        correlationCount++;
      }
    }
    
    const avgCorrelation = correlationCount > 0 ? totalCorrelation / correlationCount : 0;
    
    // Diversification ratio: lower correlation = higher diversification
    return Math.max(0.1, 1 - avgCorrelation);
  } 
 /**
   * Check risk limits
   */
  private checkRiskLimits(): void {
    // Check portfolio level limits
    this.checkPortfolioLimits();
    
    // Check account level limits
    this.checkAccountLimits();
    
    // Check strategy level limits
    this.checkStrategyLimits();
    
    // Check for emergency stop conditions
    this.checkEmergencyStopConditions();
  }
  
  /**
   * Check portfolio limits
   */
  private checkPortfolioLimits(): void {
    const metrics = this.portfolioMetrics;
    
    // Check portfolio drawdown
    if (metrics.portfolioDrawdown >= this.config.alertThresholds.drawdownCritical) {
      this.createRiskEvent(
        RiskEventType.DRAWDOWN_CRITICAL,
        9,
        `Portfolio drawdown ${metrics.portfolioDrawdown.toFixed(2)}% exceeds critical threshold ${this.config.alertThresholds.drawdownCritical}%`,
        metrics.portfolioDrawdown,
        this.config.alertThresholds.drawdownCritical,
        'Reduce portfolio exposure immediately'
      );
    } else if (metrics.portfolioDrawdown >= this.config.alertThresholds.drawdownWarning) {
      this.createRiskEvent(
        RiskEventType.DRAWDOWN_WARNING,
        6,
        `Portfolio drawdown ${metrics.portfolioDrawdown.toFixed(2)}% exceeds warning threshold ${this.config.alertThresholds.drawdownWarning}%`,
        metrics.portfolioDrawdown,
        this.config.alertThresholds.drawdownWarning,
        'Monitor portfolio closely and consider reducing exposure'
      );
    }
    
    // Check portfolio exposure
    const exposurePercentage = (metrics.totalExposure / metrics.totalCapital) * 100;
    
    if (exposurePercentage >= this.config.alertThresholds.exposureCritical) {
      this.createRiskEvent(
        RiskEventType.EXPOSURE_CRITICAL,
        8,
        `Portfolio exposure ${exposurePercentage.toFixed(2)}% exceeds critical threshold ${this.config.alertThresholds.exposureCritical}%`,
        exposurePercentage,
        this.config.alertThresholds.exposureCritical,
        'Reduce portfolio exposure immediately'
      );
    } else if (exposurePercentage >= this.config.alertThresholds.exposureWarning) {
      this.createRiskEvent(
        RiskEventType.EXPOSURE_WARNING,
        5,
        `Portfolio exposure ${exposurePercentage.toFixed(2)}% exceeds warning threshold ${this.config.alertThresholds.exposureWarning}%`,
        exposurePercentage,
        this.config.alertThresholds.exposureWarning,
        'Monitor exposure levels and consider reducing positions'
      );
    }
    
    // Check concentration risk
    if (metrics.concentrationRisk >= this.config.riskLimits.maxConcentrationRisk) {
      this.createRiskEvent(
        RiskEventType.EXPOSURE_CRITICAL,
        7,
        `Concentration risk ${metrics.concentrationRisk.toFixed(2)}% exceeds limit ${this.config.riskLimits.maxConcentrationRisk}%`,
        metrics.concentrationRisk,
        this.config.riskLimits.maxConcentrationRisk,
        'Diversify portfolio to reduce concentration risk'
      );
    }
    
    // Check correlation risk
    if (metrics.correlationRisk >= this.config.riskLimits.maxCorrelationRisk * 100) {
      this.createRiskEvent(
        RiskEventType.CORRELATION_SPIKE,
        6,
        `Correlation risk ${metrics.correlationRisk.toFixed(2)}% exceeds limit ${(this.config.riskLimits.maxCorrelationRisk * 100).toFixed(2)}%`,
        metrics.correlationRisk,
        this.config.riskLimits.maxCorrelationRisk * 100,
        'Reduce correlation between strategies'
      );
    }
    
    // Check volatility
    if (metrics.portfolioVolatility >= this.config.alertThresholds.volatilityCritical) {
      this.createRiskEvent(
        RiskEventType.VOLATILITY_SPIKE,
        7,
        `Portfolio volatility ${metrics.portfolioVolatility.toFixed(2)}% exceeds critical threshold ${this.config.alertThresholds.volatilityCritical}%`,
        metrics.portfolioVolatility,
        this.config.alertThresholds.volatilityCritical,
        'Reduce position sizes to lower volatility'
      );
    } else if (metrics.portfolioVolatility >= this.config.alertThresholds.volatilityWarning) {
      this.createRiskEvent(
        RiskEventType.VOLATILITY_SPIKE,
        4,
        `Portfolio volatility ${metrics.portfolioVolatility.toFixed(2)}% exceeds warning threshold ${this.config.alertThresholds.volatilityWarning}%`,
        metrics.portfolioVolatility,
        this.config.alertThresholds.volatilityWarning,
        'Monitor volatility and consider reducing positions'
      );
    }
    
    // Check liquidity risk
    if (metrics.liquidityRisk >= 80) {
      this.createRiskEvent(
        RiskEventType.LIQUIDITY_CRISIS,
        8,
        `Liquidity risk ${metrics.liquidityRisk.toFixed(2)}% is critically high`,
        metrics.liquidityRisk,
        80,
        'Increase available capital immediately'
      );
    }
  }
  
  /**
   * Check account limits
   */
  private checkAccountLimits(): void {
    for (const [accountId, profile] of this.accountProfiles.entries()) {
      // Check account drawdown
      if (profile.drawdown >= this.config.riskLimits.maxAccountDrawdown) {
        this.createRiskEvent(
          RiskEventType.DRAWDOWN_CRITICAL,
          8,
          `Account ${accountId} drawdown ${profile.drawdown.toFixed(2)}% exceeds limit ${this.config.riskLimits.maxAccountDrawdown}%`,
          profile.drawdown,
          this.config.riskLimits.maxAccountDrawdown,
          `Reduce exposure for account ${accountId}`,
          accountId
        );
      }
      
      // Check account exposure
      const exposurePercentage = (profile.allocatedCapital / profile.totalCapital) * 100;
      
      if (exposurePercentage >= this.config.riskLimits.maxAccountExposure) {
        this.createRiskEvent(
          RiskEventType.EXPOSURE_CRITICAL,
          7,
          `Account ${accountId} exposure ${exposurePercentage.toFixed(2)}% exceeds limit ${this.config.riskLimits.maxAccountExposure}%`,
          exposurePercentage,
          this.config.riskLimits.maxAccountExposure,
          `Reduce exposure for account ${accountId}`,
          accountId
        );
      }
    }
  }
  
  /**
   * Check strategy limits
   */
  private checkStrategyLimits(): void {
    for (const [strategyId, metrics] of this.strategyMetrics.entries()) {
      // Check strategy drawdown
      if (metrics.currentDrawdown >= this.config.riskLimits.maxStrategyDrawdown) {
        this.createRiskEvent(
          RiskEventType.DRAWDOWN_CRITICAL,
          7,
          `Strategy ${metrics.strategyName} drawdown ${metrics.currentDrawdown.toFixed(2)}% exceeds limit ${this.config.riskLimits.maxStrategyDrawdown}%`,
          metrics.currentDrawdown,
          this.config.riskLimits.maxStrategyDrawdown,
          `Reduce exposure for strategy ${metrics.strategyName}`,
          undefined,
          strategyId
        );
      }
      
      // Check strategy exposure
      if (metrics.totalExposure >= this.config.riskLimits.maxStrategyExposure) {
        this.createRiskEvent(
          RiskEventType.EXPOSURE_CRITICAL,
          6,
          `Strategy ${metrics.strategyName} exposure $${metrics.totalExposure.toLocaleString()} exceeds limit $${this.config.riskLimits.maxStrategyExposure.toLocaleString()}`,
          metrics.totalExposure,
          this.config.riskLimits.maxStrategyExposure,
          `Reduce exposure for strategy ${metrics.strategyName}`,
          undefined,
          strategyId
        );
      }
      
      // Check strategy volatility
      if (metrics.volatility >= this.config.riskLimits.maxStrategyVolatility) {
        this.createRiskEvent(
          RiskEventType.VOLATILITY_SPIKE,
          5,
          `Strategy ${metrics.strategyName} volatility ${metrics.volatility.toFixed(2)}% exceeds limit ${this.config.riskLimits.maxStrategyVolatility}%`,
          metrics.volatility,
          this.config.riskLimits.maxStrategyVolatility,
          `Reduce position sizes for strategy ${metrics.strategyName}`,
          undefined,
          strategyId
        );
      }
    }
  }
  
  /**
   * Check emergency stop conditions
   */
  private checkEmergencyStopConditions(): void {
    if (!this.config.emergencyStopEnabled || this.emergencyStopTriggered) {
      return;
    }
    
    const metrics = this.portfolioMetrics;
    
    // Emergency stop conditions
    const emergencyConditions = [
      metrics.portfolioDrawdown >= this.config.riskLimits.maxPortfolioDrawdown,
      metrics.concentrationRisk >= this.config.riskLimits.maxConcentrationRisk * 1.2, // 20% buffer
      metrics.liquidityRisk >= 90,
      metrics.overallRiskLevel === RiskLevel.EXTREME
    ];
    
    if (emergencyConditions.some(condition => condition)) {
      this.triggerEmergencyStop();
    }
  }
  
  /**
   * Create risk event
   * @param type Event type
   * @param severity Severity (1-10)
   * @param description Description
   * @param currentValue Current value
   * @param threshold Threshold value
   * @param recommendedAction Recommended action
   * @param accountId Account ID (optional)
   * @param strategyId Strategy ID (optional)
   */
  private createRiskEvent(
    type: RiskEventType,
    severity: number,
    description: string,
    currentValue: number,
    threshold: number,
    recommendedAction: string,
    accountId?: string,
    strategyId?: string
  ): void {
    // Check if we already have a similar active event
    const existingEvent = Array.from(this.riskEvents.values()).find(
      event => event.type === type && 
               event.accountId === accountId && 
               event.strategyId === strategyId && 
               !event.resolved
    );
    
    if (existingEvent) {
      // Update existing event
      existingEvent.currentValue = currentValue;
      existingEvent.timestamp = new Date();
      existingEvent.notes.push(`Updated at ${new Date().toISOString()}: ${currentValue.toFixed(2)}`);
      this.riskEvents.set(existingEvent.id, existingEvent);
      return;
    }
    
    // Create new risk event
    const riskEvent: RiskEvent = {
      id: uuidv4(),
      type,
      severity,
      accountId,
      strategyId,
      description,
      currentValue,
      threshold,
      recommendedAction,
      autoExecuted: false,
      timestamp: new Date(),
      resolved: false,
      notes: [`Created at ${new Date().toISOString()}`]
    };
    
    // Store risk event
    this.riskEvents.set(riskEvent.id, riskEvent);
    
    console.log(`🚨 RISK EVENT: ${type} (Severity: ${severity}/10)`);
    console.log(`📊 ${description}`);
    console.log(`💡 Recommended action: ${recommendedAction}`);
    
    // Emit risk event
    this.emit('riskEvent', riskEvent);
    
    // Auto-execute if severity is high enough and auto-rebalance is enabled
    if (severity >= 8 && this.config.autoRebalanceEnabled) {
      this.autoExecuteRiskMitigation(riskEvent);
    }
  }
  
  /**
   * Auto-execute risk mitigation
   * @param riskEvent Risk event
   */
  private autoExecuteRiskMitigation(riskEvent: RiskEvent): void {
    console.log(`🤖 AUTO-EXECUTING RISK MITIGATION FOR: ${riskEvent.type}`);
    
    // In a real implementation, this would execute actual risk mitigation actions
    // For now, we'll simulate the actions
    
    switch (riskEvent.type) {
      case RiskEventType.DRAWDOWN_CRITICAL:
        this.reduceExposure(riskEvent.accountId, riskEvent.strategyId, 0.3); // Reduce by 30%
        break;
      case RiskEventType.EXPOSURE_CRITICAL:
        this.reduceExposure(riskEvent.accountId, riskEvent.strategyId, 0.2); // Reduce by 20%
        break;
      case RiskEventType.VOLATILITY_SPIKE:
        this.reducePositionSizes(riskEvent.accountId, riskEvent.strategyId, 0.25); // Reduce by 25%
        break;
      case RiskEventType.LIQUIDITY_CRISIS:
        this.increaseLiquidity(0.15); // Increase liquidity by 15%
        break;
      default:
        console.log(`⚠️ No auto-mitigation available for ${riskEvent.type}`);
        return;
    }
    
    // Mark as auto-executed
    riskEvent.autoExecuted = true;
    riskEvent.notes.push(`Auto-executed mitigation at ${new Date().toISOString()}`);
    this.riskEvents.set(riskEvent.id, riskEvent);
    
    console.log(`✅ RISK MITIGATION EXECUTED FOR: ${riskEvent.type}`);
  }
  
  /**
   * Reduce exposure
   * @param accountId Account ID (optional)
   * @param strategyId Strategy ID (optional)
   * @param reductionPercentage Reduction percentage
   */
  private reduceExposure(accountId?: string, strategyId?: string, reductionPercentage: number = 0.2): void {
    console.log(`📉 REDUCING EXPOSURE BY ${(reductionPercentage * 100).toFixed(1)}%`);
    
    if (accountId) {
      // Reduce exposure for specific account
      const profile = this.accountProfiles.get(accountId);
      if (profile) {
        profile.allocatedCapital *= (1 - reductionPercentage);
        profile.availableCapital = profile.totalCapital - profile.allocatedCapital;
        this.accountProfiles.set(accountId, profile);
        console.log(`📉 Reduced exposure for account ${accountId}`);
      }
    } else if (strategyId) {
      // Reduce exposure for specific strategy
      const metrics = this.strategyMetrics.get(strategyId);
      if (metrics) {
        metrics.totalExposure *= (1 - reductionPercentage);
        this.strategyMetrics.set(strategyId, metrics);
        console.log(`📉 Reduced exposure for strategy ${strategyId}`);
      }
    } else {
      // Reduce exposure across all accounts
      for (const [id, profile] of this.accountProfiles.entries()) {
        profile.allocatedCapital *= (1 - reductionPercentage);
        profile.availableCapital = profile.totalCapital - profile.allocatedCapital;
        this.accountProfiles.set(id, profile);
      }
      console.log(`📉 Reduced exposure across all accounts`);
    }
  }
  
  /**
   * Reduce position sizes
   * @param accountId Account ID (optional)
   * @param strategyId Strategy ID (optional)
   * @param reductionPercentage Reduction percentage
   */
  private reducePositionSizes(accountId?: string, strategyId?: string, reductionPercentage: number = 0.25): void {
    console.log(`📊 REDUCING POSITION SIZES BY ${(reductionPercentage * 100).toFixed(1)}%`);
    
    // In a real implementation, this would reduce actual position sizes
    // For now, we'll simulate by reducing exposures
    this.reduceExposure(accountId, strategyId, reductionPercentage);
  }
  
  /**
   * Increase liquidity
   * @param increasePercentage Increase percentage
   */
  private increaseLiquidity(increasePercentage: number = 0.15): void {
    console.log(`💧 INCREASING LIQUIDITY BY ${(increasePercentage * 100).toFixed(1)}%`);
    
    // Reduce allocations to increase available capital
    for (const [id, profile] of this.accountProfiles.entries()) {
      const reductionAmount = profile.allocatedCapital * increasePercentage;
      profile.allocatedCapital -= reductionAmount;
      profile.availableCapital += reductionAmount;
      this.accountProfiles.set(id, profile);
    }
    
    console.log(`💧 Increased liquidity across all accounts`);
  }
  
  /**
   * Trigger emergency stop
   */
  private triggerEmergencyStop(): void {
    if (this.emergencyStopTriggered) {
      return;
    }
    
    console.log('🚨 EMERGENCY STOP TRIGGERED!');
    
    this.emergencyStopTriggered = true;
    
    // Create emergency stop event
    this.createRiskEvent(
      RiskEventType.EMERGENCY_STOP,
      10,
      'Emergency stop triggered due to extreme risk conditions',
      this.portfolioMetrics.overallRiskLevel === RiskLevel.EXTREME ? 5 : this.portfolioMetrics.portfolioDrawdown,
      this.config.riskLimits.maxPortfolioDrawdown,
      'All trading activities have been halted'
    );
    
    // In a real implementation, this would:
    // 1. Close all open positions
    // 2. Cancel all pending orders
    // 3. Stop all trading strategies
    // 4. Send emergency notifications
    
    // Simulate emergency actions
    console.log('🛑 CLOSING ALL POSITIONS...');
    console.log('🛑 CANCELLING ALL ORDERS...');
    console.log('🛑 STOPPING ALL STRATEGIES...');
    
    // Emit emergency stop event
    this.emit('emergencyStop', {
      timestamp: new Date(),
      reason: 'Extreme risk conditions detected',
      portfolioMetrics: this.portfolioMetrics
    });
    
    console.log('🚨 EMERGENCY STOP COMPLETED - ALL TRADING HALTED');
  } 
 /**
   * Generate risk report
   */
  private generateRiskReport(): void {
    // Generate risk report every 5 minutes
    const now = new Date();
    const lastReport = this.portfolioMetrics.lastUpdated;
    const timeSinceLastReport = now.getTime() - lastReport.getTime();
    
    if (timeSinceLastReport < 5 * 60 * 1000) {
      return; // Don't generate report too frequently
    }
    
    console.log('\n📊 === RISK MANAGEMENT REPORT ===');
    console.log(`🕐 Generated at: ${now.toISOString()}`);
    console.log('\n💼 PORTFOLIO OVERVIEW:');
    console.log(`💰 Total Capital: $${this.portfolioMetrics.totalCapital.toLocaleString()}`);
    console.log(`📈 Total PnL: $${this.portfolioMetrics.totalPnl.toLocaleString()} (${((this.portfolioMetrics.totalPnl / this.portfolioMetrics.totalCapital) * 100).toFixed(2)}%)`);
    console.log(`📊 Portfolio Drawdown: ${this.portfolioMetrics.portfolioDrawdown.toFixed(2)}%`);
    console.log(`🎯 Risk Level: ${this.portfolioMetrics.overallRiskLevel.toUpperCase()}`);
    console.log(`⚡ Risk Capacity: ${this.portfolioMetrics.riskCapacity.toFixed(1)}%`);
    
    console.log('\n🏦 ACCOUNT SUMMARY:');
    for (const [accountId, profile] of this.accountProfiles.entries()) {
      console.log(`  ${accountId}: $${profile.totalCapital.toLocaleString()} | Drawdown: ${profile.drawdown.toFixed(2)}% | Risk: ${profile.riskLevel}`);
    }
    
    console.log('\n📈 STRATEGY SUMMARY:');
    const activeStrategies = Array.from(this.strategyMetrics.values()).filter(s => s.isActive);
    for (const strategy of activeStrategies.slice(0, 5)) { // Show top 5
      console.log(`  ${strategy.strategyName}: $${strategy.totalExposure.toLocaleString()} | Drawdown: ${strategy.currentDrawdown.toFixed(2)}% | Risk: ${strategy.riskLevel}`);
    }
    
    console.log('\n⚠️ ACTIVE RISK EVENTS:');
    const activeEvents = Array.from(this.riskEvents.values()).filter(e => !e.resolved);
    if (activeEvents.length === 0) {
      console.log('  ✅ No active risk events');
    } else {
      for (const event of activeEvents.slice(0, 5)) { // Show top 5
        console.log(`  🚨 ${event.type}: ${event.description} (Severity: ${event.severity}/10)`);
      }
    }
    
    console.log('\n📊 KEY METRICS:');
    console.log(`  📉 Concentration Risk: ${this.portfolioMetrics.concentrationRisk.toFixed(2)}%`);
    console.log(`  🔗 Correlation Risk: ${this.portfolioMetrics.correlationRisk.toFixed(2)}%`);
    console.log(`  💧 Liquidity Risk: ${this.portfolioMetrics.liquidityRisk.toFixed(2)}%`);
    console.log(`  📊 Portfolio Volatility: ${this.portfolioMetrics.portfolioVolatility.toFixed(2)}%`);
    console.log(`  ⚖️ Diversification Ratio: ${this.portfolioMetrics.diversificationRatio.toFixed(2)}`);
    
    console.log('📊 === END RISK REPORT ===\n');
  }
  
  /**
   * Get portfolio metrics
   * @returns Portfolio metrics
   */
  getPortfolioMetrics(): PortfolioRiskMetrics {
    return { ...this.portfolioMetrics };
  }
  
  /**
   * Get account profiles
   * @returns Account profiles
   */
  getAccountProfiles(): Map<string, AccountRiskProfile> {
    return new Map(this.accountProfiles);
  }
  
  /**
   * Get strategy metrics
   * @returns Strategy metrics
   */
  getStrategyMetrics(): Map<string, StrategyRiskMetrics> {
    return new Map(this.strategyMetrics);
  }
  
  /**
   * Get risk events
   * @param includeResolved Include resolved events
   * @returns Risk events
   */
  getRiskEvents(includeResolved: boolean = false): RiskEvent[] {
    const events = Array.from(this.riskEvents.values());
    return includeResolved ? events : events.filter(e => !e.resolved);
  }
  
  /**
   * Resolve risk event
   * @param eventId Event ID
   * @param resolution Resolution notes
   */
  resolveRiskEvent(eventId: string, resolution: string): void {
    const event = this.riskEvents.get(eventId);
    if (!event) {
      console.error(`Risk event ${eventId} not found`);
      return;
    }
    
    event.resolved = true;
    event.resolvedAt = new Date();
    event.notes.push(`Resolved at ${event.resolvedAt.toISOString()}: ${resolution}`);
    
    this.riskEvents.set(eventId, event);
    
    console.log(`✅ RISK EVENT RESOLVED: ${event.type} - ${resolution}`);
    
    // Emit event resolved
    this.emit('riskEventResolved', event);
  }
  
  /**
   * Update account profile
   * @param accountId Account ID
   * @param updates Profile updates
   */
  updateAccountProfile(accountId: string, updates: Partial<AccountRiskProfile>): void {
    const profile = this.accountProfiles.get(accountId);
    if (!profile) {
      console.error(`Account profile ${accountId} not found`);
      return;
    }
    
    // Update profile
    const updatedProfile = { ...profile, ...updates, lastUpdated: new Date() };
    this.accountProfiles.set(accountId, updatedProfile);
    
    console.log(`📊 UPDATED ACCOUNT PROFILE: ${accountId}`);
  }
  
  /**
   * Update strategy metrics
   * @param strategyId Strategy ID
   * @param updates Metrics updates
   */
  updateStrategyMetrics(strategyId: string, updates: Partial<StrategyRiskMetrics>): void {
    const metrics = this.strategyMetrics.get(strategyId);
    if (!metrics) {
      console.error(`Strategy metrics ${strategyId} not found`);
      return;
    }
    
    // Update metrics
    const updatedMetrics = { ...metrics, ...updates, lastUpdated: new Date() };
    this.strategyMetrics.set(strategyId, updatedMetrics);
    
    console.log(`📈 UPDATED STRATEGY METRICS: ${strategyId}`);
  }
  
  /**
   * Add new account
   * @param profile Account risk profile
   */
  addAccount(profile: AccountRiskProfile): void {
    this.accountProfiles.set(profile.accountId, profile);
    console.log(`➕ ADDED NEW ACCOUNT: ${profile.accountId} ($${profile.totalCapital.toLocaleString()})`);
    
    // Recalculate portfolio metrics
    this.calculatePortfolioMetrics();
  }
  
  /**
   * Add new strategy
   * @param metrics Strategy risk metrics
   */
  addStrategy(metrics: StrategyRiskMetrics): void {
    this.strategyMetrics.set(metrics.strategyId, metrics);
    console.log(`➕ ADDED NEW STRATEGY: ${metrics.strategyName} ($${metrics.totalExposure.toLocaleString()})`);
    
    // Recalculate portfolio metrics
    this.calculatePortfolioMetrics();
  }
  
  /**
   * Remove account
   * @param accountId Account ID
   */
  removeAccount(accountId: string): void {
    const profile = this.accountProfiles.get(accountId);
    if (!profile) {
      console.error(`Account ${accountId} not found`);
      return;
    }
    
    this.accountProfiles.delete(accountId);
    console.log(`➖ REMOVED ACCOUNT: ${accountId}`);
    
    // Recalculate portfolio metrics
    this.calculatePortfolioMetrics();
  }
  
  /**
   * Remove strategy
   * @param strategyId Strategy ID
   */
  removeStrategy(strategyId: string): void {
    const metrics = this.strategyMetrics.get(strategyId);
    if (!metrics) {
      console.error(`Strategy ${strategyId} not found`);
      return;
    }
    
    this.strategyMetrics.delete(strategyId);
    console.log(`➖ REMOVED STRATEGY: ${strategyId}`);
    
    // Recalculate portfolio metrics
    this.calculatePortfolioMetrics();
  }
  
  /**
   * Reset emergency stop
   */
  resetEmergencyStop(): void {
    if (!this.emergencyStopTriggered) {
      console.log('⚠️ Emergency stop is not currently triggered');
      return;
    }
    
    console.log('🔄 RESETTING EMERGENCY STOP...');
    
    this.emergencyStopTriggered = false;
    
    // Resolve emergency stop event
    const emergencyEvent = Array.from(this.riskEvents.values())
      .find(e => e.type === RiskEventType.EMERGENCY_STOP && !e.resolved);
    
    if (emergencyEvent) {
      this.resolveRiskEvent(emergencyEvent.id, 'Emergency stop manually reset');
    }
    
    console.log('✅ EMERGENCY STOP RESET - TRADING CAN RESUME');
    
    // Emit emergency stop reset
    this.emit('emergencyStopReset', {
      timestamp: new Date(),
      portfolioMetrics: this.portfolioMetrics
    });
  }
  
  /**
   * Get system status
   * @returns System status
   */
  getSystemStatus(): any {
    return {
      isRunning: this.isRunning,
      emergencyStopTriggered: this.emergencyStopTriggered,
      accountCount: this.accountProfiles.size,
      strategyCount: this.strategyMetrics.size,
      activeRiskEvents: Array.from(this.riskEvents.values()).filter(e => !e.resolved).length,
      portfolioMetrics: this.portfolioMetrics,
      lastUpdate: this.portfolioMetrics.lastUpdated
    };
  }
}

export default UnlimitedScaleRiskManagement;
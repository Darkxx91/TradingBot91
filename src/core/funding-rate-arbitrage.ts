// FUNDING RATE ARBITRAGE ENGINE - ZERO DIRECTIONAL RISK PROFIT EXTRACTION
// Exploit funding rate differentials across perpetual swap exchanges for consistent profits

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import ExchangeManager from '../exchanges/exchange-manager';
import { TradeSignal } from '../types/core';

/**
 * Funding rate data
 */
export interface FundingRateData {
  exchange: string;
  symbol: string;
  rate: number; // Hourly funding rate as a decimal (e.g., 0.0001 = 0.01% per hour)
  timestamp: Date;
  annualizedRate: number; // Annualized rate as a decimal (e.g., 0.0876 = 8.76% per year)
  nextFundingTime: Date;
  previousRate: number | null;
  averageRate7d: number | null;
  averageRate30d: number | null;
}

/**
 * Funding rate arbitrage opportunity
 */
export interface FundingRateArbitrageOpportunity {
  id: string;
  longExchange: string;
  shortExchange: string;
  symbol: string;
  longRate: number;
  shortRate: number;
  netRate: number; // Net hourly rate
  annualizedNetRate: number; // Annualized net rate
  timestamp: Date;
  estimatedHourlyProfitPercent: number;
  estimatedDailyProfitPercent: number;
  estimatedMonthlyProfitPercent: number;
  estimatedAnnualProfitPercent: number;
  confidence: number; // 0-1
  status: 'pending' | 'active' | 'completed' | 'failed';
  notes: string[];
}

/**
 * Funding rate arbitrage position
 */
export interface FundingRateArbitragePosition {
  id: string;
  opportunityId: string;
  symbol: string;
  longExchange: string;
  shortExchange: string;
  longOrderId: string | null;
  shortOrderId: string | null;
  longEntryPrice: number | null;
  shortEntryPrice: number | null;
  positionSize: number; // In base currency
  positionValueUsd: number;
  entryTime: Date | null;
  exitTime: Date | null;
  netFundingCollected: number;
  netPnl: number | null;
  netPnlPercent: number | null;
  status: 'pending' | 'active' | 'closing' | 'completed' | 'failed';
  notes: string[];
}

/**
 * Funding rate arbitrage configuration
 */
export interface FundingRateArbitrageConfig {
  minNetHourlyRate: number; // Minimum net hourly funding rate to consider (e.g., 0.0001 = 0.01% per hour)
  minAnnualizedRate: number; // Minimum annualized rate to consider (e.g., 0.05 = 5% per year)
  maxPositionSizeUsd: number; // Maximum position size in USD
  maxTotalExposureUsd: number; // Maximum total exposure across all positions
  maxPositionsPerSymbol: number; // Maximum number of positions per symbol
  maxTotalPositions: number; // Maximum total positions
  minPositionSizeUsd: number; // Minimum position size in USD
  scanIntervalMs: number; // Scan interval in milliseconds
  rebalanceThresholdPercent: number; // Rebalance when price diverges by this percentage
  targetSymbols: string[]; // Symbols to monitor
  targetExchanges: string[]; // Exchanges to monitor
  slippageTolerancePercent: number; // Maximum allowed slippage
  emergencyCloseThresholdPercent: number; // Close positions if price diverges by this percentage
  minHistoricalDataHours: number; // Minimum hours of historical funding rate data required
  maxLeverageMultiplier: number; // Maximum leverage to use
  hedgeRatioTolerance: number; // Acceptable deviation from perfect hedge (e.g., 0.02 = 2%)
}

/**
 * Funding Rate Arbitrage Engine
 * 
 * REVOLUTIONARY INSIGHT: Perpetual swap exchanges pay or charge funding rates to balance
 * long and short positions. These rates often differ significantly between exchanges,
 * creating opportunities to go long on exchanges with positive funding rates and short
 * on exchanges with negative funding rates. This creates a delta-neutral position that
 * collects funding payments with zero directional risk. By systematically exploiting
 * these rate differentials across multiple exchanges and assets, we can generate
 * consistent profits regardless of market direction.
 */
export class FundingRateArbitrage extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private config: FundingRateArbitrageConfig;
  private fundingRates: Map<string, FundingRateData> = new Map(); // exchange:symbol -> data
  private opportunities: Map<string, FundingRateArbitrageOpportunity> = new Map();
  private activePositions: Map<string, FundingRateArbitragePosition> = new Map();
  private completedPositions: FundingRateArbitragePosition[] = [];
  private isRunning: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private accountBalance: number = 1000;
  private accountId: string = 'default';
  private historicalRates: Map<string, FundingRateData[]> = new Map(); // exchange:symbol -> historical data  
/**
   * Constructor
   * @param exchangeManager Exchange manager
   * @param config Configuration
   */
  constructor(
    exchangeManager: ExchangeManager,
    config?: Partial<FundingRateArbitrageConfig>
  ) {
    super();
    this.exchangeManager = exchangeManager;
    
    // Default configuration
    this.config = {
      minNetHourlyRate: 0.0001, // 0.01% per hour minimum (0.24% per day)
      minAnnualizedRate: 0.05, // 5% per year minimum
      maxPositionSizeUsd: 10000, // $10,000 maximum position size
      maxTotalExposureUsd: 50000, // $50,000 maximum total exposure
      maxPositionsPerSymbol: 3, // Maximum 3 positions per symbol
      maxTotalPositions: 10, // Maximum 10 total positions
      minPositionSizeUsd: 100, // $100 minimum position size
      scanIntervalMs: 5 * 60 * 1000, // 5 minutes
      rebalanceThresholdPercent: 1, // Rebalance when price diverges by 1%
      targetSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'],
      targetExchanges: ['binance', 'bybit', 'okx', 'deribit', 'kucoin', 'gate', 'huobi'],
      slippageTolerancePercent: 0.1, // 0.1% maximum slippage
      emergencyCloseThresholdPercent: 5, // Close positions if price diverges by 5%
      minHistoricalDataHours: 24, // Require at least 24 hours of historical data
      maxLeverageMultiplier: 3, // Maximum 3x leverage
      hedgeRatioTolerance: 0.02 // 2% tolerance for hedge ratio
    };
    
    // Override with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }
  
  /**
   * Start the funding rate arbitrage engine
   * @param accountId Account ID
   * @param accountBalance Account balance
   */
  async start(
    accountId: string = 'default',
    accountBalance: number = 1000
  ): Promise<void> {
    if (this.isRunning) {
      console.log('💰 Funding rate arbitrage engine already running');
      return;
    }
    
    console.log('🚀 STARTING FUNDING RATE ARBITRAGE ENGINE...');
    
    // Set account details
    this.accountId = accountId;
    this.accountBalance = accountBalance;
    
    // Initialize funding rate monitoring
    await this.initializeFundingRateMonitoring();
    
    // Start opportunity scanning
    this.startOpportunityScanning();
    
    // Start position management
    this.startPositionManagement();
    
    this.isRunning = true;
    console.log(`💰 FUNDING RATE ARBITRAGE ENGINE ACTIVE! Monitoring ${this.config.targetSymbols.length} symbols across ${this.config.targetExchanges.length} exchanges`);
  }
  
  /**
   * Stop the funding rate arbitrage engine
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('💰 Funding rate arbitrage engine already stopped');
      return;
    }
    
    console.log('🛑 STOPPING FUNDING RATE ARBITRAGE ENGINE...');
    
    // Clear scan interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    // Close all active positions
    await this.closeAllPositions();
    
    this.isRunning = false;
    console.log('💰 FUNDING RATE ARBITRAGE ENGINE STOPPED');
  }
  
  /**
   * Initialize funding rate monitoring
   */
  private async initializeFundingRateMonitoring(): Promise<void> {
    console.log('📊 INITIALIZING FUNDING RATE MONITORING...');
    
    // Subscribe to funding rate updates from exchange manager
    this.exchangeManager.on('fundingRateUpdate', (data) => {
      this.handleFundingRateUpdate(data);
    });
    
    // Fetch initial funding rates for all target exchanges and symbols
    for (const exchange of this.config.targetExchanges) {
      for (const symbol of this.config.targetSymbols) {
        try {
          const fundingRate = await this.exchangeManager.getFundingRate(exchange, symbol);
          if (fundingRate) {
            this.handleFundingRateUpdate(fundingRate);
          }
        } catch (error) {
          console.error(`Error fetching funding rate for ${exchange}:${symbol}:`, error);
        }
      }
    }
    
    // Fetch historical funding rates
    await this.fetchHistoricalFundingRates();
    
    console.log(`✅ INITIALIZED FUNDING RATE MONITORING FOR ${this.config.targetSymbols.length} SYMBOLS ACROSS ${this.config.targetExchanges.length} EXCHANGES`);
  }
  
  /**
   * Fetch historical funding rates
   */
  private async fetchHistoricalFundingRates(): Promise<void> {
    console.log('📈 FETCHING HISTORICAL FUNDING RATES...');
    
    for (const exchange of this.config.targetExchanges) {
      for (const symbol of this.config.targetSymbols) {
        try {
          const historicalRates = await this.exchangeManager.getHistoricalFundingRates(
            exchange,
            symbol,
            this.config.minHistoricalDataHours
          );
          
          if (historicalRates && historicalRates.length > 0) {
            this.historicalRates.set(`${exchange}:${symbol}`, historicalRates);
            
            // Calculate and update averages
            const currentRate = this.fundingRates.get(`${exchange}:${symbol}`);
            if (currentRate) {
              const last7d = this.calculateAverageRate(historicalRates, 7 * 24);
              const last30d = this.calculateAverageRate(historicalRates, 30 * 24);
              
              currentRate.averageRate7d = last7d;
              currentRate.averageRate30d = last30d;
              
              this.fundingRates.set(`${exchange}:${symbol}`, currentRate);
            }
          }
        } catch (error) {
          console.error(`Error fetching historical funding rates for ${exchange}:${symbol}:`, error);
        }
      }
    }
    
    console.log('✅ HISTORICAL FUNDING RATES FETCHED');
  }
  
  /**
   * Calculate average rate from historical data
   * @param rates Historical rates
   * @param hours Number of hours to look back
   * @returns Average rate
   */
  private calculateAverageRate(rates: FundingRateData[], hours: number): number | null {
    if (!rates || rates.length === 0) return null;
    
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    const relevantRates = rates.filter(r => r.timestamp >= cutoff);
    if (relevantRates.length === 0) return null;
    
    const sum = relevantRates.reduce((acc, r) => acc + r.rate, 0);
    return sum / relevantRates.length;
  }  /**
  
 * Handle funding rate update
   * @param data Funding rate data
   */
  private handleFundingRateUpdate(data: FundingRateData): void {
    const key = `${data.exchange}:${data.symbol}`;
    
    // Get existing data if available
    const existingData = this.fundingRates.get(key);
    
    // Update previous rate if we have existing data
    if (existingData) {
      data.previousRate = existingData.rate;
      
      // Preserve historical averages
      data.averageRate7d = existingData.averageRate7d;
      data.averageRate30d = existingData.averageRate30d;
    }
    
    // Store updated data
    this.fundingRates.set(key, data);
    
    // Emit event
    this.emit('fundingRateUpdate', data);
    
    // Check for new opportunities
    this.checkForOpportunities(data.symbol);
  }
  
  /**
   * Start opportunity scanning
   */
  private startOpportunityScanning(): void {
    console.log('🔍 STARTING OPPORTUNITY SCANNING...');
    
    // Scan immediately
    this.scanForOpportunities();
    
    // Set up interval for regular scanning
    this.scanInterval = setInterval(() => {
      this.scanForOpportunities();
    }, this.config.scanIntervalMs);
  }
  
  /**
   * Scan for opportunities
   */
  private scanForOpportunities(): void {
    console.log('🔍 SCANNING FOR FUNDING RATE ARBITRAGE OPPORTUNITIES...');
    
    // Scan each symbol
    for (const symbol of this.config.targetSymbols) {
      this.checkForOpportunities(symbol);
    }
  }
  
  /**
   * Check for opportunities for a specific symbol
   * @param symbol Symbol
   */
  private checkForOpportunities(symbol: string): void {
    // Get all funding rates for this symbol across exchanges
    const symbolRates: FundingRateData[] = [];
    
    for (const exchange of this.config.targetExchanges) {
      const key = `${exchange}:${symbol}`;
      const rate = this.fundingRates.get(key);
      
      if (rate) {
        symbolRates.push(rate);
      }
    }
    
    // Need at least 2 exchanges to create an arbitrage
    if (symbolRates.length < 2) {
      return;
    }
    
    // Sort by funding rate (ascending)
    symbolRates.sort((a, b) => a.rate - b.rate);
    
    // Check all possible pairs
    for (let i = 0; i < symbolRates.length; i++) {
      const shortRate = symbolRates[i]; // Lowest rate (most negative) for short
      
      for (let j = symbolRates.length - 1; j > i; j--) {
        const longRate = symbolRates[j]; // Highest rate for long
        
        // Calculate net rate (what we receive)
        const netRate = longRate.rate - shortRate.rate;
        const annualizedNetRate = netRate * 24 * 365; // Simple annualization
        
        // Check if net rate meets minimum threshold
        if (netRate >= this.config.minNetHourlyRate && annualizedNetRate >= this.config.minAnnualizedRate) {
          // We found an opportunity!
          this.createArbitrageOpportunity(longRate, shortRate, netRate, annualizedNetRate);
        }
      }
    }
  }
  
  /**
   * Create arbitrage opportunity
   * @param longRate Long exchange funding rate
   * @param shortRate Short exchange funding rate
   * @param netRate Net hourly rate
   * @param annualizedNetRate Annualized net rate
   */
  private createArbitrageOpportunity(
    longRate: FundingRateData,
    shortRate: FundingRateData,
    netRate: number,
    annualizedNetRate: number
  ): void {
    // Calculate estimated profits
    const hourlyProfitPercent = netRate * 100;
    const dailyProfitPercent = hourlyProfitPercent * 24;
    const monthlyProfitPercent = dailyProfitPercent * 30;
    const annualProfitPercent = annualizedNetRate * 100;
    
    // Calculate confidence based on historical consistency
    let confidence = 0.7; // Base confidence
    
    // Adjust confidence based on historical data
    if (longRate.averageRate7d !== null && shortRate.averageRate7d !== null) {
      const historicalNetRate = longRate.averageRate7d - shortRate.averageRate7d;
      if (historicalNetRate > 0 && historicalNetRate >= netRate * 0.8) {
        confidence += 0.1; // Boost confidence if historical data supports current opportunity
      } else if (historicalNetRate <= 0) {
        confidence -= 0.2; // Reduce confidence if historical data contradicts current opportunity
      }
    }
    
    // Create opportunity object
    const opportunity: FundingRateArbitrageOpportunity = {
      id: uuidv4(),
      longExchange: longRate.exchange,
      shortExchange: shortRate.exchange,
      symbol: longRate.symbol,
      longRate: longRate.rate,
      shortRate: shortRate.rate,
      netRate,
      annualizedNetRate,
      timestamp: new Date(),
      estimatedHourlyProfitPercent: hourlyProfitPercent,
      estimatedDailyProfitPercent: dailyProfitPercent,
      estimatedMonthlyProfitPercent: monthlyProfitPercent,
      estimatedAnnualProfitPercent: annualProfitPercent,
      confidence,
      status: 'pending',
      notes: [
        `Long ${longRate.exchange} at ${(longRate.rate * 100).toFixed(4)}% per hour`,
        `Short ${shortRate.exchange} at ${(shortRate.rate * 100).toFixed(4)}% per hour`,
        `Net rate: ${(netRate * 100).toFixed(4)}% per hour (${annualProfitPercent.toFixed(2)}% per year)`,
        `Estimated daily profit: ${dailyProfitPercent.toFixed(2)}%`
      ]
    };
    
    // Check if we already have this opportunity
    const existingOpportunity = Array.from(this.opportunities.values()).find(
      o => o.longExchange === opportunity.longExchange &&
           o.shortExchange === opportunity.shortExchange &&
           o.symbol === opportunity.symbol &&
           o.status === 'pending'
    );
    
    if (existingOpportunity) {
      // Update existing opportunity
      existingOpportunity.longRate = opportunity.longRate;
      existingOpportunity.shortRate = opportunity.shortRate;
      existingOpportunity.netRate = opportunity.netRate;
      existingOpportunity.annualizedNetRate = opportunity.annualizedNetRate;
      existingOpportunity.timestamp = opportunity.timestamp;
      existingOpportunity.estimatedHourlyProfitPercent = opportunity.estimatedHourlyProfitPercent;
      existingOpportunity.estimatedDailyProfitPercent = opportunity.estimatedDailyProfitPercent;
      existingOpportunity.estimatedMonthlyProfitPercent = opportunity.estimatedMonthlyProfitPercent;
      existingOpportunity.estimatedAnnualProfitPercent = opportunity.estimatedAnnualProfitPercent;
      existingOpportunity.confidence = opportunity.confidence;
      existingOpportunity.notes = opportunity.notes;
      
      this.opportunities.set(existingOpportunity.id, existingOpportunity);
    } else {
      // Store new opportunity
      this.opportunities.set(opportunity.id, opportunity);
      
      // Log new opportunity
      console.log(`💰 NEW FUNDING RATE ARBITRAGE OPPORTUNITY DETECTED:`);
      console.log(`   Long ${opportunity.longExchange} / Short ${opportunity.shortExchange} on ${opportunity.symbol}`);
      console.log(`   Net rate: ${(opportunity.netRate * 100).toFixed(4)}% per hour (${opportunity.estimatedAnnualProfitPercent.toFixed(2)}% per year)`);
      console.log(`   Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
      
      // Emit event
      this.emit('opportunityDetected', opportunity);
      
      // Evaluate opportunity for execution
      this.evaluateOpportunityForExecution(opportunity);
    }
  }  /**
 
  * Start position management
   */
  private startPositionManagement(): void {
    console.log('📊 STARTING POSITION MANAGEMENT...');
    
    // Set up interval for regular position checks
    setInterval(() => {
      this.checkActivePositions();
    }, 60 * 1000); // Check every minute
  }
  
  /**
   * Check active positions
   */
  private checkActivePositions(): void {
    if (this.activePositions.size === 0) {
      return;
    }
    
    console.log(`📊 CHECKING ${this.activePositions.size} ACTIVE POSITIONS...`);
    
    // Check each active position
    for (const position of this.activePositions.values()) {
      this.checkPositionBalance(position);
    }
  }
  
  /**
   * Check position balance
   * @param position Position to check
   */
  private async checkPositionBalance(position: FundingRateArbitragePosition): Promise<void> {
    if (position.status !== 'active') {
      return;
    }
    
    try {
      // Get current prices
      const longPrice = await this.exchangeManager.getPrice(position.longExchange, position.symbol);
      const shortPrice = await this.exchangeManager.getPrice(position.shortExchange, position.symbol);
      
      if (!longPrice || !shortPrice) {
        console.error(`Could not get prices for ${position.symbol} on ${position.longExchange} and ${position.shortExchange}`);
        return;
      }
      
      // Calculate price divergence
      const priceDivergence = Math.abs(longPrice - shortPrice) / ((longPrice + shortPrice) / 2);
      const priceDivergencePercent = priceDivergence * 100;
      
      // Check if rebalance is needed
      if (priceDivergencePercent > this.config.rebalanceThresholdPercent) {
        console.log(`⚠️ PRICE DIVERGENCE DETECTED: ${priceDivergencePercent.toFixed(2)}% between ${position.longExchange} and ${position.shortExchange} for ${position.symbol}`);
        await this.rebalancePosition(position, longPrice, shortPrice);
      }
      
      // Check if emergency close is needed
      if (priceDivergencePercent > this.config.emergencyCloseThresholdPercent) {
        console.log(`🚨 EMERGENCY CLOSE NEEDED: ${priceDivergencePercent.toFixed(2)}% price divergence exceeds threshold of ${this.config.emergencyCloseThresholdPercent}%`);
        await this.closePosition(position.id, 'Emergency close due to excessive price divergence');
      }
      
      // Update funding collected
      await this.updateFundingCollected(position);
    } catch (error) {
      console.error(`Error checking position balance for ${position.id}:`, error);
    }
  }
  
  /**
   * Rebalance position
   * @param position Position to rebalance
   * @param longPrice Current long price
   * @param shortPrice Current short price
   */
  private async rebalancePosition(
    position: FundingRateArbitragePosition,
    longPrice: number,
    shortPrice: number
  ): Promise<void> {
    console.log(`⚖️ REBALANCING POSITION ${position.id} FOR ${position.symbol}...`);
    
    try {
      // Calculate ideal position sizes based on current prices
      const idealLongSize = position.positionSize;
      const idealShortSize = position.positionSize * (longPrice / shortPrice);
      
      // Get current position sizes
      const longPosition = await this.exchangeManager.getPosition(position.longExchange, position.symbol);
      const shortPosition = await this.exchangeManager.getPosition(position.shortExchange, position.symbol);
      
      if (!longPosition || !shortPosition) {
        console.error(`Could not get positions for ${position.symbol} on ${position.longExchange} and ${position.shortExchange}`);
        return;
      }
      
      // Calculate adjustments needed
      const longAdjustment = idealLongSize - Math.abs(longPosition.size);
      const shortAdjustment = idealShortSize - Math.abs(shortPosition.size);
      
      // Adjust long position if needed
      if (Math.abs(longAdjustment) / idealLongSize > this.config.hedgeRatioTolerance) {
        if (longAdjustment > 0) {
          // Increase long position
          await this.exchangeManager.createOrder(
            position.longExchange,
            position.symbol,
            'market',
            'buy',
            longAdjustment
          );
          console.log(`📈 Increased long position on ${position.longExchange} by ${longAdjustment} ${position.symbol}`);
        } else {
          // Decrease long position
          await this.exchangeManager.createOrder(
            position.longExchange,
            position.symbol,
            'market',
            'sell',
            Math.abs(longAdjustment)
          );
          console.log(`📉 Decreased long position on ${position.longExchange} by ${Math.abs(longAdjustment)} ${position.symbol}`);
        }
      }
      
      // Adjust short position if needed
      if (Math.abs(shortAdjustment) / idealShortSize > this.config.hedgeRatioTolerance) {
        if (shortAdjustment > 0) {
          // Increase short position (sell more)
          await this.exchangeManager.createOrder(
            position.shortExchange,
            position.symbol,
            'market',
            'sell',
            shortAdjustment
          );
          console.log(`📉 Increased short position on ${position.shortExchange} by ${shortAdjustment} ${position.symbol}`);
        } else {
          // Decrease short position (buy back)
          await this.exchangeManager.createOrder(
            position.shortExchange,
            position.symbol,
            'market',
            'buy',
            Math.abs(shortAdjustment)
          );
          console.log(`📈 Decreased short position on ${position.shortExchange} by ${Math.abs(shortAdjustment)} ${position.symbol}`);
        }
      }
      
      console.log(`✅ POSITION ${position.id} REBALANCED SUCCESSFULLY`);
    } catch (error) {
      console.error(`Error rebalancing position ${position.id}:`, error);
    }
  }
  
  /**
   * Update funding collected
   * @param position Position to update
   */
  private async updateFundingCollected(position: FundingRateArbitragePosition): Promise<void> {
    try {
      // Get funding payment history
      const longFunding = await this.exchangeManager.getFundingPayments(position.longExchange, position.symbol);
      const shortFunding = await this.exchangeManager.getFundingPayments(position.shortExchange, position.symbol);
      
      if (!longFunding || !shortFunding) {
        return;
      }
      
      // Calculate total funding collected
      const longFundingTotal = longFunding.reduce((sum, payment) => {
        // Only count payments after position entry
        if (position.entryTime && payment.timestamp >= position.entryTime) {
          return sum + payment.amount;
        }
        return sum;
      }, 0);
      
      const shortFundingTotal = shortFunding.reduce((sum, payment) => {
        // Only count payments after position entry
        if (position.entryTime && payment.timestamp >= position.entryTime) {
          return sum + payment.amount;
        }
        return sum;
      }, 0);
      
      // Update position
      position.netFundingCollected = longFundingTotal + shortFundingTotal;
      
      // Calculate PnL if we have entry prices
      if (position.longEntryPrice !== null && position.shortEntryPrice !== null) {
        // Get current prices
        const longPrice = await this.exchangeManager.getPrice(position.longExchange, position.symbol);
        const shortPrice = await this.exchangeManager.getPrice(position.shortExchange, position.symbol);
        
        if (longPrice && shortPrice) {
          // Calculate PnL from price changes
          const longPnl = (longPrice - position.longEntryPrice) * position.positionSize;
          const shortPnl = (position.shortEntryPrice - shortPrice) * position.positionSize;
          
          // Total PnL including funding
          position.netPnl = longPnl + shortPnl + position.netFundingCollected;
          position.netPnlPercent = (position.netPnl / position.positionValueUsd) * 100;
          
          // Log significant PnL changes
          if (Math.abs(position.netPnlPercent) > 0.5) {
            console.log(`📊 POSITION ${position.id} PNL: ${position.netPnlPercent.toFixed(2)}% ($${position.netPnl.toFixed(2)})`);
          }
        }
      }
      
      // Update position in map
      this.activePositions.set(position.id, position);
    } catch (error) {
      console.error(`Error updating funding collected for position ${position.id}:`, error);
    }
  }  /
**
   * Evaluate opportunity for execution
   * @param opportunity Opportunity to evaluate
   */
  private evaluateOpportunityForExecution(opportunity: FundingRateArbitrageOpportunity): void {
    console.log(`🧮 EVALUATING OPPORTUNITY ${opportunity.id} FOR EXECUTION...`);
    
    // Check if we have enough balance
    if (this.accountBalance < this.config.minPositionSizeUsd) {
      console.log(`❌ INSUFFICIENT BALANCE: ${this.accountBalance} < ${this.config.minPositionSizeUsd}`);
      return;
    }
    
    // Check if we have reached maximum positions
    if (this.activePositions.size >= this.config.maxTotalPositions) {
      console.log(`❌ MAXIMUM POSITIONS REACHED: ${this.activePositions.size} >= ${this.config.maxTotalPositions}`);
      return;
    }
    
    // Check if we have reached maximum positions for this symbol
    const symbolPositions = Array.from(this.activePositions.values()).filter(
      p => p.symbol === opportunity.symbol
    );
    
    if (symbolPositions.length >= this.config.maxPositionsPerSymbol) {
      console.log(`❌ MAXIMUM POSITIONS FOR ${opportunity.symbol} REACHED: ${symbolPositions.length} >= ${this.config.maxPositionsPerSymbol}`);
      return;
    }
    
    // Check total exposure
    const totalExposure = Array.from(this.activePositions.values()).reduce(
      (sum, p) => sum + p.positionValueUsd,
      0
    );
    
    if (totalExposure >= this.config.maxTotalExposureUsd) {
      console.log(`❌ MAXIMUM EXPOSURE REACHED: ${totalExposure} >= ${this.config.maxTotalExposureUsd}`);
      return;
    }
    
    // Calculate position size
    const positionSizeUsd = Math.min(
      this.config.maxPositionSizeUsd,
      this.accountBalance * 0.1, // 10% of account balance
      this.config.maxTotalExposureUsd - totalExposure
    );
    
    // Ensure minimum position size
    if (positionSizeUsd < this.config.minPositionSizeUsd) {
      console.log(`❌ POSITION SIZE TOO SMALL: ${positionSizeUsd} < ${this.config.minPositionSizeUsd}`);
      return;
    }
    
    // Execute opportunity
    this.executeOpportunity(opportunity, positionSizeUsd);
  }
  
  /**
   * Execute opportunity
   * @param opportunity Opportunity to execute
   * @param positionSizeUsd Position size in USD
   */
  private async executeOpportunity(
    opportunity: FundingRateArbitrageOpportunity,
    positionSizeUsd: number
  ): Promise<void> {
    console.log(`🚀 EXECUTING OPPORTUNITY ${opportunity.id}...`);
    
    try {
      // Get current prices
      const longPrice = await this.exchangeManager.getPrice(opportunity.longExchange, opportunity.symbol);
      const shortPrice = await this.exchangeManager.getPrice(opportunity.shortExchange, opportunity.symbol);
      
      if (!longPrice || !shortPrice) {
        console.error(`Could not get prices for ${opportunity.symbol} on ${opportunity.longExchange} and ${opportunity.shortExchange}`);
        return;
      }
      
      // Calculate position sizes in base currency
      const longPositionSize = positionSizeUsd / longPrice;
      const shortPositionSize = positionSizeUsd / shortPrice;
      
      // Create position object
      const position: FundingRateArbitragePosition = {
        id: uuidv4(),
        opportunityId: opportunity.id,
        symbol: opportunity.symbol,
        longExchange: opportunity.longExchange,
        shortExchange: opportunity.shortExchange,
        longOrderId: null,
        shortOrderId: null,
        longEntryPrice: null,
        shortEntryPrice: null,
        positionSize: longPositionSize, // Base size for long position
        positionValueUsd: positionSizeUsd,
        entryTime: null,
        exitTime: null,
        netFundingCollected: 0,
        netPnl: null,
        netPnlPercent: null,
        status: 'pending',
        notes: [
          `Long ${opportunity.longExchange} at ${(opportunity.longRate * 100).toFixed(4)}% per hour`,
          `Short ${opportunity.shortExchange} at ${(opportunity.shortRate * 100).toFixed(4)}% per hour`,
          `Net rate: ${(opportunity.netRate * 100).toFixed(4)}% per hour (${opportunity.estimatedAnnualProfitPercent.toFixed(2)}% per year)`,
          `Position size: $${positionSizeUsd.toFixed(2)}`
        ]
      };
      
      // Store position
      this.activePositions.set(position.id, position);
      
      // Update opportunity status
      opportunity.status = 'active';
      this.opportunities.set(opportunity.id, opportunity);
      
      // Execute long order
      console.log(`📈 PLACING LONG ORDER ON ${position.longExchange} FOR ${longPositionSize} ${position.symbol}...`);
      const longOrder = await this.exchangeManager.createOrder(
        position.longExchange,
        position.symbol,
        'market',
        'buy',
        longPositionSize
      );
      
      if (!longOrder) {
        console.error(`Failed to place long order on ${position.longExchange}`);
        position.status = 'failed';
        position.notes.push(`Failed to place long order on ${position.longExchange}`);
        this.activePositions.set(position.id, position);
        return;
      }
      
      position.longOrderId = longOrder.id;
      position.longEntryPrice = longOrder.price;
      
      // Execute short order
      console.log(`📉 PLACING SHORT ORDER ON ${position.shortExchange} FOR ${shortPositionSize} ${position.symbol}...`);
      const shortOrder = await this.exchangeManager.createOrder(
        position.shortExchange,
        position.symbol,
        'market',
        'sell',
        shortPositionSize
      );
      
      if (!shortOrder) {
        console.error(`Failed to place short order on ${position.shortExchange}`);
        position.status = 'failed';
        position.notes.push(`Failed to place short order on ${position.shortExchange}`);
        
        // Try to close long position
        await this.exchangeManager.createOrder(
          position.longExchange,
          position.symbol,
          'market',
          'sell',
          longPositionSize
        );
        
        this.activePositions.set(position.id, position);
        return;
      }
      
      position.shortOrderId = shortOrder.id;
      position.shortEntryPrice = shortOrder.price;
      position.entryTime = new Date();
      position.status = 'active';
      position.notes.push(`Position opened successfully at ${position.entryTime.toISOString()}`);
      
      // Update position
      this.activePositions.set(position.id, position);
      
      console.log(`✅ POSITION ${position.id} OPENED SUCCESSFULLY:`);
      console.log(`   Long ${position.longPositionSize} ${position.symbol} on ${position.longExchange} at ${position.longEntryPrice}`);
      console.log(`   Short ${position.shortPositionSize} ${position.symbol} on ${position.shortExchange} at ${position.shortEntryPrice}`);
      console.log(`   Expected net funding: ${(opportunity.netRate * 100).toFixed(4)}% per hour (${opportunity.estimatedAnnualProfitPercent.toFixed(2)}% per year)`);
      
      // Emit event
      this.emit('positionOpened', position);
    } catch (error) {
      console.error(`Error executing opportunity ${opportunity.id}:`, error);
      
      // Update opportunity status
      opportunity.status = 'failed';
      opportunity.notes.push(`Execution failed: ${error.message}`);
      this.opportunities.set(opportunity.id, opportunity);
    }
  }
  
  /**
   * Close position
   * @param positionId Position ID
   * @param reason Reason for closing
   */
  private async closePosition(positionId: string, reason: string): Promise<void> {
    const position = this.activePositions.get(positionId);
    if (!position) {
      console.error(`Position ${positionId} not found`);
      return;
    }
    
    console.log(`🔒 CLOSING POSITION ${positionId}: ${reason}`);
    
    try {
      // Update position status
      position.status = 'closing';
      position.notes.push(`Closing position: ${reason}`);
      this.activePositions.set(positionId, position);
      
      // Close long position
      console.log(`📉 CLOSING LONG POSITION ON ${position.longExchange}...`);
      await this.exchangeManager.createOrder(
        position.longExchange,
        position.symbol,
        'market',
        'sell',
        position.positionSize
      );
      
      // Close short position
      console.log(`📈 CLOSING SHORT POSITION ON ${position.shortExchange}...`);
      await this.exchangeManager.createOrder(
        position.shortExchange,
        position.symbol,
        'market',
        'buy',
        position.positionSize
      );
      
      // Update position
      position.exitTime = new Date();
      position.status = 'completed';
      position.notes.push(`Position closed at ${position.exitTime.toISOString()}`);
      
      // Calculate final PnL
      await this.updateFundingCollected(position);
      
      // Move to completed positions
      this.completedPositions.push(position);
      this.activePositions.delete(positionId);
      
      console.log(`✅ POSITION ${positionId} CLOSED SUCCESSFULLY:`);
      console.log(`   Final PnL: ${position.netPnlPercent?.toFixed(2)}% ($${position.netPnl?.toFixed(2)})`);
      console.log(`   Funding collected: $${position.netFundingCollected.toFixed(2)}`);
      console.log(`   Duration: ${this.calculateDuration(position.entryTime!, position.exitTime!)}`);
      
      // Emit event
      this.emit('positionClosed', position);
    } catch (error) {
      console.error(`Error closing position ${positionId}:`, error);
      
      // Update position status
      position.status = 'failed';
      position.notes.push(`Failed to close position: ${error.message}`);
      this.activePositions.set(positionId, position);
    }
  }
  
  /**
   * Close all positions
   */
  private async closeAllPositions(): Promise<void> {
    console.log(`🔒 CLOSING ALL ${this.activePositions.size} ACTIVE POSITIONS...`);
    
    const positionIds = Array.from(this.activePositions.keys());
    
    for (const positionId of positionIds) {
      await this.closePosition(positionId, 'System shutdown');
    }
    
    console.log('✅ ALL POSITIONS CLOSED');
  }
  
  /**
   * Calculate duration between two dates
   * @param start Start date
   * @param end End date
   * @returns Duration string
   */
  private calculateDuration(start: Date, end: Date): string {
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours < 24) {
      return `${durationHours.toFixed(1)} hours`;
    } else {
      const durationDays = durationHours / 24;
      return `${durationDays.toFixed(1)} days`;
    }
  }
  
  /**
   * Get active positions
   * @returns Active positions
   */
  getActivePositions(): FundingRateArbitragePosition[] {
    return Array.from(this.activePositions.values());
  }
  
  /**
   * Get completed positions
   * @returns Completed positions
   */
  getCompletedPositions(): FundingRateArbitragePosition[] {
    return this.completedPositions;
  }
  
  /**
   * Get opportunities
   * @returns Opportunities
   */
  getOpportunities(): FundingRateArbitrageOpportunity[] {
    return Array.from(this.opportunities.values());
  }
  
  /**
   * Get funding rates
   * @returns Funding rates
   */
  getFundingRates(): FundingRateData[] {
    return Array.from(this.fundingRates.values());
  }
  
  /**
   * Get statistics
   * @returns Statistics
   */
  getStatistics(): any {
    // Calculate total PnL
    const totalPnl = this.completedPositions.reduce((sum, p) => sum + (p.netPnl || 0), 0);
    const totalPnlPercent = this.completedPositions.length > 0
      ? this.completedPositions.reduce((sum, p) => sum + (p.netPnlPercent || 0), 0) / this.completedPositions.length
      : 0;
    
    // Calculate success rate
    const successfulPositions = this.completedPositions.filter(p => (p.netPnl || 0) > 0);
    const successRate = this.completedPositions.length > 0
      ? successfulPositions.length / this.completedPositions.length
      : 0;
    
    // Calculate average duration
    const averageDurationMs = this.completedPositions.length > 0
      ? this.completedPositions.reduce((sum, p) => {
          if (p.entryTime && p.exitTime) {
            return sum + (p.exitTime.getTime() - p.entryTime.getTime());
          }
          return sum;
        }, 0) / this.completedPositions.length
      : 0;
    
    const averageDurationHours = averageDurationMs / (1000 * 60 * 60);
    
    return {
      activePositions: this.activePositions.size,
      completedPositions: this.completedPositions.length,
      totalPnl,
      totalPnlPercent,
      successRate,
      averageDurationHours,
      opportunities: this.opportunities.size,
      monitoredExchanges: this.config.targetExchanges.length,
      monitoredSymbols: this.config.targetSymbols.length
    };
  }
}

export default FundingRateArbitrage;
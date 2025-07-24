// ULTIMATE TRADING EMPIRE - BITCOIN MOVEMENT DETECTOR
// Detect significant Bitcoin movements for momentum transfer exploitation

import { EventEmitter } from 'events';
import ExchangeManager from '../exchanges/exchange-manager';
import { v4 as uuidv4 } from 'uuid';

export interface BitcoinMovement {
  id: string;
  magnitude: number; // % change
  direction: 'up' | 'down';
  startPrice: number;
  endPrice: number;
  duration: number; // milliseconds
  volume: number;
  volatility: number;
  confidence: number;
  startTime: Date;
  endTime: Date;
  detectedAt: Date;
}

// Define event types for TypeScript
declare interface BitcoinMovementDetector {
  on(event: 'movement', listener: (movement: BitcoinMovement) => void): this;
  on(event: 'significantMovement', listener: (movement: BitcoinMovement) => void): this;
  on(event: 'movementAnalysis', listener: (analysis: any) => void): this;
  emit(event: 'movement', movement: BitcoinMovement): boolean;
  emit(event: 'significantMovement', movement: BitcoinMovement): boolean;
  emit(event: 'movementAnalysis', analysis: any): boolean;
}

export class BitcoinMovementDetector extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private priceHistory: { price: number; timestamp: Date }[] = [];
  private movementThreshold: number = 1.0; // 1% minimum movement
  private significantThreshold: number = 3.0; // 3% significant movement
  private volatilityWindow: number = 3600000; // 1 hour for volatility calculation
  private historyWindow: number = 86400000; // 24 hours of price history
  private detectedMovements: BitcoinMovement[] = [];
  private isMonitoring: boolean = false;
  private btcSymbol: string = 'BTC/USDT';

  constructor(exchangeManager: ExchangeManager) {
    super();
    this.exchangeManager = exchangeManager;
  }

  /**
   * 🚀 START BITCOIN MOVEMENT MONITORING
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('📊 Bitcoin movement monitoring already active');
      return;
    }

    console.log('🚀 STARTING BITCOIN MOVEMENT DETECTION...');
    
    // Initialize price history
    await this.initializePriceHistory();
    
    // Start listening for price updates
    this.listenForPriceUpdates();
    
    // Start regular analysis
    this.startRegularAnalysis();
    
    this.isMonitoring = true;
    console.log('📊 BITCOIN MOVEMENT DETECTION ACTIVE!');
  }

  /**
   * 🏗️ INITIALIZE PRICE HISTORY
   */
  private async initializePriceHistory(): Promise<void> {
    try {
      console.log('🏗️ INITIALIZING BITCOIN PRICE HISTORY...');
      
      // In real implementation, would fetch historical data from exchange API
      // For now, simulating with recent prices
      
      const now = Date.now();
      const startPrice = 50000; // Example starting price
      
      // Generate simulated price history for last 24 hours
      for (let i = 0; i < 1440; i++) { // 1440 minutes in 24 hours
        const timeOffset = this.historyWindow - (i * 60000); // 60000ms = 1 minute
        const timestamp = new Date(now - timeOffset);
        
        // Generate slightly random price with overall trend
        const randomFactor = 1 + ((Math.random() - 0.5) * 0.002); // ±0.1% per minute
        const trendFactor = 1 + ((Math.sin(i / 180) * 0.05)); // Sinusoidal trend ±2.5%
        
        const price = startPrice * randomFactor * trendFactor;
        
        this.priceHistory.push({
          price,
          timestamp
        });
      }
      
      // Sort by timestamp (oldest first)
      this.priceHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      console.log(`✅ INITIALIZED PRICE HISTORY WITH ${this.priceHistory.length} DATA POINTS`);
      
    } catch (error) {
      console.error('Error initializing price history:', error);
    }
  }

  /**
   * 📡 LISTEN FOR PRICE UPDATES
   */
  private listenForPriceUpdates(): void {
    this.exchangeManager.on('priceUpdate', (priceUpdate) => {
      // Only process Bitcoin updates
      if (priceUpdate.symbol === this.btcSymbol) {
        this.processPriceUpdate(priceUpdate.price, priceUpdate.timestamp);
      }
    });
  }

  /**
   * 📊 PROCESS PRICE UPDATE
   */
  private processPriceUpdate(price: number, timestamp: Date): void {
    // Add to price history
    this.priceHistory.push({ price, timestamp });
    
    // Trim history to window size
    this.trimPriceHistory();
    
    // Check for significant movements
    this.checkForSignificantMovements();
  }

  /**
   * ✂️ TRIM PRICE HISTORY
   */
  private trimPriceHistory(): void {
    const cutoffTime = Date.now() - this.historyWindow;
    
    // Remove entries older than cutoff
    this.priceHistory = this.priceHistory.filter(entry => 
      entry.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * 🔍 CHECK FOR SIGNIFICANT MOVEMENTS
   */
  private checkForSignificantMovements(): void {
    // Need at least 2 data points
    if (this.priceHistory.length < 2) return;
    
    // Get latest price
    const latestEntry = this.priceHistory[this.priceHistory.length - 1];
    if (!latestEntry) return;
    
    const latestPrice = latestEntry.price;
    
    // Check for movements in different timeframes
    this.checkTimeframeMovement(5, latestPrice); // 5 minute movement
    this.checkTimeframeMovement(15, latestPrice); // 15 minute movement
    this.checkTimeframeMovement(60, latestPrice); // 1 hour movement
  }

  /**
   * 📏 CHECK TIMEFRAME MOVEMENT
   */
  private checkTimeframeMovement(minutes: number, latestPrice: number): void {
    const timeframeMs = minutes * 60000;
    const cutoffTime = Date.now() - timeframeMs;
    
    // Find price at start of timeframe
    const startEntry = this.priceHistory.find(entry => 
      entry.timestamp.getTime() >= cutoffTime
    );
    
    if (!startEntry) return;
    
    const startPrice = startEntry.price;
    
    // Calculate percentage change
    const percentChange = ((latestPrice - startPrice) / startPrice) * 100;
    const absChange = Math.abs(percentChange);
    
    // Check if movement exceeds threshold
    if (absChange >= this.movementThreshold) {
      const direction = percentChange >= 0 ? 'up' : 'down';
      
      // Calculate additional metrics
      const volume = this.calculateVolumeInTimeframe(timeframeMs);
      const volatility = this.calculateVolatility();
      
      // Create movement object
      const movement: BitcoinMovement = {
        id: uuidv4(),
        magnitude: absChange,
        direction,
        startPrice,
        endPrice: latestPrice,
        duration: timeframeMs,
        volume,
        volatility,
        confidence: this.calculateConfidence(absChange, volume, volatility),
        startTime: startEntry.timestamp,
        endTime: new Date(),
        detectedAt: new Date()
      };
      
      // Check if this is a significant movement
      if (absChange >= this.significantThreshold) {
        console.log(`🚨 SIGNIFICANT BITCOIN MOVEMENT DETECTED: ${direction.toUpperCase()} ${absChange.toFixed(2)}%`);
        console.log(`📊 Duration: ${minutes} minutes, Confidence: ${(movement.confidence * 100).toFixed(1)}%`);
        
        // Store movement
        this.detectedMovements.push(movement);
        
        // Emit significant movement event
        this.emit('significantMovement', movement);
      } else {
        console.log(`📈 Bitcoin ${direction} movement: ${absChange.toFixed(2)}% in ${minutes} minutes`);
        
        // Emit regular movement event
        this.emit('movement', movement);
      }
    }
  }

  /**
   * 📊 CALCULATE VOLUME IN TIMEFRAME
   */
  private calculateVolumeInTimeframe(timeframeMs: number): number {
    // In real implementation, would fetch actual volume data
    // For now, simulating volume based on price volatility
    
    const cutoffTime = Date.now() - timeframeMs;
    const relevantHistory = this.priceHistory.filter(entry => 
      entry.timestamp.getTime() >= cutoffTime
    );
    
    if (relevantHistory.length < 2) return 1000000; // Default $1M volume
    
    // Calculate price volatility in timeframe
    const prices = relevantHistory.map(entry => entry.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const volatility = (maxPrice - minPrice) / minPrice;
    
    // Simulate volume based on volatility
    const baseVolume = 1000000; // $1M base volume
    const volumeMultiplier = 1 + (volatility * 20); // Higher volatility = higher volume
    
    return baseVolume * volumeMultiplier;
  }

  /**
   * 📊 CALCULATE VOLATILITY
   */
  private calculateVolatility(): number {
    const cutoffTime = Date.now() - this.volatilityWindow;
    const relevantHistory = this.priceHistory.filter(entry => 
      entry.timestamp.getTime() >= cutoffTime
    );
    
    if (relevantHistory.length < 2) return 0.01; // Default 1% volatility
    
    // Calculate standard deviation of returns
    const returns: number[] = [];
    
    for (let i = 1; i < relevantHistory.length; i++) {
      const prevEntry = relevantHistory[i - 1];
      const currentEntry = relevantHistory[i];
      
      if (!prevEntry || !currentEntry) continue;
      
      const prevPrice = prevEntry.price;
      const currentPrice = currentEntry.price;
      const returnPct = (currentPrice - prevPrice) / prevPrice;
      returns.push(returnPct);
    }
    
    if (returns.length === 0) return 0.01; // Default if no returns calculated
    
    // Calculate mean
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // Calculate variance
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    // Standard deviation
    const stdDev = Math.sqrt(variance);
    
    // Annualized volatility (assuming 1-minute data)
    const annualizedVolatility = stdDev * Math.sqrt(525600); // 525600 minutes in a year
    
    return annualizedVolatility;
  }

  /**
   * 📊 CALCULATE CONFIDENCE
   */
  private calculateConfidence(magnitude: number, volume: number, volatility: number): number {
    // Base confidence on magnitude
    const magnitudeConfidence = Math.min(0.9, magnitude / 10); // 10% change = 0.9 confidence
    
    // Volume factor
    const volumeConfidence = Math.min(0.9, volume / 10000000); // $10M volume = 0.9 confidence
    
    // Volatility factor (inverse - higher volatility = lower confidence)
    const volatilityFactor = Math.max(0.1, 1 - (volatility * 10));
    
    // Combined confidence
    const confidence = (magnitudeConfidence * 0.5) + (volumeConfidence * 0.3) + (volatilityFactor * 0.2);
    
    return Math.min(0.95, confidence);
  }

  /**
   * 🔄 START REGULAR ANALYSIS
   */
  private startRegularAnalysis(): void {
    // Perform deeper analysis every minute
    global.setInterval(() => {
      this.analyzeRecentMovements();
    }, 60000); // Every minute
    
    // Clean up old movements
    global.setInterval(() => {
      this.cleanupOldMovements();
    }, 300000); // Every 5 minutes
  }

  /**
   * 📊 ANALYZE RECENT MOVEMENTS
   */
  private analyzeRecentMovements(): void {
    // Get movements from last hour
    const cutoffTime = Date.now() - 3600000; // 1 hour
    const recentMovements = this.detectedMovements.filter(m => 
      m.detectedAt.getTime() >= cutoffTime
    );
    
    if (recentMovements.length === 0) return;
    
    // Calculate average magnitude
    const avgMagnitude = recentMovements.reduce((sum, m) => sum + m.magnitude, 0) / recentMovements.length;
    
    // Calculate direction bias
    const upMovements = recentMovements.filter(m => m.direction === 'up');
    const directionBias = upMovements.length / recentMovements.length; // 0-1, higher = more up movements
    
    console.log(`📊 BITCOIN MOVEMENT ANALYSIS:`);
    console.log(`   Recent Movements: ${recentMovements.length}`);
    console.log(`   Average Magnitude: ${avgMagnitude.toFixed(2)}%`);
    console.log(`   Direction Bias: ${(directionBias * 100).toFixed(1)}% up`);
    
    // Emit analysis event
    this.emit('movementAnalysis', {
      recentMovements: recentMovements.length,
      averageMagnitude: avgMagnitude,
      directionBias,
      volatility: this.calculateVolatility(),
      timestamp: new Date()
    });
  }

  /**
   * 🧹 CLEANUP OLD MOVEMENTS
   */
  private cleanupOldMovements(): void {
    const cutoffTime = Date.now() - 86400000; // 24 hours
    
    this.detectedMovements = this.detectedMovements.filter(m => 
      m.detectedAt.getTime() >= cutoffTime
    );
  }

  /**
   * 📊 GET MOVEMENT STATISTICS
   */
  getMovementStats(): any {
    // Count movements by direction
    const upMovements = this.detectedMovements.filter(m => m.direction === 'up').length;
    const downMovements = this.detectedMovements.filter(m => m.direction === 'down').length;
    
    // Calculate average magnitude
    const avgMagnitude = this.detectedMovements.length > 0
      ? this.detectedMovements.reduce((sum, m) => sum + m.magnitude, 0) / this.detectedMovements.length
      : 0;
    
    // Get most recent significant movement
    const significantMovements = this.detectedMovements.filter(m => m.magnitude >= this.significantThreshold);
    const mostRecentSignificant = significantMovements.length > 0
      ? significantMovements.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())[0]
      : null;
    
    return {
      totalMovements: this.detectedMovements.length,
      upMovements,
      downMovements,
      averageMagnitude: avgMagnitude,
      currentVolatility: this.calculateVolatility(),
      movementThreshold: this.movementThreshold,
      significantThreshold: this.significantThreshold,
      isMonitoring: this.isMonitoring,
      priceHistoryPoints: this.priceHistory.length,
      mostRecentSignificant: mostRecentSignificant ? {
        direction: mostRecentSignificant.direction,
        magnitude: mostRecentSignificant.magnitude,
        detectedAt: mostRecentSignificant.detectedAt
      } : null
    };
  }

  /**
   * ⚙️ UPDATE CONFIGURATION
   */
  updateConfig(config: {
    movementThreshold?: number;
    significantThreshold?: number;
    btcSymbol?: string;
  }): void {
    if (config.movementThreshold !== undefined) {
      this.movementThreshold = config.movementThreshold;
      console.log(`⚙️ Updated movement threshold: ${this.movementThreshold}%`);
    }
    
    if (config.significantThreshold !== undefined) {
      this.significantThreshold = config.significantThreshold;
      console.log(`⚙️ Updated significant threshold: ${this.significantThreshold}%`);
    }
    
    if (config.btcSymbol) {
      this.btcSymbol = config.btcSymbol;
      console.log(`⚙️ Updated BTC symbol: ${this.btcSymbol}`);
    }
  }

  /**
   * 🛑 STOP MONITORING
   */
  stopMonitoring(): void {
    console.log('🛑 STOPPING BITCOIN MOVEMENT DETECTION...');
    
    this.isMonitoring = false;
    this.priceHistory = [];
    this.detectedMovements = [];
    
    console.log('🛑 BITCOIN MOVEMENT DETECTION STOPPED');
  }
}

export default BitcoinMovementDetector;
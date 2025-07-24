// ULTIMATE TRADING EMPIRE - CORRELATION ANALYZER
// Analyze correlations between Bitcoin and altcoins for momentum transfer exploitation

import { EventEmitter } from 'events';
import ExchangeManager from '../exchanges/exchange-manager';
import BitcoinMovementDetector, { BitcoinMovement } from './bitcoin-movement-detector';
import { v4 as uuidv4 } from 'uuid';

export interface AssetCorrelation {
  id: string;
  btcSymbol: string;
  altcoinSymbol: string;
  correlationCoefficient: number; // -1 to 1
  averageDelay: number; // milliseconds
  delayVariance: number;
  confidenceScore: number;
  sampleSize: number;
  updatedAt: Date;
}

export interface MomentumTransferOpportunity {
  id: string;
  bitcoinMovement: BitcoinMovement;
  altcoinSymbol: string;
  correlation: AssetCorrelation;
  expectedDelay: number; // milliseconds
  expectedMagnitude: number; // % change
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  optimalEntryTime: Date;
  optimalExitTime: Date;
  detectedAt: Date;
}

// Define event types for TypeScript
declare interface CorrelationAnalyzer {
  on(event: 'momentumTransferOpportunity', listener: (opportunity: MomentumTransferOpportunity) => void): this;
  on(event: 'correlationBreakdown', listener: (breakdown: any) => void): this;
  emit(event: 'momentumTransferOpportunity', opportunity: MomentumTransferOpportunity): boolean;
  emit(event: 'correlationBreakdown', breakdown: any): boolean;
}

export class CorrelationAnalyzer extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private bitcoinDetector: BitcoinMovementDetector;
  private correlations: Map<string, AssetCorrelation> = new Map();
  private priceHistory: Map<string, { price: number; timestamp: Date }[]> = new Map();
  private monitoredAltcoins: string[] = ['ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT', 'XRP/USDT'];
  private historyWindow: number = 604800000; // 7 days
  private minCorrelation: number = 0.5; // Minimum correlation to consider
  private minConfidence: number = 0.7; // Minimum confidence for opportunities
  private isMonitoring: boolean = false;

  constructor(exchangeManager: ExchangeManager, bitcoinDetector: BitcoinMovementDetector) {
    super();
    this.exchangeManager = exchangeManager;
    this.bitcoinDetector = bitcoinDetector;
  }

  /**
   * 🚀 START CORRELATION MONITORING
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('📊 Correlation monitoring already active');
      return;
    }

    console.log('🚀 STARTING CORRELATION ANALYSIS...');
    
    // Initialize price history for all assets
    await this.initializePriceHistory();
    
    // Start listening for price updates
    this.listenForPriceUpdates();
    
    // Listen for Bitcoin movements
    this.listenForBitcoinMovements();
    
    // Start regular correlation analysis
    this.startRegularAnalysis();
    
    this.isMonitoring = true;
    console.log('📊 CORRELATION ANALYSIS ACTIVE!');
  }

  /**
   * 🏗️ INITIALIZE PRICE HISTORY
   */
  private async initializePriceHistory(): Promise<void> {
    try {
      console.log('🏗️ INITIALIZING PRICE HISTORY FOR ALL ASSETS...');
      
      // Initialize Bitcoin price history
      this.priceHistory.set('BTC/USDT', []);
      
      // Initialize altcoin price histories
      for (const altcoin of this.monitoredAltcoins) {
        this.priceHistory.set(altcoin, []);
      }
      
      // In real implementation, would fetch historical data from exchange API
      // For now, simulating with recent prices
      
      const now = Date.now();
      
      // Generate simulated price history for last 7 days
      for (let i = 0; i < 10080; i++) { // 10080 minutes in 7 days
        const timeOffset = this.historyWindow - (i * 60000); // 60000ms = 1 minute
        const timestamp = new Date(now - timeOffset);
        
        // Generate Bitcoin price
        const btcBasePrice = 50000;
        const btcRandomFactor = 1 + ((Math.random() - 0.5) * 0.002); // ±0.1% per minute
        const btcTrendFactor = 1 + ((Math.sin(i / 1440) * 0.1)); // Sinusoidal trend ±5%
        const btcPrice = btcBasePrice * btcRandomFactor * btcTrendFactor;
        
        this.priceHistory.get('BTC/USDT')?.push({
          price: btcPrice,
          timestamp
        });
        
        // Generate altcoin prices with correlation to Bitcoin
        for (const altcoin of this.monitoredAltcoins) {
          let basePrice = 0;
          let correlationFactor = 0;
          
          // Set different base prices and correlation factors for each altcoin
          if (altcoin === 'ETH/USDT') {
            basePrice = 3000;
            correlationFactor = 0.9; // High correlation
          } else if (altcoin === 'BNB/USDT') {
            basePrice = 300;
            correlationFactor = 0.85;
          } else if (altcoin === 'SOL/USDT') {
            basePrice = 100;
            correlationFactor = 0.8;
          } else if (altcoin === 'ADA/USDT') {
            basePrice = 0.5;
            correlationFactor = 0.75;
          } else if (altcoin === 'XRP/USDT') {
            basePrice = 0.6;
            correlationFactor = 0.7;
          }
          
          // Calculate price with correlation to Bitcoin + random noise
          const randomFactor = 1 + ((Math.random() - 0.5) * 0.003); // ±0.15% random noise
          const btcCorrelation = 1 + ((btcTrendFactor - 1) * correlationFactor); // Correlated with BTC
          const delayedIndex = Math.max(0, i - Math.floor(Math.random() * 20)); // 0-20 minute delay
          const delayedBtcTrendFactor = 1 + ((Math.sin(delayedIndex / 1440) * 0.1));
          const delayedBtcCorrelation = 1 + ((delayedBtcTrendFactor - 1) * correlationFactor);
          
          const price = basePrice * randomFactor * delayedBtcCorrelation;
          
          this.priceHistory.get(altcoin)?.push({
            price,
            timestamp
          });
        }
      }
      
      // Sort all price histories by timestamp
      for (const [symbol, history] of this.priceHistory.entries()) {
        this.priceHistory.set(
          symbol,
          history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        );
      }
      
      console.log(`✅ INITIALIZED PRICE HISTORY FOR ${this.priceHistory.size} ASSETS`);
      
      // Calculate initial correlations
      await this.calculateAllCorrelations();
      
    } catch (error) {
      console.error('Error initializing price history:', error);
    }
  }

  /**
   * 📡 LISTEN FOR PRICE UPDATES
   */
  private listenForPriceUpdates(): void {
    this.exchangeManager.on('priceUpdate', (priceUpdate) => {
      // Check if this is a monitored asset
      if (priceUpdate.symbol === 'BTC/USDT' || this.monitoredAltcoins.includes(priceUpdate.symbol)) {
        this.processPriceUpdate(priceUpdate.symbol, priceUpdate.price, priceUpdate.timestamp);
      }
    });
  }

  /**
   * 📊 PROCESS PRICE UPDATE
   */
  private processPriceUpdate(symbol: string, price: number, timestamp: Date): void {
    // Get price history for this symbol
    const history = this.priceHistory.get(symbol);
    
    if (!history) {
      // Initialize if not exists
      this.priceHistory.set(symbol, [{ price, timestamp }]);
      return;
    }
    
    // Add to price history
    history.push({ price, timestamp });
    
    // Trim history to window size
    this.trimPriceHistory(symbol);
  }

  /**
   * ✂️ TRIM PRICE HISTORY
   */
  private trimPriceHistory(symbol: string): void {
    const history = this.priceHistory.get(symbol);
    if (!history) return;
    
    const cutoffTime = Date.now() - this.historyWindow;
    
    // Remove entries older than cutoff
    const trimmedHistory = history.filter(entry => 
      entry.timestamp.getTime() > cutoffTime
    );
    
    this.priceHistory.set(symbol, trimmedHistory);
  }

  /**
   * 📡 LISTEN FOR BITCOIN MOVEMENTS
   */
  private listenForBitcoinMovements(): void {
    this.bitcoinDetector.on('significantMovement', (movement: BitcoinMovement) => {
      console.log(`🔍 ANALYZING CORRELATION FOR BITCOIN ${movement.direction.toUpperCase()} MOVEMENT: ${movement.magnitude.toFixed(2)}%`);
      
      // Find momentum transfer opportunities
      this.findMomentumTransferOpportunities(movement);
    });
  }

  /**
   * 🔍 FIND MOMENTUM TRANSFER OPPORTUNITIES
   */
  private async findMomentumTransferOpportunities(btcMovement: BitcoinMovement): Promise<void> {
    // Check each altcoin for momentum transfer opportunity
    for (const altcoin of this.monitoredAltcoins) {
      const correlationKey = `BTC/USDT-${altcoin}`;
      const correlation = this.correlations.get(correlationKey);
      
      if (!correlation || correlation.correlationCoefficient < this.minCorrelation) {
        continue; // Skip if correlation is too low
      }
      
      // Get current price
      const prices = await this.exchangeManager.getExchangePrices(altcoin);
      const altcoinPrice = Array.from(prices.values())[0] || 0;
      
      if (altcoinPrice === 0) continue;
      
      // Calculate expected delay
      const expectedDelay = correlation.averageDelay;
      
      // Calculate expected magnitude
      const expectedMagnitude = btcMovement.magnitude * correlation.correlationCoefficient;
      
      // Calculate confidence
      const confidence = Math.min(0.95, 
        (btcMovement.confidence * 0.6) + 
        (correlation.confidenceScore * 0.4)
      );
      
      // Calculate target price
      const priceChangeDirection = btcMovement.direction === 'up' ? 1 : -1;
      const expectedPriceChange = altcoinPrice * (expectedMagnitude / 100) * priceChangeDirection;
      const targetPrice = altcoinPrice + expectedPriceChange;
      
      // Calculate optimal entry and exit times
      const optimalEntryTime = new Date(Date.now() + expectedDelay * 0.2); // Enter at 20% of delay
      const optimalExitTime = new Date(Date.now() + expectedDelay * 1.2); // Exit at 120% of delay
      
      // Create opportunity
      const opportunity: MomentumTransferOpportunity = {
        id: uuidv4(),
        bitcoinMovement: btcMovement,
        altcoinSymbol: altcoin,
        correlation,
        expectedDelay,
        expectedMagnitude,
        confidence,
        entryPrice: altcoinPrice,
        targetPrice,
        optimalEntryTime,
        optimalExitTime,
        detectedAt: new Date()
      };
      
      // Check if confidence meets minimum threshold
      if (confidence >= this.minConfidence) {
        console.log(`💰 MOMENTUM TRANSFER OPPORTUNITY DETECTED: ${altcoin}`);
        console.log(`📊 Expected ${btcMovement.direction} movement: ${expectedMagnitude.toFixed(2)}% in ${(expectedDelay / 60000).toFixed(1)} minutes`);
        console.log(`📈 Entry: $${altcoinPrice.toFixed(2)}, Target: $${targetPrice.toFixed(2)}`);
        console.log(`⏱️ Optimal Entry: ${optimalEntryTime.toLocaleTimeString()}, Exit: ${optimalExitTime.toLocaleTimeString()}`);
        
        // Emit opportunity event
        this.emit('momentumTransferOpportunity', opportunity);
      }
    }
  }

  /**
   * 🔄 START REGULAR ANALYSIS
   */
  private startRegularAnalysis(): void {
    // Recalculate correlations every hour
    global.setInterval(() => {
      this.calculateAllCorrelations();
    }, 3600000); // Every hour
    
    // Check for correlation breakdowns every 15 minutes
    global.setInterval(() => {
      this.checkForCorrelationBreakdowns();
    }, 900000); // Every 15 minutes
  }

  /**
   * 📊 CALCULATE ALL CORRELATIONS
   */
  private async calculateAllCorrelations(): Promise<void> {
    console.log('📊 CALCULATING ASSET CORRELATIONS...');
    
    for (const altcoin of this.monitoredAltcoins) {
      await this.calculateCorrelation('BTC/USDT', altcoin);
    }
    
    console.log(`✅ CALCULATED ${this.correlations.size} CORRELATIONS`);
  }

  /**
   * 📊 CALCULATE CORRELATION
   */
  private async calculateCorrelation(baseSymbol: string, quoteSymbol: string): Promise<void> {
    try {
      const baseHistory = this.priceHistory.get(baseSymbol);
      const quoteHistory = this.priceHistory.get(quoteSymbol);
      
      if (!baseHistory || !quoteHistory || baseHistory.length < 100 || quoteHistory.length < 100) {
        return; // Not enough data
      }
      
      // Calculate returns
      const baseReturns: number[] = [];
      const quoteReturns: number[] = [];
      
      for (let i = 1; i < baseHistory.length; i++) {
        const baseReturn = (baseHistory[i].price - baseHistory[i - 1].price) / baseHistory[i - 1].price;
        baseReturns.push(baseReturn);
      }
      
      for (let i = 1; i < quoteHistory.length; i++) {
        const quoteReturn = (quoteHistory[i].price - quoteHistory[i - 1].price) / quoteHistory[i - 1].price;
        quoteReturns.push(quoteReturn);
      }
      
      // Calculate correlation coefficient
      const correlationCoefficient = this.calculateCorrelationCoefficient(baseReturns, quoteReturns);
      
      // Calculate average delay
      const averageDelay = this.calculateAverageDelay(baseHistory, quoteHistory);
      
      // Calculate delay variance
      const delayVariance = this.calculateDelayVariance(baseHistory, quoteHistory, averageDelay);
      
      // Create correlation object
      const correlation: AssetCorrelation = {
        id: uuidv4(),
        btcSymbol: baseSymbol,
        altcoinSymbol: quoteSymbol,
        correlationCoefficient,
        averageDelay,
        delayVariance,
        confidenceScore: this.calculateConfidenceScore(correlationCoefficient, delayVariance),
        sampleSize: Math.min(baseHistory.length, quoteHistory.length),
        updatedAt: new Date()
      };
      
      // Store correlation
      const key = `${baseSymbol}-${quoteSymbol}`;
      this.correlations.set(key, correlation);
      
      console.log(`📊 ${quoteSymbol} Correlation: ${correlationCoefficient.toFixed(2)}, Delay: ${(averageDelay / 60000).toFixed(1)} minutes`);
      
    } catch (error) {
      console.error(`Error calculating correlation for ${baseSymbol}-${quoteSymbol}:`, error);
    }
  }

  /**
   * 📊 CALCULATE CORRELATION COEFFICIENT
   */
  private calculateCorrelationCoefficient(x: number[], y: number[]): number {
    // Use only the same number of data points
    const n = Math.min(x.length, y.length);
    
    // Trim arrays to same length
    const xTrimmed = x.slice(0, n);
    const yTrimmed = y.slice(0, n);
    
    // Calculate means
    const xMean = xTrimmed.reduce((sum, val) => sum + val, 0) / n;
    const yMean = yTrimmed.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate covariance and variances
    let covariance = 0;
    let xVariance = 0;
    let yVariance = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = xTrimmed[i] - xMean;
      const yDiff = yTrimmed[i] - yMean;
      
      covariance += xDiff * yDiff;
      xVariance += xDiff * xDiff;
      yVariance += yDiff * yDiff;
    }
    
    // Calculate correlation coefficient
    const denominator = Math.sqrt(xVariance * yVariance);
    
    return denominator === 0 ? 0 : covariance / denominator;
  }

  /**
   * ⏱️ CALCULATE AVERAGE DELAY
   */
  private calculateAverageDelay(baseHistory: { price: number; timestamp: Date }[], quoteHistory: { price: number; timestamp: Date }[]): number {
    // Find significant price movements in base asset
    const significantMovements: { startIndex: number; endIndex: number; magnitude: number }[] = [];
    
    for (let i = 20; i < baseHistory.length; i++) {
      const startPrice = baseHistory[i - 20].price;
      const endPrice = baseHistory[i].price;
      const percentChange = ((endPrice - startPrice) / startPrice) * 100;
      
      if (Math.abs(percentChange) >= 1.0) { // 1% or more movement
        significantMovements.push({
          startIndex: i - 20,
          endIndex: i,
          magnitude: percentChange
        });
      }
    }
    
    if (significantMovements.length === 0) {
      // Default to 5 minutes if no significant movements
      return 300000;
    }
    
    // Find corresponding movements in quote asset
    const delays: number[] = [];
    
    for (const movement of significantMovements) {
      const baseStartTime = baseHistory[movement.startIndex].timestamp.getTime();
      const baseEndTime = baseHistory[movement.endIndex].timestamp.getTime();
      const baseDuration = baseEndTime - baseStartTime;
      
      // Find closest quote asset price point to base start
      const baseStartPrice = baseHistory[movement.startIndex].price;
      const baseEndPrice = baseHistory[movement.endIndex].price;
      const baseDirection = baseEndPrice > baseStartPrice ? 'up' : 'down';
      
      // Find corresponding movement in quote asset
      let bestMatchIndex = -1;
      let bestMatchScore = 0;
      
      for (let i = 0; i < quoteHistory.length - 20; i++) {
        const quoteStartTime = quoteHistory[i].timestamp.getTime();
        
        // Only consider movements that start after the base movement starts
        if (quoteStartTime < baseStartTime) continue;
        
        // Only look up to 30 minutes after base movement
        if (quoteStartTime > baseStartTime + 1800000) break;
        
        // Check next 20 price points for similar movement
        const quoteStartPrice = quoteHistory[i].price;
        const quoteEndPrice = quoteHistory[Math.min(i + 20, quoteHistory.length - 1)].price;
        const quotePercentChange = ((quoteEndPrice - quoteStartPrice) / quoteStartPrice) * 100;
        const quoteDirection = quoteEndPrice > quoteStartPrice ? 'up' : 'down';
        
        // Calculate match score based on direction and magnitude similarity
        const directionMatch = quoteDirection === baseDirection ? 1 : -1;
        const magnitudeMatch = 1 - Math.abs(Math.abs(quotePercentChange) - Math.abs(movement.magnitude)) / Math.abs(movement.magnitude);
        const matchScore = directionMatch * magnitudeMatch;
        
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          bestMatchIndex = i;
        }
      }
      
      if (bestMatchIndex >= 0 && bestMatchScore > 0.5) {
        const quoteStartTime = quoteHistory[bestMatchIndex].timestamp.getTime();
        const delay = quoteStartTime - baseStartTime;
        delays.push(delay);
      }
    }
    
    if (delays.length === 0) {
      // Default to 5 minutes if no matching movements
      return 300000;
    }
    
    // Calculate average delay
    const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
    
    return Math.max(0, avgDelay); // Ensure non-negative
  }

  /**
   * 📊 CALCULATE DELAY VARIANCE
   */
  private calculateDelayVariance(baseHistory: { price: number; timestamp: Date }[], quoteHistory: { price: number; timestamp: Date }[], averageDelay: number): number {
    // Similar to average delay calculation, but calculate variance
    // For simplicity, return a default value
    return averageDelay * 0.2; // 20% of average delay
  }

  /**
   * 📊 CALCULATE CONFIDENCE SCORE
   */
  private calculateConfidenceScore(correlation: number, delayVariance: number): number {
    // Higher correlation and lower variance = higher confidence
    const correlationFactor = Math.abs(correlation);
    const varianceFactor = Math.max(0, 1 - (delayVariance / 600000)); // Lower variance = higher factor
    
    return Math.min(0.95, (correlationFactor * 0.7) + (varianceFactor * 0.3));
  }

  /**
   * 🔍 CHECK FOR CORRELATION BREAKDOWNS
   */
  private checkForCorrelationBreakdowns(): void {
    for (const [key, correlation] of this.correlations.entries()) {
      // Skip if correlation is too old
      if (Date.now() - correlation.updatedAt.getTime() > 86400000) continue;
      
      // Calculate recent correlation
      const [baseSymbol, quoteSymbol] = key.split('-');
      const baseHistory = this.priceHistory.get(baseSymbol);
      const quoteHistory = this.priceHistory.get(quoteSymbol);
      
      if (!baseHistory || !quoteHistory || baseHistory.length < 60 || quoteHistory.length < 60) {
        continue; // Not enough data
      }
      
      // Calculate returns for last hour
      const baseReturns: number[] = [];
      const quoteReturns: number[] = [];
      
      const cutoffTime = Date.now() - 3600000; // 1 hour
      
      const recentBaseHistory = baseHistory.filter(entry => entry.timestamp.getTime() >= cutoffTime);
      const recentQuoteHistory = quoteHistory.filter(entry => entry.timestamp.getTime() >= cutoffTime);
      
      if (recentBaseHistory.length < 30 || recentQuoteHistory.length < 30) {
        continue; // Not enough recent data
      }
      
      for (let i = 1; i < recentBaseHistory.length; i++) {
        const baseReturn = (recentBaseHistory[i].price - recentBaseHistory[i - 1].price) / recentBaseHistory[i - 1].price;
        baseReturns.push(baseReturn);
      }
      
      for (let i = 1; i < recentQuoteHistory.length; i++) {
        const quoteReturn = (recentQuoteHistory[i].price - recentQuoteHistory[i - 1].price) / recentQuoteHistory[i - 1].price;
        quoteReturns.push(quoteReturn);
      }
      
      // Calculate recent correlation
      const recentCorrelation = this.calculateCorrelationCoefficient(baseReturns, quoteReturns);
      
      // Check for correlation breakdown
      const correlationDifference = Math.abs(correlation.correlationCoefficient - recentCorrelation);
      
      if (correlationDifference >= 0.3) { // 30% correlation change
        console.log(`🚨 CORRELATION BREAKDOWN DETECTED: ${quoteSymbol}`);
        console.log(`📊 Historical: ${correlation.correlationCoefficient.toFixed(2)}, Recent: ${recentCorrelation.toFixed(2)}`);
        
        // Emit correlation breakdown event
        this.emit('correlationBreakdown', {
          baseSymbol,
          quoteSymbol,
          historicalCorrelation: correlation.correlationCoefficient,
          recentCorrelation,
          difference: correlationDifference,
          confidence: Math.min(0.9, correlationDifference * 2),
          detectedAt: new Date()
        });
      }
    }
  }

  /**
   * 📊 GET CORRELATION STATISTICS
   */
  getCorrelationStats(): any {
    const correlationArray = Array.from(this.correlations.values());
    
    // Calculate average correlation
    const avgCorrelation = correlationArray.length > 0
      ? correlationArray.reduce((sum, c) => sum + Math.abs(c.correlationCoefficient), 0) / correlationArray.length
      : 0;
    
    // Calculate average delay
    const avgDelay = correlationArray.length > 0
      ? correlationArray.reduce((sum, c) => sum + c.averageDelay, 0) / correlationArray.length
      : 0;
    
    return {
      totalCorrelations: correlationArray.length,
      averageCorrelation: avgCorrelation,
      averageDelayMinutes: avgDelay / 60000,
      minCorrelationThreshold: this.minCorrelation,
      minConfidenceThreshold: this.minConfidence,
      isMonitoring: this.isMonitoring,
      monitoredAltcoins: this.monitoredAltcoins,
      
      // Individual correlations
      correlations: correlationArray.map(c => ({
        pair: `${c.btcSymbol}-${c.altcoinSymbol}`,
        correlation: c.correlationCoefficient,
        delayMinutes: c.averageDelay / 60000,
        confidence: c.confidenceScore,
        updatedAt: c.updatedAt
      }))
    };
  }

  /**
   * ⚙️ UPDATE CONFIGURATION
   */
  updateConfig(config: {
    minCorrelation?: number;
    minConfidence?: number;
    monitoredAltcoins?: string[];
  }): void {
    if (config.minCorrelation !== undefined) {
      this.minCorrelation = config.minCorrelation;
      console.log(`⚙️ Updated minimum correlation: ${this.minCorrelation}`);
    }
    
    if (config.minConfidence !== undefined) {
      this.minConfidence = config.minConfidence;
      console.log(`⚙️ Updated minimum confidence: ${this.minConfidence}`);
    }
    
    if (config.monitoredAltcoins) {
      this.monitoredAltcoins = config.monitoredAltcoins;
      console.log(`⚙️ Updated monitored altcoins: ${this.monitoredAltcoins.join(', ')}`);
    }
  }

  /**
   * 🛑 STOP MONITORING
   */
  stopMonitoring(): void {
    console.log('🛑 STOPPING CORRELATION ANALYSIS...');
    
    this.isMonitoring = false;
    this.priceHistory.clear();
    this.correlations.clear();
    
    console.log('🛑 CORRELATION ANALYSIS STOPPED');
  }
}

export default CorrelationAnalyzer;
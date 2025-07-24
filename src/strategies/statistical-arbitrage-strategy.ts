// STATISTICAL ARBITRAGE STRATEGY
// Exploits temporary price divergences between correlated assets for high-probability profits

import { RealTimeMarketData } from '../core/real-time-market-data';
import PaperTradingMode from '../core/paper-trading-mode';

/**
 * Price correlation data
 */
interface CorrelationData {
  symbol1: string;
  symbol2: string;
  correlation: number;
  zscore: number;
  spread: number;
  meanSpread: number;
  spreadStd: number;
  confidence: number;
  lastUpdated: Date;
}

/**
 * Statistical arbitrage opportunity
 */
interface StatArbOpportunity {
  symbol1: string;
  symbol2: string;
  action1: 'buy' | 'sell';
  action2: 'buy' | 'sell';
  price1: number;
  price2: number;
  zscore: number;
  expectedReturn: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
}

/**
 * Statistical Arbitrage Strategy
 * 
 * REVOLUTIONARY INSIGHT: Highly correlated assets occasionally diverge from their
 * historical relationship due to temporary market inefficiencies. By identifying
 * these divergences using statistical measures (z-score), we can profit from the
 * inevitable mean reversion with high probability and controlled risk.
 */
export class StatisticalArbitrageStrategy {
  private marketData: RealTimeMarketData;
  private paperTrading: PaperTradingMode;
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private correlationData: Map<string, CorrelationData> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private activePositions: Map<string, StatArbOpportunity> = new Map();
  
  // Strategy parameters
  private entryThreshold: number = 2.0; // Z-score threshold for entry
  private exitThreshold: number = 0.5; // Z-score threshold for exit
  private maxPositionSize: number = 15; // Maximum position size as percentage of account
  private lookbackPeriod: number = 50; // Number of price points for correlation calculation
  
  // Asset pairs for statistical arbitrage
  private assetPairs: Array<[string, string]> = [
    ['BTC/USD', 'ETH/USD'], // Crypto majors
    ['ETH/USD', 'SOL/USD'], // Layer 1 blockchains
    ['BTC/USD', 'SOL/USD'], // Bitcoin vs alt
  ];
  
  /**
   * Constructor
   * @param paperTrading Paper trading service
   * @param marketData Market data service (optional)
   */
  constructor(paperTrading: PaperTradingMode, marketData?: RealTimeMarketData) {
    this.paperTrading = paperTrading;
    this.marketData = marketData || new RealTimeMarketData();
    
    // Initialize price history for each symbol
    const allSymbols = new Set<string>();
    this.assetPairs.forEach(([s1, s2]) => {
      allSymbols.add(s1);
      allSymbols.add(s2);
    });
    
    allSymbols.forEach(symbol => {
      this.priceHistory.set(symbol, []);
    });
  }
  
  /**
   * Start the strategy
   */
  start(): void {
    if (this.isRunning) {
      console.log('📊 Statistical arbitrage strategy already running');
      return;
    }
    
    console.log('🚀 STARTING STATISTICAL ARBITRAGE STRATEGY...');
    this.isRunning = true;
    
    // Check for opportunities every 2 minutes
    this.checkInterval = setInterval(() => this.checkForOpportunities(), 2 * 60 * 1000);
    
    // Run initial check
    this.checkForOpportunities();
    
    console.log('📊 Statistical arbitrage strategy started');
  }
  
  /**
   * Stop the strategy
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('📊 Statistical arbitrage strategy already stopped');
      return;
    }
    
    console.log('🛑 Stopping statistical arbitrage strategy...');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.isRunning = false;
    console.log('📊 Statistical arbitrage strategy stopped');
  }
  
  /**
   * Check for arbitrage opportunities
   */
  async checkForOpportunities(): Promise<void> {
    console.log('🔍 Checking for statistical arbitrage opportunities...');
    
    try {
      // Update price history
      await this.updatePriceHistory();
      
      // Calculate correlations and z-scores
      this.calculateCorrelations();
      
      // Find arbitrage opportunities
      const opportunities = this.findStatArbOpportunities();
      
      // Execute opportunities
      for (const opportunity of opportunities) {
        await this.executeStatArb(opportunity);
      }
      
      // Check for exit conditions on existing positions
      await this.checkExitConditions();
      
      console.log(`✅ Found ${opportunities.length} statistical arbitrage opportunities`);
      
    } catch (error) {
      console.error('❌ Error checking for statistical arbitrage opportunities:', error);
    }
  }
  
  /**
   * Update price history
   */
  private async updatePriceHistory(): Promise<void> {
    for (const [symbol, history] of this.priceHistory.entries()) {
      try {
        const marketData = await this.marketData.getCurrentPrice(symbol);
        
        // Add new price to history
        history.push(marketData.price);
        
        // Keep only the last lookback period prices
        if (history.length > this.lookbackPeriod) {
          history.shift();
        }
        
      } catch (error) {
        console.error(`Error updating price history for ${symbol}:`, error);
      }
    }
  }
  
  /**
   * Calculate correlations and z-scores
   */
  private calculateCorrelations(): void {
    for (const [symbol1, symbol2] of this.assetPairs) {
      const prices1 = this.priceHistory.get(symbol1) || [];
      const prices2 = this.priceHistory.get(symbol2) || [];
      
      // Need at least 20 data points for reliable statistics
      if (prices1.length < 20 || prices2.length < 20) {
        continue;
      }
      
      // Calculate correlation
      const correlation = this.calculateCorrelation(prices1, prices2);
      
      // Calculate spread (ratio of prices)
      const currentSpread = prices1[prices1.length - 1] / prices2[prices2.length - 1];
      
      // Calculate historical spread statistics
      const spreads = prices1.map((p1, i) => p1 / prices2[i]);
      const meanSpread = spreads.reduce((sum, s) => sum + s, 0) / spreads.length;
      const spreadVariance = spreads.reduce((sum, s) => sum + Math.pow(s - meanSpread, 2), 0) / spreads.length;
      const spreadStd = Math.sqrt(spreadVariance);
      
      // Calculate z-score
      const zscore = (currentSpread - meanSpread) / spreadStd;
      
      // Calculate confidence based on correlation strength and data points
      const confidence = Math.min(0.95, Math.abs(correlation) * (prices1.length / this.lookbackPeriod));
      
      // Store correlation data
      const pairKey = `${symbol1}_${symbol2}`;
      this.correlationData.set(pairKey, {
        symbol1,
        symbol2,
        correlation,
        zscore,
        spread: currentSpread,
        meanSpread,
        spreadStd,
        confidence,
        lastUpdated: new Date()
      });
    }
  }
  
  /**
   * Calculate correlation coefficient
   * @param x First price series
   * @param y Second price series
   * @returns Correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    
    if (n < 2) return 0;
    
    const meanX = x.slice(-n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.slice(-n).reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[x.length - n + i] - meanX;
      const yDiff = y[y.length - n + i] - meanY;
      
      numerator += xDiff * yDiff;
      sumXSquared += xDiff * xDiff;
      sumYSquared += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  /**
   * Find statistical arbitrage opportunities
   * @returns Statistical arbitrage opportunities
   */
  private findStatArbOpportunities(): StatArbOpportunity[] {
    const opportunities: StatArbOpportunity[] = [];
    
    for (const [pairKey, data] of this.correlationData.entries()) {
      const { symbol1, symbol2, zscore, correlation, confidence } = data;
      
      // Skip if correlation is too weak or confidence is too low
      if (Math.abs(correlation) < 0.7 || confidence < 0.6) {
        continue;
      }
      
      // Skip if already have position for this pair
      if (this.activePositions.has(pairKey)) {
        continue;
      }
      
      // Check for entry signal
      if (Math.abs(zscore) > this.entryThreshold) {
        const prices1 = this.priceHistory.get(symbol1) || [];
        const prices2 = this.priceHistory.get(symbol2) || [];
        
        if (prices1.length === 0 || prices2.length === 0) continue;
        
        const price1 = prices1[prices1.length - 1];
        const price2 = prices2[prices2.length - 1];
        
        // Determine trade direction based on z-score
        let action1: 'buy' | 'sell';
        let action2: 'buy' | 'sell';
        
        if (zscore > this.entryThreshold) {
          // Symbol1 is overpriced relative to symbol2
          action1 = 'sell'; // Short the overpriced asset
          action2 = 'buy';  // Long the underpriced asset
        } else {
          // Symbol1 is underpriced relative to symbol2
          action1 = 'buy';  // Long the underpriced asset
          action2 = 'sell'; // Short the overpriced asset
        }
        
        // Calculate expected return based on z-score magnitude
        const expectedReturn = Math.abs(zscore) * 2.5; // Rough estimate
        
        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high';
        if (Math.abs(zscore) > 3.0) riskLevel = 'high';
        else if (Math.abs(zscore) > 2.5) riskLevel = 'medium';
        else riskLevel = 'low';
        
        const opportunity: StatArbOpportunity = {
          symbol1,
          symbol2,
          action1,
          action2,
          price1,
          price2,
          zscore,
          expectedReturn,
          confidence,
          riskLevel,
          timeframe: '1-7 days'
        };
        
        opportunities.push(opportunity);
      }
    }
    
    return opportunities;
  }
  
  /**
   * Execute statistical arbitrage
   * @param opportunity Statistical arbitrage opportunity
   */
  private async executeStatArb(opportunity: StatArbOpportunity): Promise<void> {
    const { symbol1, symbol2, action1, action2, price1, price2, zscore, expectedReturn, confidence, riskLevel } = opportunity;
    
    console.log(`\\n📊 EXECUTING STATISTICAL ARBITRAGE:`);\n    console.log(`Pair: ${symbol1} / ${symbol2}`);\n    console.log(`Z-Score: ${zscore.toFixed(3)}`);\n    console.log(`Correlation Confidence: ${(confidence * 100).toFixed(1)}%`);\n    console.log(`Expected Return: ${expectedReturn.toFixed(2)}%`);\n    console.log(`Risk Level: ${riskLevel.toUpperCase()}`);\n    console.log(`Action: ${action1.toUpperCase()} ${symbol1} @ $${price1.toFixed(2)}, ${action2.toUpperCase()} ${symbol2} @ $${price2.toFixed(2)}`);\n    \n    try {\n      // Get account balance\n      const account = this.paperTrading.getAccount();\n      \n      // Calculate position size based on risk level\n      let positionSizePercent = this.maxPositionSize;\n      if (riskLevel === 'high') positionSizePercent *= 0.6;\n      else if (riskLevel === 'medium') positionSizePercent *= 0.8;\n      \n      const positionSize = (positionSizePercent / 100) * account.balance * 0.5; // 50% for each leg\n      \n      // Calculate quantities\n      const quantity1 = positionSize / price1;\n      const quantity2 = positionSize / price2;\n      \n      // Execute first leg\n      if (action1 === 'buy') {\n        console.log(`🔵 BUYING ${symbol1}: ${quantity1.toFixed(6)} @ $${price1.toFixed(2)}`);\n        await this.paperTrading.buy(symbol1, quantity1, price1, 'statistical_arbitrage');\n      } else {\n        console.log(`🔴 SELLING ${symbol1}: ${quantity1.toFixed(6)} @ $${price1.toFixed(2)}`);\n        await this.paperTrading.sell(symbol1, quantity1, price1, 'statistical_arbitrage');\n      }\n      \n      // Execute second leg\n      if (action2 === 'buy') {\n        console.log(`🔵 BUYING ${symbol2}: ${quantity2.toFixed(6)} @ $${price2.toFixed(2)}`);\n        await this.paperTrading.buy(symbol2, quantity2, price2, 'statistical_arbitrage');\n      } else {\n        console.log(`🔴 SELLING ${symbol2}: ${quantity2.toFixed(6)} @ $${price2.toFixed(2)}`);\n        await this.paperTrading.sell(symbol2, quantity2, price2, 'statistical_arbitrage');\n      }\n      \n      // Store active position\n      const pairKey = `${symbol1}_${symbol2}`;\n      this.activePositions.set(pairKey, opportunity);\n      \n      console.log(`✅ Statistical arbitrage executed successfully`);\n      \n    } catch (error) {\n      console.error(`❌ Error executing statistical arbitrage:`, error);\n    }\n  }\n  \n  /**\n   * Check exit conditions for active positions\n   */\n  private async checkExitConditions(): Promise<void> {\n    for (const [pairKey, position] of this.activePositions.entries()) {\n      const correlationData = this.correlationData.get(pairKey);\n      \n      if (!correlationData) continue;\n      \n      // Check if z-score has reverted to mean\n      if (Math.abs(correlationData.zscore) < this.exitThreshold) {\n        console.log(`\\n🔄 CLOSING STATISTICAL ARBITRAGE POSITION:`);\n        console.log(`Pair: ${position.symbol1} / ${position.symbol2}`);\n        console.log(`Entry Z-Score: ${position.zscore.toFixed(3)}`);\n        console.log(`Current Z-Score: ${correlationData.zscore.toFixed(3)}`);\n        console.log(`Mean reversion achieved!`);\n        \n        // Close positions (reverse the original trades)\n        await this.closeStatArbPosition(pairKey, position);\n      }\n    }\n  }\n  \n  /**\n   * Close statistical arbitrage position\n   * @param pairKey Pair key\n   * @param position Position to close\n   */\n  private async closeStatArbPosition(pairKey: string, position: StatArbOpportunity): Promise<void> {\n    try {\n      // Find and close positions\n      const positions = this.paperTrading.getPositions();\n      \n      for (const pos of positions) {\n        if (pos.symbol === position.symbol1 || pos.symbol === position.symbol2) {\n          await this.paperTrading.closePosition(pos.id);\n        }\n      }\n      \n      // Remove from active positions\n      this.activePositions.delete(pairKey);\n      \n      console.log(`✅ Statistical arbitrage position closed`);\n      \n    } catch (error) {\n      console.error(`❌ Error closing statistical arbitrage position:`, error);\n    }\n  }\n  \n  /**\n   * Get active positions\n   * @returns Active positions\n   */\n  getActivePositions(): StatArbOpportunity[] {\n    return Array.from(this.activePositions.values());\n  }\n  \n  /**\n   * Get correlation data\n   * @returns Correlation data\n   */\n  getCorrelationData(): CorrelationData[] {\n    return Array.from(this.correlationData.values());\n  }\n  \n  /**\n   * Get strategy status\n   * @returns Strategy status\n   */\n  getStatus(): {\n    isRunning: boolean;\n    activePositions: number;\n    entryThreshold: number;\n    exitThreshold: number;\n    maxPositionSize: number;\n  } {\n    return {\n      isRunning: this.isRunning,\n      activePositions: this.activePositions.size,\n      entryThreshold: this.entryThreshold,\n      exitThreshold: this.exitThreshold,\n      maxPositionSize: this.maxPositionSize\n    };\n  }\n}\n\nexport default StatisticalArbitrageStrategy;
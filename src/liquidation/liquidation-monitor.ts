// ULTIMATE TRADING EMPIRE - LIQUIDATION MONITORING SYSTEM
// Track open interest and liquidation levels across all platforms

import { EventEmitter } from 'events';
import { LiquidationSignal } from '../types/core';
import { LiquidationSignalModel } from '../database/models';
import ExchangeManager from '../exchanges/exchange-manager';
import { v4 as uuidv4 } from 'uuid';

export interface OpenInterestData {
  exchange: string;
  asset: string;
  longOI: number;
  shortOI: number;
  longLiquidationLevel: number;
  shortLiquidationLevel: number;
  fundingRate: number;
  timestamp: Date;
}

export interface LiquidationLevel {
  exchange: string;
  asset: string;
  price: number;
  volume: number;
  side: 'long' | 'short';
  distance: number; // % from current price
  impact: number; // Estimated price impact
  confidence: number;
}

export class LiquidationMonitor extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private openInterestData: Map<string, OpenInterestData> = new Map();
  private liquidationLevels: Map<string, LiquidationLevel[]> = new Map();
  private monitoredAssets: string[] = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'];
  private isMonitoring: boolean = false;
  private updateInterval: number = 60000; // 1 minute
  private cascadeThreshold: number = 100000000; // $100M liquidation threshold for cascade

  constructor(exchangeManager: ExchangeManager) {
    super();
    this.exchangeManager = exchangeManager;
  }

  /**
   * 🚀 START LIQUIDATION MONITORING
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('📊 Liquidation monitoring already active');
      return;
    }

    console.log('🚀 STARTING COMPREHENSIVE LIQUIDATION MONITORING...');
    
    // Initialize monitoring for all assets
    await this.initializeMonitoring();
    
    // Start regular updates
    this.startRegularUpdates();
    
    // Listen for price updates to detect approaching liquidations
    this.listenForPriceUpdates();
    
    this.isMonitoring = true;
    console.log('📊 LIQUIDATION MONITORING ACTIVE!');
  }

  /**
   * 🏗️ INITIALIZE MONITORING
   */
  private async initializeMonitoring(): Promise<void> {
    console.log('🏗️ INITIALIZING LIQUIDATION MONITORING...');
    
    // Get initial open interest data
    for (const asset of this.monitoredAssets) {
      await this.updateOpenInterest(asset);
    }
    
    // Calculate initial liquidation levels
    for (const asset of this.monitoredAssets) {
      await this.calculateLiquidationLevels(asset);
    }
    
    console.log('✅ LIQUIDATION MONITORING INITIALIZED');
  }

  /**
   * 🔄 START REGULAR UPDATES
   */
  private startRegularUpdates(): void {
    // Update open interest data regularly
    setInterval(async () => {
      for (const asset of this.monitoredAssets) {
        await this.updateOpenInterest(asset);
      }
    }, this.updateInterval);
    
    // Recalculate liquidation levels regularly
    setInterval(async () => {
      for (const asset of this.monitoredAssets) {
        await this.calculateLiquidationLevels(asset);
      }
    }, this.updateInterval / 2);
  }

  /**
   * 📡 LISTEN FOR PRICE UPDATES
   */
  private listenForPriceUpdates(): void {
    this.exchangeManager.on('priceUpdate', async (priceUpdate) => {
      // Check if this is a monitored asset
      if (this.monitoredAssets.includes(priceUpdate.symbol)) {
        await this.checkForApproachingLiquidations(priceUpdate.symbol, priceUpdate.price, priceUpdate.exchange);
      }
    });
  }

  /**
   * 📊 UPDATE OPEN INTEREST
   */
  private async updateOpenInterest(asset: string): Promise<void> {
    try {
      // In real implementation, would fetch from exchange APIs
      // For now, simulating open interest data
      
      const exchanges = ['binance', 'bybit', 'okx', 'deribit', 'bitmex'];
      
      for (const exchange of exchanges) {
        const mockOI = this.generateMockOpenInterest(exchange, asset);
        const key = `${exchange}-${asset}`;
        
        this.openInterestData.set(key, mockOI);
      }
      
    } catch (error) {
      console.error(`Error updating open interest for ${asset}:`, error);
    }
  }

  /**
   * 🎲 GENERATE MOCK OPEN INTEREST
   */
  private generateMockOpenInterest(exchange: string, asset: string): OpenInterestData {
    // Generate realistic mock data based on asset
    let baseOI = 0;
    
    if (asset.startsWith('BTC')) {
      baseOI = 1000000000; // $1B for BTC
    } else if (asset.startsWith('ETH')) {
      baseOI = 500000000; // $500M for ETH
    } else {
      baseOI = 100000000; // $100M for others
    }
    
    // Add some randomness
    const longOI = baseOI * (0.8 + Math.random() * 0.4); // 80-120% of base
    const shortOI = baseOI * (0.8 + Math.random() * 0.4); // 80-120% of base
    
    // Current price (mock)
    const currentPrice = asset.startsWith('BTC') ? 50000 : 
                        asset.startsWith('ETH') ? 3000 : 
                        asset.startsWith('BNB') ? 300 : 
                        asset.startsWith('SOL') ? 100 : 50;
    
    // Liquidation levels
    const longLiquidationLevel = currentPrice * 0.9; // 10% down
    const shortLiquidationLevel = currentPrice * 1.1; // 10% up
    
    return {
      exchange,
      asset,
      longOI,
      shortOI,
      longLiquidationLevel,
      shortLiquidationLevel,
      fundingRate: (Math.random() * 0.002) - 0.001, // -0.1% to 0.1%
      timestamp: new Date()
    };
  }

  /**
   * 🧮 CALCULATE LIQUIDATION LEVELS
   */
  private async calculateLiquidationLevels(asset: string): Promise<void> {
    try {
      const levels: LiquidationLevel[] = [];
      
      // Get current price
      const prices = await this.exchangeManager.getExchangePrices(asset);
      if (prices.size === 0) return;
      
      const avgPrice = Array.from(prices.values()).reduce((sum, price) => sum + price, 0) / prices.size;
      
      // Calculate liquidation levels from open interest data
      for (const [key, data] of this.openInterestData.entries()) {
        if (data.asset === asset) {
          // Long liquidations (price going down)
          const longDistance = (avgPrice - data.longLiquidationLevel) / avgPrice;
          const longVolume = data.longOI * 0.2; // Assume 20% gets liquidated at this level
          
          levels.push({
            exchange: data.exchange,
            asset: data.asset,
            price: data.longLiquidationLevel,
            volume: longVolume,
            side: 'long',
            distance: longDistance,
            impact: this.estimatePriceImpact(longVolume, asset),
            confidence: 0.8
          });
          
          // Short liquidations (price going up)
          const shortDistance = (data.shortLiquidationLevel - avgPrice) / avgPrice;
          const shortVolume = data.shortOI * 0.2; // Assume 20% gets liquidated at this level
          
          levels.push({
            exchange: data.exchange,
            asset: data.asset,
            price: data.shortLiquidationLevel,
            volume: shortVolume,
            side: 'short',
            distance: shortDistance,
            impact: this.estimatePriceImpact(shortVolume, asset),
            confidence: 0.8
          });
        }
      }
      
      // Sort by distance (closest first)
      levels.sort((a, b) => a.distance - b.distance);
      
      // Store liquidation levels
      this.liquidationLevels.set(asset, levels);
      
      // Check for potential cascade conditions
      this.checkForCascadeConditions(asset, levels);
      
    } catch (error) {
      console.error(`Error calculating liquidation levels for ${asset}:`, error);
    }
  }

  /**
   * 💥 ESTIMATE PRICE IMPACT
   */
  private estimatePriceImpact(volume: number, asset: string): number {
    // Simple model: impact = volume / market cap * multiplier
    let marketCap = 0;
    let impactMultiplier = 1;
    
    if (asset.startsWith('BTC')) {
      marketCap = 1000000000000; // $1T for BTC
      impactMultiplier = 0.8;
    } else if (asset.startsWith('ETH')) {
      marketCap = 500000000000; // $500B for ETH
      impactMultiplier = 1;
    } else if (asset.startsWith('BNB')) {
      marketCap = 50000000000; // $50B for BNB
      impactMultiplier = 1.2;
    } else {
      marketCap = 10000000000; // $10B for others
      impactMultiplier = 1.5;
    }
    
    return (volume / marketCap) * 100 * impactMultiplier; // Impact percentage
  }

  /**
   * 🔍 CHECK FOR APPROACHING LIQUIDATIONS
   */
  private async checkForApproachingLiquidations(
    asset: string,
    currentPrice: number,
    exchange: string
  ): Promise<void> {
    const levels = this.liquidationLevels.get(asset);
    if (!levels) return;
    
    // Check each liquidation level
    for (const level of levels) {
      // Calculate how close we are to this liquidation level
      const priceDistance = level.side === 'long' 
        ? (currentPrice - level.price) / currentPrice // For long liquidations (price going down)
        : (level.price - currentPrice) / currentPrice; // For short liquidations (price going up)
      
      // If we're within 2% of a liquidation level
      if (priceDistance < 0.02) {
        console.log(`⚠️ APPROACHING LIQUIDATION LEVEL: ${asset} ${level.side} at $${level.price}`);
        console.log(`📊 Distance: ${(priceDistance * 100).toFixed(2)}%, Volume: $${level.volume.toLocaleString()}`);
        
        // Create liquidation signal
        const signal = await this.createLiquidationSignal(level, currentPrice, priceDistance);
        
        // Emit approaching liquidation event
        this.emit('approachingLiquidation', signal);
      }
    }
  }

  /**
   * 🚨 CREATE LIQUIDATION SIGNAL
   */
  private async createLiquidationSignal(
    level: LiquidationLevel,
    currentPrice: number,
    priceDistance: number
  ): Promise<LiquidationSignal> {
    const timeToLiquidation = this.estimateTimeToLiquidation(priceDistance, level.asset);
    const reversalProbability = this.estimateReversalProbability(level);
    
    const signal: LiquidationSignal = {
      id: uuidv4(),
      exchange: level.exchange,
      asset: level.asset,
      liquidationPrice: level.price,
      liquidationVolume: level.volume,
      openInterest: this.getTotalOpenInterest(level.asset),
      cascadeRisk: this.calculateCascadeRisk(level),
      timeToLiquidation,
      reversalProbability,
      confidence: level.confidence * (1 - priceDistance * 10), // Lower confidence as distance increases
      detectedAt: new Date(),
      estimatedCascadeAt: new Date(Date.now() + timeToLiquidation)
    };
    
    // Save to database
    const signalDoc = new LiquidationSignalModel(signal);
    await signalDoc.save();
    
    return signal;
  }

  /**
   * ⏱️ ESTIMATE TIME TO LIQUIDATION
   */
  private estimateTimeToLiquidation(priceDistance: number, asset: string): number {
    // Estimate based on distance and recent volatility
    // In real implementation, would use volatility metrics
    
    // Base time: closer = faster
    const baseTime = priceDistance * 1000000; // 1M ms (16.6 min) per 1% distance
    
    // Adjust for asset volatility
    const volatilityMultiplier = asset.startsWith('BTC') ? 1 :
                                asset.startsWith('ETH') ? 0.8 :
                                0.6; // More volatile = faster
    
    return Math.max(30000, baseTime * volatilityMultiplier); // Minimum 30 seconds
  }

  /**
   * 🔄 ESTIMATE REVERSAL PROBABILITY
   */
  private estimateReversalProbability(level: LiquidationLevel): number {
    // Estimate likelihood of price reversing before hitting liquidation
    
    // Base probability based on volume
    const volumeBasedProb = Math.min(0.8, level.volume / 1000000000); // Higher volume = higher probability
    
    // Adjust for side (long/short)
    const sideMultiplier = level.side === 'long' ? 1.2 : 0.8; // Long liquidations more likely to cascade
    
    // Adjust for impact
    const impactMultiplier = Math.min(1.5, level.impact / 2); // Higher impact = higher probability
    
    return Math.min(0.95, volumeBasedProb * sideMultiplier * impactMultiplier);
  }

  /**
   * 💰 GET TOTAL OPEN INTEREST
   */
  private getTotalOpenInterest(asset: string): number {
    let totalOI = 0;
    
    for (const [key, data] of this.openInterestData.entries()) {
      if (data.asset === asset) {
        totalOI += data.longOI + data.shortOI;
      }
    }
    
    return totalOI;
  }

  /**
   * 🌊 CALCULATE CASCADE RISK
   */
  private calculateCascadeRisk(level: LiquidationLevel): number {
    // Calculate risk of this liquidation triggering a cascade
    
    // Base risk on volume
    const volumeRisk = Math.min(0.9, level.volume / this.cascadeThreshold);
    
    // Adjust for impact
    const impactRisk = Math.min(0.9, level.impact / 5); // 5% impact = 0.9 risk
    
    // Combined risk
    return Math.min(0.95, (volumeRisk + impactRisk) / 2);
  }

  /**
   * 🌊 CHECK FOR CASCADE CONDITIONS
   */
  private checkForCascadeConditions(asset: string, levels: LiquidationLevel[]): void {
    // Check for potential cascade conditions
    
    // Group liquidation levels by side
    const longLevels = levels.filter(l => l.side === 'long');
    const shortLevels = levels.filter(l => l.side === 'short');
    
    // Check for clustered long liquidations
    this.checkForClusteredLiquidations(asset, longLevels, 'long');
    
    // Check for clustered short liquidations
    this.checkForClusteredLiquidations(asset, shortLevels, 'short');
  }

  /**
   * 🔍 CHECK FOR CLUSTERED LIQUIDATIONS
   */
  private checkForClusteredLiquidations(
    asset: string,
    levels: LiquidationLevel[],
    side: 'long' | 'short'
  ): void {
    if (levels.length < 2) return;
    
    // Sort by price
    const sortedLevels = [...levels].sort((a, b) => 
      side === 'long' ? a.price - b.price : b.price - a.price
    );
    
    // Check for clusters within 2% price range
    for (let i = 0; i < sortedLevels.length - 1; i++) {
      let clusterVolume = sortedLevels[i].volume;
      let clusterLevels = [sortedLevels[i]];
      
      for (let j = i + 1; j < sortedLevels.length; j++) {
        const priceDiff = Math.abs(sortedLevels[i].price - sortedLevels[j].price) / sortedLevels[i].price;
        
        if (priceDiff <= 0.02) { // Within 2% price range
          clusterVolume += sortedLevels[j].volume;
          clusterLevels.push(sortedLevels[j]);
        }
      }
      
      // If cluster volume exceeds cascade threshold
      if (clusterVolume >= this.cascadeThreshold) {
        console.log(`🌊 POTENTIAL CASCADE DETECTED: ${asset} ${side}`);
        console.log(`📊 Cluster Volume: $${clusterVolume.toLocaleString()}`);
        
        // Emit cascade warning
        this.emit('cascadeWarning', {
          asset,
          side,
          clusterVolume,
          clusterLevels,
          cascadeRisk: Math.min(0.95, clusterVolume / this.cascadeThreshold),
          detectedAt: new Date()
        });
      }
    }
  }

  /**
   * 📊 GET LIQUIDATION STATISTICS
   */
  getStatistics(): any {
    const stats = {
      monitoredAssets: this.monitoredAssets.length,
      openInterestEntries: this.openInterestData.size,
      liquidationLevelCount: 0,
      nearestLiquidations: [],
      highestCascadeRisks: []
    };
    
    // Count total liquidation levels
    for (const [asset, levels] of this.liquidationLevels.entries()) {
      stats.liquidationLevelCount += levels.length;
      
      // Find nearest liquidation for each asset
      if (levels.length > 0) {
        const nearest = levels[0]; // Already sorted by distance
        stats.nearestLiquidations.push({
          asset,
          price: nearest.price,
          distance: nearest.distance,
          volume: nearest.volume,
          side: nearest.side
        });
      }
      
      // Find highest cascade risks
      const highCascadeRisk = levels.find(l => l.impact > 3);
      if (highCascadeRisk) {
        stats.highestCascadeRisks.push({
          asset,
          price: highCascadeRisk.price,
          impact: highCascadeRisk.impact,
          volume: highCascadeRisk.volume,
          side: highCascadeRisk.side
        });
      }
    }
    
    return stats;
  }

  /**
   * 🛑 STOP MONITORING
   */
  stopMonitoring(): void {
    console.log('🛑 STOPPING LIQUIDATION MONITORING...');
    
    this.isMonitoring = false;
    this.openInterestData.clear();
    this.liquidationLevels.clear();
    
    console.log('🛑 LIQUIDATION MONITORING STOPPED');
  }
}

export default LiquidationMonitor;
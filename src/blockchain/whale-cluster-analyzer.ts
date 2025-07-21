// ULTIMATE TRADING EMPIRE - WHALE CLUSTER ANALYSIS ENGINE
// Detect coordinated whale movements for 10x profit amplification

import { WhaleMovement, WhaleCluster } from '../types/core';
import { WhaleMovementModel, WhaleClusterModel } from '../database/models';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export class WhaleClusterAnalyzer extends EventEmitter {
  private analysisWindow: number = 300000; // 5 minutes
  private minClusterSize: number = 3;
  private correlationThreshold: number = 0.8;
  private impactMultiplier: number = 2.5;

  constructor() {
    super();
  }

  /**
   * 🐋🐋 ANALYZE WHALE COORDINATION PATTERNS
   * Detect when multiple whales are moving in coordination
   */
  async analyzeWhaleCoordination(newMovement: WhaleMovement): Promise<WhaleCluster | null> {
    console.log(`🔍 ANALYZING WHALE COORDINATION for ${newMovement.walletAddress}...`);

    // Get recent whale movements in the analysis window
    const recentMovements = await this.getRecentMovements(newMovement);
    
    if (recentMovements.length < this.minClusterSize) {
      return null;
    }

    // Analyze coordination patterns
    const coordinationScore = this.calculateCoordinationScore(recentMovements);
    
    if (coordinationScore >= this.correlationThreshold) {
      const cluster = await this.createWhaleCluster(recentMovements);
      console.log(`🐋🐋 WHALE CLUSTER DETECTED: ${cluster.wallets.length} whales, $${cluster.totalValue.toLocaleString()} total value!`);
      
      // Save cluster to database
      const clusterDoc = new WhaleClusterModel(cluster);
      await clusterDoc.save();
      
      // Emit cluster detection event
      this.emit('whaleCluster', cluster);
      
      return cluster;
    }

    return null;
  }

  /**
   * 📊 GET RECENT WHALE MOVEMENTS
   */
  private async getRecentMovements(referenceMovement: WhaleMovement): Promise<WhaleMovement[]> {
    const cutoffTime = new Date(Date.now() - this.analysisWindow);
    
    const movements = await WhaleMovementModel.find({
      timestamp: { $gte: cutoffTime },
      blockchain: referenceMovement.blockchain,
      asset: referenceMovement.asset,
      usdValue: { $gte: 1000000 } // $1M+ movements only
    }).sort({ timestamp: -1 });

    return movements;
  }

  /**
   * 🧮 CALCULATE COORDINATION SCORE
   * Analyze timing, amounts, and patterns to detect coordination
   */
  private calculateCoordinationScore(movements: WhaleMovement[]): number {
    if (movements.length < 2) return 0;

    let totalScore = 0;
    let comparisons = 0;

    // Analyze timing correlation
    const timingScore = this.analyzeTimingCorrelation(movements);
    totalScore += timingScore * 0.4; // 40% weight

    // Analyze amount correlation
    const amountScore = this.analyzeAmountCorrelation(movements);
    totalScore += amountScore * 0.3; // 30% weight

    // Analyze direction correlation
    const directionScore = this.analyzeDirectionCorrelation(movements);
    totalScore += directionScore * 0.3; // 30% weight

    return Math.min(totalScore, 1.0);
  }

  /**
   * ⏰ ANALYZE TIMING CORRELATION
   */
  private analyzeTimingCorrelation(movements: WhaleMovement[]): number {
    if (movements.length < 2) return 0;

    const timestamps = movements.map(m => m.timestamp.getTime());
    const timeGaps = [];

    for (let i = 1; i < timestamps.length; i++) {
      timeGaps.push(timestamps[i] - timestamps[i-1]);
    }

    // Calculate average time gap
    const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    
    // Score based on how close movements are in time
    // Closer movements = higher coordination score
    const maxGap = 300000; // 5 minutes
    const timingScore = Math.max(0, 1 - (avgGap / maxGap));

    return timingScore;
  }

  /**
   * 💰 ANALYZE AMOUNT CORRELATION
   */
  private analyzeAmountCorrelation(movements: WhaleMovement[]): number {
    if (movements.length < 2) return 0;

    const amounts = movements.map(m => m.usdValue);
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    
    // Calculate coefficient of variation
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgAmount;

    // Lower variation = higher coordination score
    const amountScore = Math.max(0, 1 - coefficientOfVariation);

    return amountScore;
  }

  /**
   * 📈 ANALYZE DIRECTION CORRELATION
   */
  private analyzeDirectionCorrelation(movements: WhaleMovement[]): number {
    // For now, assume all movements are in same direction (buying/selling)
    // In real implementation, would analyze transaction types
    return 0.8; // High correlation assumed
  }

  /**
   * 🏗️ CREATE WHALE CLUSTER
   */
  private async createWhaleCluster(movements: WhaleMovement[]): Promise<WhaleCluster> {
    const totalValue = movements.reduce((sum, m) => sum + m.usdValue, 0);
    const uniqueWallets = [...new Set(movements.map(m => m.walletAddress))];
    
    const cluster: WhaleCluster = {
      id: uuidv4(),
      wallets: uniqueWallets,
      coordinatedMovements: movements.map(m => m.id),
      totalValue: totalValue,
      impactMultiplier: uniqueWallets.length * this.impactMultiplier,
      confidence: this.calculateCoordinationScore(movements),
      detectedAt: new Date(),
      estimatedExecutionTime: new Date(Date.now() + 30000) // 30 seconds
    };

    return cluster;
  }

  /**
   * 🎯 PREDICT CLUSTER IMPACT
   */
  predictClusterImpact(cluster: WhaleCluster): {
    expectedPriceImpact: number;
    timeToImpact: number;
    confidence: number;
  } {
    // Calculate expected price impact based on cluster size and value
    const baseImpact = (cluster.totalValue / 1000000000) * 0.01; // 1% per $1B
    const clusterMultiplier = cluster.impactMultiplier;
    const expectedPriceImpact = baseImpact * clusterMultiplier;

    // Estimate time to market impact
    const timeToImpact = Math.max(30000, 300000 - (cluster.wallets.length * 30000)); // 30s to 5min

    return {
      expectedPriceImpact: Math.min(expectedPriceImpact, 0.2), // Cap at 20%
      timeToImpact,
      confidence: cluster.confidence
    };
  }

  /**
   * 🔍 ANALYZE WHALE NETWORK RELATIONSHIPS
   */
  async analyzeWhaleNetworks(): Promise<Map<string, string[]>> {
    console.log('🕸️ ANALYZING WHALE NETWORK RELATIONSHIPS...');
    
    const networks = new Map<string, string[]>();
    
    // Get all whale movements from last 30 days
    const cutoffTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMovements = await WhaleMovementModel.find({
      timestamp: { $gte: cutoffTime }
    });

    // Group by time windows to find frequently coordinated wallets
    const timeWindows = this.groupMovementsByTimeWindows(recentMovements);
    
    timeWindows.forEach(movements => {
      if (movements.length >= 3) {
        const wallets = movements.map(m => m.walletAddress);
        
        // Add relationships between all wallets in this coordination
        wallets.forEach(wallet => {
          if (!networks.has(wallet)) {
            networks.set(wallet, []);
          }
          
          const connections = networks.get(wallet)!;
          wallets.forEach(otherWallet => {
            if (wallet !== otherWallet && !connections.includes(otherWallet)) {
              connections.push(otherWallet);
            }
          });
        });
      }
    });

    console.log(`🕸️ DISCOVERED ${networks.size} WHALE NETWORK NODES`);
    return networks;
  }

  /**
   * ⏱️ GROUP MOVEMENTS BY TIME WINDOWS
   */
  private groupMovementsByTimeWindows(movements: WhaleMovement[]): WhaleMovement[][] {
    const windowSize = 300000; // 5 minutes
    const windows: WhaleMovement[][] = [];
    
    movements.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    let currentWindow: WhaleMovement[] = [];
    let windowStart = 0;
    
    movements.forEach(movement => {
      const movementTime = movement.timestamp.getTime();
      
      if (currentWindow.length === 0) {
        windowStart = movementTime;
        currentWindow.push(movement);
      } else if (movementTime - windowStart <= windowSize) {
        currentWindow.push(movement);
      } else {
        if (currentWindow.length >= 2) {
          windows.push([...currentWindow]);
        }
        currentWindow = [movement];
        windowStart = movementTime;
      }
    });
    
    if (currentWindow.length >= 2) {
      windows.push(currentWindow);
    }
    
    return windows;
  }

  /**
   * 📊 GET CLUSTER STATISTICS
   */
  async getClusterStatistics(): Promise<any> {
    const totalClusters = await WhaleClusterModel.countDocuments();
    const recentClusters = await WhaleClusterModel.find({
      detectedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const avgClusterSize = recentClusters.length > 0 
      ? recentClusters.reduce((sum, c) => sum + c.wallets.length, 0) / recentClusters.length
      : 0;

    const totalValue = recentClusters.reduce((sum, c) => sum + c.totalValue, 0);

    return {
      totalClusters,
      recentClusters: recentClusters.length,
      avgClusterSize: Math.round(avgClusterSize * 100) / 100,
      totalValue24h: totalValue,
      avgConfidence: recentClusters.length > 0
        ? recentClusters.reduce((sum, c) => sum + c.confidence, 0) / recentClusters.length
        : 0
    };
  }
}

export default WhaleClusterAnalyzer;
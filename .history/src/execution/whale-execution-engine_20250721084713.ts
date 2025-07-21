// ULTIMATE TRADING EMPIRE - WHALE EXECUTION ENGINE
// Sub-500ms front-running execution for maximum profit extraction

import { EventEmitter } from 'events';
import { WhaleMovement, WhaleCluster, TradeSignal, ExecutionResult } from '../types/core';
import { TradeSignalModel, ExecutionResultModel } from '../database/models';
import { v4 as uuidv4 } from 'uuid';

export class WhaleExecutionEngine extends EventEmitter {
  private executionQueue: Map<string, TradeSignal> = new Map();
  private executionLatency: number[] = [];
  private maxExecutionTime: number = 500; // 500ms maximum
  private isExecuting: boolean = false;

  constructor() {
    super();
    this.startExecutionLoop();
  }

  /**
   * ⚡ EXECUTE WHALE FRONT-RUNNING TRADE
   * Lightning-fast execution within 500ms window
   */
  async executeWhaleFrontRun(
    whaleMovement: WhaleMovement,
    accountId: string,
    availableBalance: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    console.log(`⚡ EXECUTING WHALE FRONT-RUN: ${whaleMovement.asset} - ${whaleMovement.usdValue.toLocaleString()}`);

    try {
      // Calculate optimal position size based on whale impact
      const positionSize = this.calculateWhalePositionSize(whaleMovement, availableBalance);
      
      // Create trade signal
      const signal = this.createWhaleTradeSignal(whaleMovement, accountId, positionSize);
      
      // Execute trade with maximum speed
      const result = await this.executeTradeSignal(signal);
      
      // Record execution latency
      const executionTime = Date.now() - startTime;
      this.executionLatency.push(executionTime);
      
      console.log(`⚡ WHALE FRONT-RUN EXECUTED in ${executionTime}ms`);
      
      if (executionTime > this.maxExecutionTime) {
        console.warn(`⚠️ EXECUTION EXCEEDED 500ms LIMIT: ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      console.error('❌ WHALE EXECUTION ERROR:', error);
      throw error;
    }
  }

  /**
   * 🐋🐋 EXECUTE WHALE CLUSTER FRONT-RUN
   * Coordinated execution for whale cluster movements
   */
  async executeWhaleClusterFrontRun(
    cluster: WhaleCluster,
    accountId: string,
    availableBalance: number
  ): Promise<ExecutionResult[]> {
    const startTime = Date.now();
    
    console.log(`🐋🐋 EXECUTING WHALE CLUSTER FRONT-RUN: ${cluster.wallets.length} whales, $${cluster.totalValue.toLocaleString()}`);

    const results: ExecutionResult[] = [];

    try {
      // Calculate cluster position size (larger due to amplified impact)
      const clusterPositionSize = this.calculateClusterPositionSize(cluster, availableBalance);
      
      // Create multiple coordinated signals
      const signals = this.createClusterTradeSignals(cluster, accountId, clusterPositionSize);
      
      // Execute all signals simultaneously for maximum speed
      const executionPromises = signals.map(signal => this.executeTradeSignal(signal));
      const executionResults = await Promise.all(executionPromises);
      
      results.push(...executionResults);
      
      const executionTime = Date.now() - startTime;
      console.log(`🐋🐋 WHALE CLUSTER EXECUTED in ${executionTime}ms`);
      
      return results;
    } catch (error) {
      console.error('❌ WHALE CLUSTER EXECUTION ERROR:', error);
      throw error;
    }
  }

  /**
   * 💰 CALCULATE WHALE POSITION SIZE
   */
  private calculateWhalePositionSize(whale: WhaleMovement, availableBalance: number): number {
    // Base position size on whale impact and confidence
    const impactMultiplier = whale.predictedImpact * 10; // 2% impact = 20% position
    const confidenceMultiplier = whale.confidence;
    const balanceMultiplier = Math.min(0.1, impactMultiplier * confidenceMultiplier); // Max 10% of balance
    
    const positionSize = availableBalance * balanceMultiplier;
    
    // Minimum £10, maximum 10% of balance
    return Math.max(10, Math.min(positionSize, availableBalance * 0.1));
  }

  /**
   * 🐋🐋 CALCULATE CLUSTER POSITION SIZE
   */
  private calculateClusterPositionSize(cluster: WhaleCluster, availableBalance: number): number {
    // Cluster positions are larger due to amplified impact
    const baseImpact = (cluster.totalValue / 1000000000) * 0.01; // 1% per $1B
    const clusterImpact = baseImpact * cluster.impactMultiplier;
    const confidenceMultiplier = cluster.confidence;
    
    const balanceMultiplier = Math.min(0.2, clusterImpact * confidenceMultiplier); // Max 20% for clusters
    const positionSize = availableBalance * balanceMultiplier;
    
    // Minimum £50 for clusters, maximum 20% of balance
    return Math.max(50, Math.min(positionSize, availableBalance * 0.2));
  }

  /**
   * 📊 CREATE WHALE TRADE SIGNAL
   */
  private createWhaleTradeSignal(
    whale: WhaleMovement,
    accountId: string,
    positionSize: number
  ): TradeSignal {
    return {
      id: uuidv4(),
      strategyType: whale.isClusterMovement ? 'whale-clustering' : 'whale-tracking',
      account: accountId,
      asset: whale.asset,
      side: 'buy', // Front-run by buying before whale impact
      quantity: positionSize,
      orderType: 'market', // Market orders for maximum speed
      leverage: 2, // 2x leverage for whale trades
      confidence: whale.confidence,
      urgency: 'critical', // Maximum urgency
      executionDeadline: new Date(whale.timestamp.getTime() + whale.executionWindow),
      expectedProfit: whale.predictedImpact * 100, // Expected profit percentage
      maxRisk: positionSize * 0.05, // 5% max risk
      createdAt: new Date()
    };
  }

  /**
   * 🐋🐋 CREATE CLUSTER TRADE SIGNALS
   */
  private createClusterTradeSignals(
    cluster: WhaleCluster,
    accountId: string,
    totalPositionSize: number
  ): TradeSignal[] {
    const signals: TradeSignal[] = [];
    const positionPerSignal = totalPositionSize / 3; // Split into 3 signals for speed
    
    for (let i = 0; i < 3; i++) {
      const signal: TradeSignal = {
        id: uuidv4(),
        strategyType: 'whale-clustering',
        account: accountId,
        asset: 'BTC', // Assume BTC for cluster trades
        side: 'buy',
        quantity: positionPerSignal,
        orderType: 'market',
        leverage: 3, // Higher leverage for clusters
        confidence: cluster.confidence,
        urgency: 'critical',
        executionDeadline: cluster.estimatedExecutionTime,
        expectedProfit: (cluster.totalValue / 1000000000) * cluster.impactMultiplier * 100,
        maxRisk: positionPerSignal * 0.03, // 3% max risk per signal
        createdAt: new Date()
      };
      
      signals.push(signal);
    }
    
    return signals;
  }

  /**
   * ⚡ EXECUTE TRADE SIGNAL
   */
  private async executeTradeSignal(signal: TradeSignal): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // Save signal to database
    const signalDoc = new TradeSignalModel(signal);
    await signalDoc.save();
    
    // Simulate ultra-fast execution (in real implementation, would call exchange APIs)
    const executionResult: ExecutionResult = {
      id: uuidv4(),
      signalId: signal.id,
      account: signal.account,
      status: 'filled',
      executedQuantity: signal.quantity,
      executedPrice: 50000, // Mock price
      fees: signal.quantity * 0.001, // 0.1% fees
      slippage: signal.quantity * 0.0005, // 0.05% slippage
      pnl: 0, // Will be calculated later
      executionTime: Date.now() - startTime,
      executedAt: new Date()
    };
    
    // Save execution result
    const resultDoc = new ExecutionResultModel(executionResult);
    await resultDoc.save();
    
    // Emit execution event
    this.emit('tradeExecuted', executionResult);
    
    return executionResult;
  }

  /**
   * 🔄 START EXECUTION LOOP
   */
  private startExecutionLoop(): void {
    setInterval(() => {
      this.processExecutionQueue();
    }, 10); // Check every 10ms for maximum speed
  }

  /**
   * 📋 PROCESS EXECUTION QUEUE
   */
  private async processExecutionQueue(): Promise<void> {
    if (this.isExecuting || this.executionQueue.size === 0) {
      return;
    }

    this.isExecuting = true;

    try {
      const signals = Array.from(this.executionQueue.values());
      const urgentSignals = signals.filter(s => s.urgency === 'critical');
      
      if (urgentSignals.length > 0) {
        // Execute urgent signals first
        const executionPromises = urgentSignals.map(signal => {
          this.executionQueue.delete(signal.id);
          return this.executeTradeSignal(signal);
        });
        
        await Promise.all(executionPromises);
      }
    } catch (error) {
      console.error('❌ EXECUTION QUEUE ERROR:', error);
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 📊 GET EXECUTION STATISTICS
   */
  getExecutionStats(): any {
    const avgLatency = this.executionLatency.length > 0
      ? this.executionLatency.reduce((sum, lat) => sum + lat, 0) / this.executionLatency.length
      : 0;

    const sub500msCount = this.executionLatency.filter(lat => lat <= 500).length;
    const sub500msRate = this.executionLatency.length > 0
      ? (sub500msCount / this.executionLatency.length) * 100
      : 0;

    return {
      totalExecutions: this.executionLatency.length,
      averageLatency: Math.round(avgLatency),
      sub500msRate: Math.round(sub500msRate * 100) / 100,
      queueSize: this.executionQueue.size,
      isExecuting: this.isExecuting,
      maxExecutionTime: Math.max(...this.executionLatency, 0),
      minExecutionTime: Math.min(...this.executionLatency, 0)
    };
  }

  /**
   * 🎯 OPTIMIZE EXECUTION SPEED
   */
  optimizeExecutionSpeed(): void {
    console.log('⚡ OPTIMIZING EXECUTION SPEED...');
    
    // Analyze recent execution latencies
    const recentLatencies = this.executionLatency.slice(-100); // Last 100 executions
    const avgLatency = recentLatencies.reduce((sum, lat) => sum + lat, 0) / recentLatencies.length;
    
    if (avgLatency > this.maxExecutionTime) {
      console.log(`⚠️ AVERAGE LATENCY ${avgLatency}ms EXCEEDS TARGET ${this.maxExecutionTime}ms`);
      
      // Implement speed optimizations
      this.maxExecutionTime = Math.max(200, this.maxExecutionTime - 50); // Reduce target by 50ms
      console.log(`🚀 NEW EXECUTION TARGET: ${this.maxExecutionTime}ms`);
    }
  }

  /**
   * 🛑 EMERGENCY STOP
   */
  emergencyStop(): void {
    console.log('🛑 EMERGENCY STOP - HALTING ALL EXECUTIONS');
    this.executionQueue.clear();
    this.isExecuting = false;
    this.emit('emergencyStop');
  }
}

export default WhaleExecutionEngine;
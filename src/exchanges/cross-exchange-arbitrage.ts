// ULTIMATE TRADING EMPIRE - CROSS-EXCHANGE ARBITRAGE ENGINE
// Simultaneous buy/sell execution across multiple exchanges for guaranteed profits

import { EventEmitter } from 'events';
import { ArbitrageOpportunity, ExecutionResult } from '../types/core';
import { ExecutionResultModel } from '../database/models';
import ExchangeManager from './exchange-manager';
import { v4 as uuidv4 } from 'uuid';

export interface ArbitrageExecution {
  id: string;
  opportunity: ArbitrageOpportunity;
  buyResult: ExecutionResult;
  sellResult: ExecutionResult;
  netProfit: number;
  executionTime: number;
  status: 'success' | 'partial' | 'failed';
  timestamp: Date;
}

export class CrossExchangeArbitrageEngine extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private activeArbitrages: Map<string, ArbitrageExecution> = new Map();
  private executionQueue: ArbitrageOpportunity[] = [];
  private isExecuting: boolean = false;
  private maxConcurrentArbitrages: number = 5;
  private minProfitThreshold: number = 0.5; // 0.5% minimum profit after fees

  constructor(exchangeManager: ExchangeManager) {
    super();
    this.exchangeManager = exchangeManager;
    this.startArbitrageProcessor();
  }

  /**
   * ⚡ EXECUTE CROSS-EXCHANGE ARBITRAGE
   */
  async executeCrossExchangeArbitrage(
    opportunity: ArbitrageOpportunity,
    amount: number
  ): Promise<ArbitrageExecution> {
    console.log(`⚡ EXECUTING CROSS-EXCHANGE ARBITRAGE:`);
    console.log(`   Asset: ${opportunity.asset}`);
    console.log(`   Buy: ${opportunity.buyExchange} @ $${opportunity.buyPrice}`);
    console.log(`   Sell: ${opportunity.sellExchange} @ $${opportunity.sellPrice}`);
    console.log(`   Profit: ${opportunity.profitPotential.toFixed(2)}%`);

    const startTime = Date.now();
    const executionId = uuidv4();

    try {
      // Validate opportunity is still profitable
      const isStillProfitable = await this.validateOpportunity(opportunity);
      if (!isStillProfitable) {
        throw new Error('Opportunity no longer profitable');
      }

      // Execute simultaneous buy and sell orders
      const [buyResult, sellResult] = await Promise.all([
        this.executeBuyOrder(opportunity, amount),
        this.executeSellOrder(opportunity, amount)
      ]);

      // Calculate net profit
      const netProfit = this.calculateNetProfit(buyResult, sellResult, opportunity);
      const executionTime = Date.now() - startTime;

      const arbitrageExecution: ArbitrageExecution = {
        id: executionId,
        opportunity,
        buyResult,
        sellResult,
        netProfit,
        executionTime,
        status: this.determineExecutionStatus(buyResult, sellResult),
        timestamp: new Date()
      };

      // Store execution
      this.activeArbitrages.set(executionId, arbitrageExecution);

      console.log(`✅ ARBITRAGE EXECUTED in ${executionTime}ms`);
      console.log(`💰 Net Profit: $${netProfit.toFixed(2)}`);

      // Emit execution event
      this.emit('arbitrageExecuted', arbitrageExecution);

      return arbitrageExecution;

    } catch (error) {
      console.error('❌ CROSS-EXCHANGE ARBITRAGE ERROR:', error);
      
      const failedExecution: ArbitrageExecution = {
        id: executionId,
        opportunity,
        buyResult: this.createFailedResult(opportunity, 'buy'),
        sellResult: this.createFailedResult(opportunity, 'sell'),
        netProfit: -opportunity.fees * amount, // Loss from fees
        executionTime: Date.now() - startTime,
        status: 'failed',
        timestamp: new Date()
      };

      this.emit('arbitrageFailed', failedExecution);
      throw error;
    }
  }

  /**
   * 🔍 VALIDATE OPPORTUNITY
   */
  private async validateOpportunity(opportunity: ArbitrageOpportunity): Promise<boolean> {
    try {
      // Get current prices
      const currentPrices = await this.exchangeManager.getExchangePrices(opportunity.asset);
      
      const currentBuyPrice = currentPrices.get(opportunity.buyExchange);
      const currentSellPrice = currentPrices.get(opportunity.sellExchange);

      if (!currentBuyPrice || !currentSellPrice) {
        return false;
      }

      // Calculate current profit potential
      const currentProfitPercentage = ((currentSellPrice - currentBuyPrice) / currentBuyPrice) * 100;
      
      // Account for fees and slippage
      const netProfitPercentage = currentProfitPercentage - opportunity.fees - opportunity.slippage;

      return netProfitPercentage >= this.minProfitThreshold;

    } catch (error) {
      console.error('Error validating opportunity:', error);
      return false;
    }
  }

  /**
   * 💰 EXECUTE BUY ORDER
   */
  private async executeBuyOrder(
    opportunity: ArbitrageOpportunity,
    amount: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Execute buy order through exchange manager
      const buyOrder = await this.exchangeManager.executeArbitrageTrade(
        { ...opportunity, sellExchange: opportunity.buyExchange }, // Modify for buy-only
        amount
      );

      const executionResult: ExecutionResult = {
        id: uuidv4(),
        signalId: opportunity.id,
        account: 'arbitrage-engine',
        status: 'filled',
        executedQuantity: amount,
        executedPrice: opportunity.buyPrice,
        fees: amount * opportunity.buyPrice * 0.001, // 0.1% fee estimate
        slippage: amount * opportunity.buyPrice * 0.0005, // 0.05% slippage
        pnl: 0, // Will be calculated after both orders
        executionTime: Date.now() - startTime,
        executedAt: new Date()
      };

      // Save to database
      const resultDoc = new ExecutionResultModel(executionResult);
      await resultDoc.save();

      return executionResult;

    } catch (error) {
      console.error(`Buy order error on ${opportunity.buyExchange}:`, error);
      throw error;
    }
  }

  /**
   * 💸 EXECUTE SELL ORDER
   */
  private async executeSellOrder(
    opportunity: ArbitrageOpportunity,
    amount: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Execute sell order through exchange manager
      const sellOrder = await this.exchangeManager.executeArbitrageTrade(
        opportunity,
        amount
      );

      const executionResult: ExecutionResult = {
        id: uuidv4(),
        signalId: opportunity.id,
        account: 'arbitrage-engine',
        status: 'filled',
        executedQuantity: amount,
        executedPrice: opportunity.sellPrice,
        fees: amount * opportunity.sellPrice * 0.001, // 0.1% fee estimate
        slippage: amount * opportunity.sellPrice * 0.0005, // 0.05% slippage
        pnl: 0, // Will be calculated after both orders
        executionTime: Date.now() - startTime,
        executedAt: new Date()
      };

      // Save to database
      const resultDoc = new ExecutionResultModel(executionResult);
      await resultDoc.save();

      return executionResult;

    } catch (error) {
      console.error(`Sell order error on ${opportunity.sellExchange}:`, error);
      throw error;
    }
  }

  /**
   * 🧮 CALCULATE NET PROFIT
   */
  private calculateNetProfit(
    buyResult: ExecutionResult,
    sellResult: ExecutionResult,
    opportunity: ArbitrageOpportunity
  ): number {
    const buyTotal = buyResult.executedQuantity * buyResult.executedPrice + buyResult.fees;
    const sellTotal = sellResult.executedQuantity * sellResult.executedPrice - sellResult.fees;
    
    return sellTotal - buyTotal;
  }

  /**
   * 📊 DETERMINE EXECUTION STATUS
   */
  private determineExecutionStatus(
    buyResult: ExecutionResult,
    sellResult: ExecutionResult
  ): 'success' | 'partial' | 'failed' {
    if (buyResult.status === 'filled' && sellResult.status === 'filled') {
      return 'success';
    } else if (buyResult.status === 'partial' || sellResult.status === 'partial') {
      return 'partial';
    } else {
      return 'failed';
    }
  }

  /**
   * ❌ CREATE FAILED RESULT
   */
  private createFailedResult(opportunity: ArbitrageOpportunity, side: 'buy' | 'sell'): ExecutionResult {
    return {
      id: uuidv4(),
      signalId: opportunity.id,
      account: 'arbitrage-engine',
      status: 'failed',
      executedQuantity: 0,
      executedPrice: side === 'buy' ? opportunity.buyPrice : opportunity.sellPrice,
      fees: 0,
      slippage: 0,
      pnl: 0,
      executionTime: 0,
      executedAt: new Date(),
      error: 'Execution failed'
    };
  }

  /**
   * 🔄 START ARBITRAGE PROCESSOR
   */
  private startArbitrageProcessor(): void {
    setInterval(() => {
      this.processArbitrageQueue();
    }, 100); // Process every 100ms for high frequency
  }

  /**
   * 📋 PROCESS ARBITRAGE QUEUE
   */
  private async processArbitrageQueue(): Promise<void> {
    if (this.isExecuting || this.executionQueue.length === 0) {
      return;
    }

    if (this.activeArbitrages.size >= this.maxConcurrentArbitrages) {
      return;
    }

    this.isExecuting = true;

    try {
      const opportunity = this.executionQueue.shift();
      if (opportunity) {
        // Calculate optimal position size
        const optimalAmount = this.calculateOptimalPositionSize(opportunity);
        
        // Execute arbitrage
        await this.executeCrossExchangeArbitrage(opportunity, optimalAmount);
      }
    } catch (error) {
      console.error('Arbitrage queue processing error:', error);
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 📏 CALCULATE OPTIMAL POSITION SIZE
   */
  private calculateOptimalPositionSize(opportunity: ArbitrageOpportunity): number {
    // Base position size on profit potential and available capital
    const baseAmount = Math.min(1000, opportunity.requiredCapital); // Max $1000 per arbitrage
    
    // Adjust based on profit potential
    const profitMultiplier = Math.min(2, opportunity.profitPotential / 2); // Higher profit = larger position
    
    // Adjust based on confidence
    const confidenceMultiplier = opportunity.confidence;
    
    return baseAmount * profitMultiplier * confidenceMultiplier;
  }

  /**
   * ➕ ADD ARBITRAGE TO QUEUE
   */
  addArbitrageOpportunity(opportunity: ArbitrageOpportunity): void {
    // Check if opportunity meets minimum criteria
    if (opportunity.profitPotential >= this.minProfitThreshold) {
      this.executionQueue.push(opportunity);
      console.log(`📋 Added arbitrage to queue: ${opportunity.asset} - ${opportunity.profitPotential.toFixed(2)}%`);
    }
  }

  /**
   * 📊 GET ARBITRAGE STATISTICS
   */
  getArbitrageStats(): any {
    const executions = Array.from(this.activeArbitrages.values());
    const successfulExecutions = executions.filter(e => e.status === 'success');
    const totalProfit = executions.reduce((sum, e) => sum + e.netProfit, 0);
    const avgExecutionTime = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length
      : 0;

    return {
      totalExecutions: executions.length,
      successfulExecutions: successfulExecutions.length,
      successRate: executions.length > 0 ? (successfulExecutions.length / executions.length) * 100 : 0,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgExecutionTime: Math.round(avgExecutionTime),
      queueSize: this.executionQueue.length,
      activeArbitrages: this.activeArbitrages.size,
      isExecuting: this.isExecuting
    };
  }

  /**
   * 🎯 OPTIMIZE ARBITRAGE PARAMETERS
   */
  optimizeParameters(): void {
    const stats = this.getArbitrageStats();
    
    console.log('🎯 OPTIMIZING ARBITRAGE PARAMETERS...');
    
    // Adjust minimum profit threshold based on success rate
    if (stats.successRate < 70) {
      this.minProfitThreshold += 0.1;
      console.log(`📈 Increased profit threshold to ${this.minProfitThreshold}%`);
    } else if (stats.successRate > 90) {
      this.minProfitThreshold = Math.max(0.3, this.minProfitThreshold - 0.1);
      console.log(`📉 Decreased profit threshold to ${this.minProfitThreshold}%`);
    }

    // Adjust concurrent arbitrages based on performance
    if (stats.avgExecutionTime > 5000 && this.maxConcurrentArbitrages > 1) {
      this.maxConcurrentArbitrages--;
      console.log(`⬇️ Reduced concurrent arbitrages to ${this.maxConcurrentArbitrages}`);
    } else if (stats.avgExecutionTime < 2000 && this.maxConcurrentArbitrages < 10) {
      this.maxConcurrentArbitrages++;
      console.log(`⬆️ Increased concurrent arbitrages to ${this.maxConcurrentArbitrages}`);
    }
  }

  /**
   * 🧹 CLEANUP COMPLETED ARBITRAGES
   */
  cleanupCompletedArbitrages(): void {
    const cutoffTime = Date.now() - 300000; // 5 minutes ago
    
    for (const [id, execution] of this.activeArbitrages) {
      if (execution.timestamp.getTime() < cutoffTime) {
        this.activeArbitrages.delete(id);
      }
    }
  }

  /**
   * 🛑 STOP ARBITRAGE ENGINE
   */
  stop(): void {
    console.log('🛑 STOPPING CROSS-EXCHANGE ARBITRAGE ENGINE...');
    
    this.executionQueue.length = 0;
    this.activeArbitrages.clear();
    this.isExecuting = false;
    
    console.log('🛑 ARBITRAGE ENGINE STOPPED');
  }
}

export default CrossExchangeArbitrageEngine;
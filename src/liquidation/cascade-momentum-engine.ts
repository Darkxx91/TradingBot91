// ULTIMATE TRADING EMPIRE - CASCADE MOMENTUM ENGINE
// Ride liquidation cascades for 5-20% profits per event

import { EventEmitter } from 'events';
import { TradeSignal, ExecutionResult } from '../types/core';
import { TradeSignalModel, ExecutionResultModel } from '../database/models';
import CascadePredictionEngine, { CascadePrediction } from './cascade-prediction-engine';
import ExchangeManager from '../exchanges/exchange-manager';
import { v4 as uuidv4 } from 'uuid';

export interface CascadeExecution {
  id: string;
  prediction: CascadePrediction;
  entrySignal: TradeSignal;
  exitSignal: TradeSignal;
  entryResult: ExecutionResult;
  exitResult: ExecutionResult;
  actualProfit: number;
  profitPercentage: number;
  status: 'pending' | 'entered' | 'exited' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

export class CascadeMomentumEngine extends EventEmitter {
  private predictionEngine: CascadePredictionEngine;
  private exchangeManager: ExchangeManager;
  private activeExecutions: Map<string, CascadeExecution> = new Map();
  private completedExecutions: CascadeExecution[] = [];
  private minConfidence: number = 0.7;
  private maxRiskPerTrade: number = 0.05; // 5% of account
  private isActive: boolean = false;
  private accountBalance: number = 1000; // Default $1000

  constructor(predictionEngine: CascadePredictionEngine, exchangeManager: ExchangeManager) {
    super();
    this.predictionEngine = predictionEngine;
    this.exchangeManager = exchangeManager;
  }

  /**
   * 🚀 START CASCADE MOMENTUM ENGINE
   */
  async startMomentumEngine(accountBalance: number = 1000): Promise<void> {
    if (this.isActive) {
      console.log('🚀 Cascade momentum engine already active');
      return;
    }

    console.log('🚀 STARTING CASCADE MOMENTUM ENGINE...');
    
    // Set account balance
    this.accountBalance = accountBalance;
    
    // Listen for cascade predictions
    this.listenForCascadePredictions();
    
    // Listen for cascade starts
    this.listenForCascadeStarts();
    
    // Listen for cascade reversals
    this.listenForCascadeReversals();
    
    // Monitor price movements for active executions
    this.monitorActiveExecutions();
    
    this.isActive = true;
    console.log('🚀 CASCADE MOMENTUM ENGINE ACTIVE!');
  }

  /**
   * 📡 LISTEN FOR CASCADE PREDICTIONS
   */
  private listenForCascadePredictions(): void {
    this.predictionEngine.on('cascadePredicted', (prediction: CascadePrediction) => {
      console.log(`🔮 RECEIVED CASCADE PREDICTION: ${prediction.asset} ${prediction.side}`);
      
      // Prepare for cascade if confidence is high enough
      if (prediction.confidence >= this.minConfidence) {
        this.prepareForCascade(prediction);
      }
    });
  }

  /**
   * 🌊 LISTEN FOR CASCADE STARTS
   */
  private listenForCascadeStarts(): void {
    this.predictionEngine.on('cascadeStarted', async (event) => {
      console.log(`🌊 CASCADE STARTED: ${event.asset} ${event.side}`);
      
      // Execute entry for this cascade
      await this.executeCascadeEntry(event);
    });
  }

  /**
   * 🔄 LISTEN FOR CASCADE REVERSALS
   */
  private listenForCascadeReversals(): void {
    this.predictionEngine.on('cascadeReversal', async (event) => {
      console.log(`🔄 CASCADE REVERSAL: ${event.asset} ${event.side}`);
      
      // Execute exit for this cascade
      await this.executeCascadeExit(event);
    });
  }

  /**
   * 🔍 PREPARE FOR CASCADE
   */
  private prepareForCascade(prediction: CascadePrediction): void {
    console.log(`🔍 PREPARING FOR CASCADE: ${prediction.asset} ${prediction.side}`);
    
    // Create execution object
    const execution: CascadeExecution = {
      id: uuidv4(),
      prediction,
      entrySignal: this.createEntrySignal(prediction),
      exitSignal: this.createExitSignal(prediction),
      entryResult: this.createEmptyResult(),
      exitResult: this.createEmptyResult(),
      actualProfit: 0,
      profitPercentage: 0,
      status: 'pending',
      startedAt: new Date()
    };
    
    // Store execution
    this.activeExecutions.set(execution.id, execution);
    
    console.log(`📋 CASCADE EXECUTION PREPARED: ${execution.id}`);
    console.log(`📊 Entry: ${prediction.side === 'long' ? 'SHORT' : 'LONG'} ${prediction.asset} at $${prediction.triggerPrice}`);
    console.log(`📊 Exit: ${prediction.side === 'long' ? 'COVER' : 'SELL'} at $${prediction.reversalPrice}`);
    
    // Emit preparation event
    this.emit('cascadePrepared', execution);
  }

  /**
   * 📝 CREATE ENTRY SIGNAL
   */
  private createEntrySignal(prediction: CascadePrediction): TradeSignal {
    // Calculate position size
    const positionSize = this.calculatePositionSize(prediction);
    
    // For long liquidation cascades, we go SHORT
    // For short liquidation cascades, we go LONG
    const side = prediction.side === 'long' ? 'sell' : 'buy';
    
    return {
      id: uuidv4(),
      strategyType: 'liquidation-cascade',
      account: 'cascade-momentum',
      asset: prediction.asset,
      side,
      quantity: positionSize,
      orderType: 'market',
      leverage: 3, // 3x leverage for cascade trades
      stopLoss: this.calculateStopLoss(prediction, side),
      takeProfit: prediction.reversalPrice,
      confidence: prediction.confidence,
      urgency: 'high',
      executionDeadline: new Date(prediction.estimatedStartAt.getTime() + 60000), // 1 minute after estimated start
      expectedProfit: prediction.expectedMagnitude,
      maxRisk: positionSize * 0.1, // 10% max risk on position
      createdAt: new Date()
    };
  }

  /**
   * 📝 CREATE EXIT SIGNAL
   */
  private createExitSignal(prediction: CascadePrediction): TradeSignal {
    // For long liquidation cascades, we COVER our short
    // For short liquidation cascades, we SELL our long
    const side = prediction.side === 'long' ? 'buy' : 'sell';
    
    return {
      id: uuidv4(),
      strategyType: 'liquidation-cascade',
      account: 'cascade-momentum',
      asset: prediction.asset,
      side,
      quantity: 0, // Will be set when entry executes
      orderType: 'market',
      leverage: 3, // Same as entry
      confidence: prediction.reversalConfidence,
      urgency: 'medium',
      executionDeadline: new Date(prediction.estimatedEndAt.getTime() + 60000), // 1 minute after estimated end
      expectedProfit: prediction.expectedMagnitude,
      maxRisk: 0, // Will be set when entry executes
      createdAt: new Date()
    };
  }

  /**
   * 📊 CALCULATE POSITION SIZE
   */
  private calculatePositionSize(prediction: CascadePrediction): number {
    // Base size on account balance and max risk
    const baseSize = this.accountBalance * this.maxRiskPerTrade;
    
    // Adjust for confidence
    const confidenceMultiplier = prediction.confidence;
    
    // Adjust for expected magnitude
    const magnitudeMultiplier = Math.min(2, prediction.expectedMagnitude / 5); // Higher magnitude = larger position
    
    // Calculate final size
    const positionSize = baseSize * confidenceMultiplier * magnitudeMultiplier;
    
    // Ensure minimum size
    return Math.max(10, positionSize);
  }

  /**
   * 🛑 CALCULATE STOP LOSS
   */
  private calculateStopLoss(prediction: CascadePrediction, side: 'buy' | 'sell'): number {
    // For short positions (long cascades), stop loss is above entry
    // For long positions (short cascades), stop loss is below entry
    const stopDistance = prediction.triggerPrice * 0.02; // 2% stop loss
    
    return side === 'sell'
      ? prediction.triggerPrice + stopDistance // Stop above for shorts
      : prediction.triggerPrice - stopDistance; // Stop below for longs
  }

  /**
   * 📝 CREATE EMPTY RESULT
   */
  private createEmptyResult(): ExecutionResult {
    return {
      id: uuidv4(),
      signalId: '',
      account: 'cascade-momentum',
      status: 'pending',
      executedQuantity: 0,
      executedPrice: 0,
      fees: 0,
      slippage: 0,
      pnl: 0,
      executionTime: 0,
      executedAt: new Date()
    };
  }

  /**
   * ⚡ EXECUTE CASCADE ENTRY
   */
  private async executeCascadeEntry(event: any): Promise<void> {
    // Find execution for this cascade
    const execution = Array.from(this.activeExecutions.values())
      .find(e => e.prediction.id === event.id);
    
    if (!execution) {
      console.log(`❌ No execution found for cascade: ${event.id}`);
      return;
    }
    
    if (execution.status !== 'pending') {
      console.log(`⚠️ Execution already in progress: ${execution.id}`);
      return;
    }
    
    console.log(`⚡ EXECUTING CASCADE ENTRY: ${execution.id}`);
    
    try {
      // Save entry signal to database
      const signalDoc = new TradeSignalModel(execution.entrySignal);
      await signalDoc.save();
      
      // Execute entry order (in real implementation, would call exchange API)
      const entryResult: ExecutionResult = {
        id: uuidv4(),
        signalId: execution.entrySignal.id,
        account: 'cascade-momentum',
        status: 'filled',
        executedQuantity: execution.entrySignal.quantity,
        executedPrice: event.currentPrice,
        fees: execution.entrySignal.quantity * event.currentPrice * 0.001, // 0.1% fee
        slippage: execution.entrySignal.quantity * event.currentPrice * 0.001, // 0.1% slippage
        pnl: 0, // Will be calculated on exit
        executionTime: 500, // 500ms execution
        executedAt: new Date()
      };
      
      // Save result to database
      const resultDoc = new ExecutionResultModel(entryResult);
      await resultDoc.save();
      
      // Update execution
      execution.entryResult = entryResult;
      execution.status = 'entered';
      execution.exitSignal.quantity = entryResult.executedQuantity; // Set exit quantity
      
      console.log(`✅ CASCADE ENTRY EXECUTED: ${execution.id}`);
      console.log(`📊 ${execution.entrySignal.side} ${execution.prediction.asset} at $${entryResult.executedPrice}`);
      
      // Emit entry event
      this.emit('cascadeEntryExecuted', {
        execution,
        entryPrice: entryResult.executedPrice,
        executedAt: entryResult.executedAt
      });
      
    } catch (error) {
      console.error(`❌ CASCADE ENTRY ERROR: ${error}`);
      
      // Update execution status
      execution.status = 'failed';
      
      // Emit failure event
      this.emit('cascadeExecutionFailed', {
        execution,
        error,
        stage: 'entry'
      });
    }
  }

  /**
   * ⚡ EXECUTE CASCADE EXIT
   */
  private async executeCascadeExit(event: any): Promise<void> {
    // Find execution for this cascade
    const execution = Array.from(this.activeExecutions.values())
      .find(e => e.prediction.id === event.id);
    
    if (!execution) {
      console.log(`❌ No execution found for cascade: ${event.id}`);
      return;
    }
    
    if (execution.status !== 'entered') {
      console.log(`⚠️ Execution not in entered state: ${execution.id}`);
      return;
    }
    
    console.log(`⚡ EXECUTING CASCADE EXIT: ${execution.id}`);
    
    try {
      // Save exit signal to database
      const signalDoc = new TradeSignalModel(execution.exitSignal);
      await signalDoc.save();
      
      // Execute exit order (in real implementation, would call exchange API)
      const exitResult: ExecutionResult = {
        id: uuidv4(),
        signalId: execution.exitSignal.id,
        account: 'cascade-momentum',
        status: 'filled',
        executedQuantity: execution.exitSignal.quantity,
        executedPrice: event.currentPrice,
        fees: execution.exitSignal.quantity * event.currentPrice * 0.001, // 0.1% fee
        slippage: execution.exitSignal.quantity * event.currentPrice * 0.001, // 0.1% slippage
        pnl: 0, // Will calculate below
        executionTime: 500, // 500ms execution
        executedAt: new Date()
      };
      
      // Calculate PnL
      const entryValue = execution.entryResult.executedQuantity * execution.entryResult.executedPrice;
      const exitValue = exitResult.executedQuantity * exitResult.executedPrice;
      
      // For short positions (long cascades), profit = entry - exit
      // For long positions (short cascades), profit = exit - entry
      const profit = execution.entrySignal.side === 'sell'
        ? entryValue - exitValue
        : exitValue - entryValue;
      
      // Subtract fees
      const netProfit = profit - execution.entryResult.fees - exitResult.fees;
      
      // Calculate profit percentage
      const profitPercentage = (netProfit / entryValue) * 100;
      
      // Update exit result
      exitResult.pnl = netProfit;
      
      // Save result to database
      const resultDoc = new ExecutionResultModel(exitResult);
      await resultDoc.save();
      
      // Update execution
      execution.exitResult = exitResult;
      execution.status = 'exited';
      execution.actualProfit = netProfit;
      execution.profitPercentage = profitPercentage;
      execution.completedAt = new Date();
      
      console.log(`✅ CASCADE EXIT EXECUTED: ${execution.id}`);
      console.log(`📊 ${execution.exitSignal.side} ${execution.prediction.asset} at $${exitResult.executedPrice}`);
      console.log(`💰 Profit: $${netProfit.toFixed(2)} (${profitPercentage.toFixed(2)}%)`);
      
      // Move to completed executions
      this.completedExecutions.push(execution);
      this.activeExecutions.delete(execution.id);
      
      // Emit exit event
      this.emit('cascadeExitExecuted', {
        execution,
        exitPrice: exitResult.executedPrice,
        profit: netProfit,
        profitPercentage,
        executedAt: exitResult.executedAt
      });
      
    } catch (error) {
      console.error(`❌ CASCADE EXIT ERROR: ${error}`);
      
      // Update execution status
      execution.status = 'failed';
      
      // Emit failure event
      this.emit('cascadeExecutionFailed', {
        execution,
        error,
        stage: 'exit'
      });
    }
  }

  /**
   * 📡 MONITOR ACTIVE EXECUTIONS
   */
  private monitorActiveExecutions(): void {
    // Listen for price updates
    this.exchangeManager.on('priceUpdate', (priceUpdate) => {
      // Find executions for this asset
      const assetExecutions = Array.from(this.activeExecutions.values())
        .filter(e => e.prediction.asset === priceUpdate.symbol);
      
      if (assetExecutions.length === 0) return;
      
      // Check each execution
      for (const execution of assetExecutions) {
        this.checkExecutionStatus(execution, priceUpdate.price);
      }
    });
    
    // Cleanup expired executions
    setInterval(() => {
      this.cleanupExpiredExecutions();
    }, 60000); // Every minute
  }

  /**
   * 🔍 CHECK EXECUTION STATUS
   */
  private checkExecutionStatus(execution: CascadeExecution, currentPrice: number): void {
    // Skip if not in pending or entered state
    if (execution.status !== 'pending' && execution.status !== 'entered') return;
    
    // Check for stop loss hit
    if (execution.status === 'entered') {
      const stopLoss = execution.entrySignal.stopLoss;
      
      if (stopLoss) {
        const isStopHit = execution.entrySignal.side === 'sell'
          ? currentPrice >= stopLoss // For short positions, stop is hit when price rises above stop
          : currentPrice <= stopLoss; // For long positions, stop is hit when price falls below stop
        
        if (isStopHit) {
          console.log(`🛑 STOP LOSS HIT: ${execution.id}`);
          this.executeStopLoss(execution, currentPrice);
        }
      }
    }
  }

  /**
   * 🛑 EXECUTE STOP LOSS
   */
  private async executeStopLoss(execution: CascadeExecution, currentPrice: number): Promise<void> {
    console.log(`🛑 EXECUTING STOP LOSS: ${execution.id}`);
    
    try {
      // Create stop loss exit signal
      const stopSignal = { ...execution.exitSignal };
      stopSignal.id = uuidv4();
      stopSignal.urgency = 'critical';
      
      // Save stop signal to database
      const signalDoc = new TradeSignalModel(stopSignal);
      await signalDoc.save();
      
      // Execute stop loss order
      const stopResult: ExecutionResult = {
        id: uuidv4(),
        signalId: stopSignal.id,
        account: 'cascade-momentum',
        status: 'filled',
        executedQuantity: execution.entryResult.executedQuantity,
        executedPrice: currentPrice,
        fees: execution.entryResult.executedQuantity * currentPrice * 0.001, // 0.1% fee
        slippage: execution.entryResult.executedQuantity * currentPrice * 0.002, // 0.2% slippage (higher for stops)
        pnl: 0, // Will calculate below
        executionTime: 300, // 300ms execution
        executedAt: new Date()
      };
      
      // Calculate PnL
      const entryValue = execution.entryResult.executedQuantity * execution.entryResult.executedPrice;
      const exitValue = stopResult.executedQuantity * stopResult.executedPrice;
      
      // For short positions (long cascades), profit = entry - exit
      // For long positions (short cascades), profit = exit - entry
      const profit = execution.entrySignal.side === 'sell'
        ? entryValue - exitValue
        : exitValue - entryValue;
      
      // Subtract fees
      const netProfit = profit - execution.entryResult.fees - stopResult.fees;
      
      // Calculate profit percentage
      const profitPercentage = (netProfit / entryValue) * 100;
      
      // Update stop result
      stopResult.pnl = netProfit;
      
      // Save result to database
      const resultDoc = new ExecutionResultModel(stopResult);
      await resultDoc.save();
      
      // Update execution
      execution.exitResult = stopResult;
      execution.status = 'exited';
      execution.actualProfit = netProfit;
      execution.profitPercentage = profitPercentage;
      execution.completedAt = new Date();
      
      console.log(`✅ STOP LOSS EXECUTED: ${execution.id}`);
      console.log(`📊 ${stopSignal.side} ${execution.prediction.asset} at $${stopResult.executedPrice}`);
      console.log(`💰 Loss: $${netProfit.toFixed(2)} (${profitPercentage.toFixed(2)}%)`);
      
      // Move to completed executions
      this.completedExecutions.push(execution);
      this.activeExecutions.delete(execution.id);
      
      // Emit stop loss event
      this.emit('cascadeStopLossExecuted', {
        execution,
        stopPrice: stopResult.executedPrice,
        loss: netProfit,
        lossPercentage: profitPercentage,
        executedAt: stopResult.executedAt
      });
      
    } catch (error) {
      console.error(`❌ STOP LOSS ERROR: ${error}`);
      
      // Update execution status
      execution.status = 'failed';
      
      // Emit failure event
      this.emit('cascadeExecutionFailed', {
        execution,
        error,
        stage: 'stop_loss'
      });
    }
  }

  /**
   * 🧹 CLEANUP EXPIRED EXECUTIONS
   */
  private cleanupExpiredExecutions(): void {
    const now = Date.now();
    
    for (const [id, execution] of this.activeExecutions.entries()) {
      // If pending and past deadline
      if (execution.status === 'pending' && 
          execution.entrySignal.executionDeadline.getTime() < now) {
        console.log(`⌛ CASCADE EXECUTION EXPIRED: ${execution.id}`);
        
        // Move to completed with failed status
        execution.status = 'failed';
        this.completedExecutions.push(execution);
        this.activeExecutions.delete(id);
        
        // Emit expiration event
        this.emit('cascadeExecutionExpired', {
          execution,
          reason: 'entry_deadline_passed'
        });
      }
      
      // If entered and past exit deadline
      if (execution.status === 'entered' && 
          execution.exitSignal.executionDeadline.getTime() < now) {
        console.log(`⌛ CASCADE EXIT EXPIRED: ${execution.id}`);
        
        // Force exit at current price
        this.forceExit(execution);
      }
    }
  }

  /**
   * 🔄 FORCE EXIT
   */
  private async forceExit(execution: CascadeExecution): Promise<void> {
    console.log(`🔄 FORCING EXIT: ${execution.id}`);
    
    try {
      // Get current price
      const prices = await this.exchangeManager.getExchangePrices(execution.prediction.asset);
      const avgPrice = Array.from(prices.values()).reduce((sum, p) => sum + p, 0) / prices.size;
      
      // Execute forced exit
      const forceSignal = { ...execution.exitSignal };
      forceSignal.id = uuidv4();
      forceSignal.urgency = 'critical';
      
      // Save force signal to database
      const signalDoc = new TradeSignalModel(forceSignal);
      await signalDoc.save();
      
      // Execute force exit order
      const forceResult: ExecutionResult = {
        id: uuidv4(),
        signalId: forceSignal.id,
        account: 'cascade-momentum',
        status: 'filled',
        executedQuantity: execution.entryResult.executedQuantity,
        executedPrice: avgPrice,
        fees: execution.entryResult.executedQuantity * avgPrice * 0.001, // 0.1% fee
        slippage: execution.entryResult.executedQuantity * avgPrice * 0.001, // 0.1% slippage
        pnl: 0, // Will calculate below
        executionTime: 500, // 500ms execution
        executedAt: new Date()
      };
      
      // Calculate PnL
      const entryValue = execution.entryResult.executedQuantity * execution.entryResult.executedPrice;
      const exitValue = forceResult.executedQuantity * forceResult.executedPrice;
      
      // For short positions (long cascades), profit = entry - exit
      // For long positions (short cascades), profit = exit - entry
      const profit = execution.entrySignal.side === 'sell'
        ? entryValue - exitValue
        : exitValue - entryValue;
      
      // Subtract fees
      const netProfit = profit - execution.entryResult.fees - forceResult.fees;
      
      // Calculate profit percentage
      const profitPercentage = (netProfit / entryValue) * 100;
      
      // Update force result
      forceResult.pnl = netProfit;
      
      // Save result to database
      const resultDoc = new ExecutionResultModel(forceResult);
      await resultDoc.save();
      
      // Update execution
      execution.exitResult = forceResult;
      execution.status = 'exited';
      execution.actualProfit = netProfit;
      execution.profitPercentage = profitPercentage;
      execution.completedAt = new Date();
      
      console.log(`✅ FORCED EXIT EXECUTED: ${execution.id}`);
      console.log(`📊 ${forceSignal.side} ${execution.prediction.asset} at $${forceResult.executedPrice}`);
      console.log(`💰 Profit/Loss: $${netProfit.toFixed(2)} (${profitPercentage.toFixed(2)}%)`);
      
      // Move to completed executions
      this.completedExecutions.push(execution);
      this.activeExecutions.delete(execution.id);
      
      // Emit force exit event
      this.emit('cascadeForceExitExecuted', {
        execution,
        exitPrice: forceResult.executedPrice,
        profit: netProfit,
        profitPercentage,
        executedAt: forceResult.executedAt
      });
      
    } catch (error) {
      console.error(`❌ FORCE EXIT ERROR: ${error}`);
      
      // Update execution status
      execution.status = 'failed';
      
      // Emit failure event
      this.emit('cascadeExecutionFailed', {
        execution,
        error,
        stage: 'force_exit'
      });
    }
  }

  /**
   * 📊 GET EXECUTION STATISTICS
   */
  getExecutionStats(): any {
    // Calculate success rate
    const successfulExecutions = this.completedExecutions.filter(e => 
      e.status === 'exited' && e.actualProfit > 0
    );
    
    const successRate = this.completedExecutions.length > 0
      ? successfulExecutions.length / this.completedExecutions.length
      : 0;
    
    // Calculate average profit
    const avgProfit = successfulExecutions.length > 0
      ? successfulExecutions.reduce((sum, e) => sum + e.actualProfit, 0) / successfulExecutions.length
      : 0;
    
    // Calculate average profit percentage
    const avgProfitPercentage = successfulExecutions.length > 0
      ? successfulExecutions.reduce((sum, e) => sum + e.profitPercentage, 0) / successfulExecutions.length
      : 0;
    
    return {
      activeExecutions: this.activeExecutions.size,
      completedExecutions: this.completedExecutions.length,
      successfulExecutions: successfulExecutions.length,
      successRate: successRate * 100,
      avgProfit,
      avgProfitPercentage,
      totalProfit: this.completedExecutions.reduce((sum, e) => sum + e.actualProfit, 0),
      isActive: this.isActive,
      
      // Status breakdown
      statusBreakdown: {
        pending: Array.from(this.activeExecutions.values()).filter(e => e.status === 'pending').length,
        entered: Array.from(this.activeExecutions.values()).filter(e => e.status === 'entered').length,
        exited: this.completedExecutions.filter(e => e.status === 'exited').length,
        failed: this.completedExecutions.filter(e => e.status === 'failed').length
      },
      
      // Recent executions
      recentExecutions: this.completedExecutions
        .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
        .slice(0, 5)
        .map(e => ({
          asset: e.prediction.asset,
          side: e.prediction.side,
          profit: e.actualProfit,
          profitPercentage: e.profitPercentage,
          completedAt: e.completedAt
        }))
    };
  }

  /**
   * 🛑 STOP MOMENTUM ENGINE
   */
  stopMomentumEngine(): void {
    console.log('🛑 STOPPING CASCADE MOMENTUM ENGINE...');
    
    this.isActive = false;
    
    // Force exit all active positions
    for (const execution of this.activeExecutions.values()) {
      if (execution.status === 'entered') {
        this.forceExit(execution);
      }
    }
    
    console.log('🛑 CASCADE MOMENTUM ENGINE STOPPED');
  }
}

export default CascadeMomentumEngine;
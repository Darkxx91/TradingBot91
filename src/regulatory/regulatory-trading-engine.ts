// ULTIMATE TRADING EMPIRE - REGULATORY TRADING ENGINE
// Execute trades based on regulatory news with 30-60 second edge

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import ExchangeManager from '../exchanges/exchange-manager';
import RegulatoryMonitor, { RegulatoryEvent, RegulatoryCalendarEvent } from './regulatory-monitor';
import RegulatoryAnalyzer, { RegulatoryAnalysis } from './regulatory-analyzer';
import { TradeSignal } from '../types/core';

export interface RegulatoryTrade {
  id: string;
  regulatoryEvent: RegulatoryEvent;
  analysis: RegulatoryAnalysis;
  tradeSignal: TradeSignal;
  executed: boolean;
  entryPrice?: number;
  exitPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
  status: 'pending' | 'executed' | 'closed' | 'cancelled';
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define event types for TypeScript
declare interface RegulatoryTradingEngine {
  on(event: 'tradeSignal', listener: (signal: TradeSignal) => void): this;
  on(event: 'tradeExecuted', listener: (trade: RegulatoryTrade) => void): this;
  on(event: 'tradeClosed', listener: (trade: RegulatoryTrade) => void): this;
  emit(event: 'tradeSignal', signal: TradeSignal): boolean;
  emit(event: 'tradeExecuted', trade: RegulatoryTrade): boolean;
  emit(event: 'tradeClosed', trade: RegulatoryTrade): boolean;
}

export class RegulatoryTradingEngine extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private regulatoryMonitor: RegulatoryMonitor;
  private regulatoryAnalyzer: RegulatoryAnalyzer;
  private activeTrades: Map<string, RegulatoryTrade> = new Map();
  private completedTrades: RegulatoryTrade[] = [];
  private isRunning: boolean = false;
  private minConfidence: number = 0.7; // Minimum confidence to execute a trade
  private maxActiveTrades: number = 5; // Maximum number of active trades
  private riskPerTrade: number = 0.02; // 2% risk per trade
  private accountBalance: number = 1000; // Default account balance
  private accountId: string = 'default'; // Default account ID
  private executionSpeedMs: number = 0; // How fast we execute trades (0 = immediate)

  constructor(
    exchangeManager: ExchangeManager,
    regulatoryMonitor: RegulatoryMonitor,
    regulatoryAnalyzer: RegulatoryAnalyzer
  ) {
    super();
    this.exchangeManager = exchangeManager;
    this.regulatoryMonitor = regulatoryMonitor;
    this.regulatoryAnalyzer = regulatoryAnalyzer;
  }

  /**
   * 🚀 START TRADING ENGINE
   */
  async start(accountId: string, accountBalance: number): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Regulatory trading engine already running');
      return;
    }

    console.log('🚀 STARTING REGULATORY TRADING ENGINE...');
    
    // Set account details
    this.accountId = accountId;
    this.accountBalance = accountBalance;
    
    // Listen for regulatory events
    this.listenForRegulatoryEvents();
    
    // Start monitoring active trades
    this.startTradeMonitoring();
    
    this.isRunning = true;
    console.log('📊 REGULATORY TRADING ENGINE ACTIVE!');
  }

  /**
   * 📡 LISTEN FOR REGULATORY EVENTS
   */
  private listenForRegulatoryEvents(): void {
    // Listen for new regulatory events
    this.regulatoryMonitor.on('regulatoryEvent', async (event: RegulatoryEvent) => {
      try {
        // Analyze the event
        const analysis = await this.regulatoryAnalyzer.analyzeRegulatoryEvent(event);
        
        // Process the analysis for trading opportunities
        this.processRegulatoryAnalysis(analysis);
      } catch (error) {
        console.error('Error processing regulatory event:', error);
      }
    });
    
    // Listen for calendar updates
    this.regulatoryMonitor.on('calendarUpdate', (events: RegulatoryCalendarEvent[]) => {
      console.log(`📅 RECEIVED ${events.length} CALENDAR EVENTS`);
      // In a real implementation, we would prepare for scheduled events
    });
  }

  /**
   * 📊 PROCESS REGULATORY ANALYSIS
   */
  private async processRegulatoryAnalysis(analysis: RegulatoryAnalysis): Promise<void> {
    console.log(`📊 PROCESSING REGULATORY ANALYSIS: ${analysis.regulatoryEvent.title}`);
    
    // Check if we can take more trades
    if (this.activeTrades.size >= this.maxActiveTrades) {
      console.log(`⚠️ Maximum active trades (${this.maxActiveTrades}) reached, skipping opportunity`);
      return;
    }
    
    // Process each trading signal from the analysis
    for (const signal of analysis.tradingSignals) {
      // Skip if confidence is too low
      if (signal.confidence < this.minConfidence) {
        console.log(`⚠️ Signal confidence (${signal.confidence.toFixed(2)}) below threshold (${this.minConfidence}), skipping`);
        continue;
      }
      
      // Skip if strength is too low
      if (signal.strength < 0.3) {
        console.log(`⚠️ Signal strength (${signal.strength.toFixed(2)}) too low, skipping`);
        continue;
      }
      
      // Get current price
      const prices = await this.exchangeManager.getExchangePrices(signal.asset);
      const currentPrice = Array.from(prices.values())[0] || 0;
      
      if (currentPrice === 0) {
        console.log(`⚠️ Could not get price for ${signal.asset}, skipping`);
        continue;
      }
      
      // Calculate position size based on risk
      const positionSize = this.calculatePositionSize(signal.asset, currentPrice, signal.confidence);
      
      // Determine trade direction
      const side = signal.direction === 'buy' ? 'buy' : 'sell';
      
      // Determine trade urgency based on timeframe
      const urgency = signal.timeframe === 'immediate' ? 'critical' : 
                     signal.timeframe === 'short' ? 'high' : 'medium';
      
      // Calculate stop loss and take profit
      const stopLossPercent = 0.05; // 5% stop loss
      const takeProfitPercent = signal.strength * 0.1; // 3-10% take profit based on strength
      
      const stopLoss = side === 'buy' 
        ? currentPrice * (1 - stopLossPercent)
        : currentPrice * (1 + stopLossPercent);
        
      const takeProfit = side === 'buy'
        ? currentPrice * (1 + takeProfitPercent)
        : currentPrice * (1 - takeProfitPercent);
      
      // Create trade signal
      const tradeSignal: TradeSignal = {
        id: uuidv4(),
        strategyType: 'regulatory-frontrun',
        account: this.accountId,
        asset: signal.asset,
        side,
        quantity: positionSize,
        price: currentPrice,
        orderType: 'market',
        leverage: 1, // No leverage by default
        stopLoss,
        takeProfit,
        confidence: signal.confidence,
        urgency,
        executionDeadline: new Date(Date.now() + 60000), // 1 minute deadline
        expectedProfit: Math.abs(takeProfit - currentPrice) * positionSize,
        maxRisk: Math.abs(stopLoss - currentPrice) * positionSize,
        createdAt: new Date()
      };
      
      // Create trade object
      const trade: RegulatoryTrade = {
        id: uuidv4(),
        regulatoryEvent: analysis.regulatoryEvent,
        analysis,
        tradeSignal,
        executed: false,
        status: 'pending',
        notes: [`Created based on ${analysis.regulatoryEvent.source} ${analysis.regulatoryEvent.contentType}`],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store trade
      this.activeTrades.set(trade.id, trade);
      
      // Emit trade signal
      this.emit('tradeSignal', tradeSignal);
      
      console.log(`📊 REGULATORY TRADE SIGNAL: ${side.toUpperCase()} ${signal.asset} @ ${currentPrice.toFixed(2)}`);
      console.log(`📊 Confidence: ${signal.confidence.toFixed(2)}, Strength: ${signal.strength.toFixed(2)}`);
      
      // Execute trade after delay (simulating execution time)
      setTimeout(() => {
        this.executeTrade(trade);
      }, this.executionSpeedMs);
    }
  }

  /**
   * 💰 CALCULATE POSITION SIZE
   */
  private calculatePositionSize(asset: string, price: number, confidence: number): number {
    // Calculate risk amount
    const riskAmount = this.accountBalance * this.riskPerTrade;
    
    // Calculate stop loss distance (5% of price)
    const stopDistance = price * 0.05;
    
    // Calculate position size based on risk
    const positionSize = riskAmount / stopDistance;
    
    // Adjust position size based on confidence
    const confidenceAdjustment = 0.5 + (confidence * 0.5); // 0.5-1.0 based on confidence
    
    return positionSize * confidenceAdjustment;
  }

  /**
   * 💰 EXECUTE TRADE
   */
  private async executeTrade(trade: RegulatoryTrade): Promise<void> {
    try {
      console.log(`💰 EXECUTING REGULATORY TRADE: ${trade.tradeSignal.side.toUpperCase()} ${trade.tradeSignal.asset}`);
      
      // In a real implementation, this would execute the trade through the exchange
      // For now, we'll simulate execution
      
      // Get current price
      const prices = await this.exchangeManager.getExchangePrices(trade.tradeSignal.asset);
      const currentPrice = Array.from(prices.values())[0] || trade.tradeSignal.price;
      
      // Update trade
      trade.executed = true;
      trade.entryPrice = currentPrice;
      trade.status = 'executed';
      trade.notes.push(`Executed at ${currentPrice.toFixed(2)}`);
      trade.updatedAt = new Date();
      
      // Emit trade executed event
      this.emit('tradeExecuted', trade);
      
      console.log(`✅ REGULATORY TRADE EXECUTED: ${trade.tradeSignal.side.toUpperCase()} ${trade.tradeSignal.asset} @ ${currentPrice.toFixed(2)}`);
      
    } catch (error) {
      console.error(`Error executing trade ${trade.id}:`, error);
      
      // Update trade status
      trade.status = 'cancelled';
      trade.notes.push(`Execution failed: ${error}`);
      trade.updatedAt = new Date();
    }
  }

  /**
   * 🔄 START TRADE MONITORING
   */
  private startTradeMonitoring(): void {
    // Check active trades every 10 seconds
    global.setInterval(() => {
      this.monitorActiveTrades();
    }, 10000);
  }

  /**
   * 📊 MONITOR ACTIVE TRADES
   */
  private async monitorActiveTrades(): Promise<void> {
    if (this.activeTrades.size === 0) return;
    
    console.log(`📊 MONITORING ${this.activeTrades.size} ACTIVE REGULATORY TRADES...`);
    
    for (const [tradeId, trade] of this.activeTrades.entries()) {
      try {
        // Skip trades that are not executed or already closed
        if (!trade.executed || trade.status === 'closed' || trade.status === 'cancelled') continue;
        
        // Get current price
        const prices = await this.exchangeManager.getExchangePrices(trade.tradeSignal.asset);
        const currentPrice = Array.from(prices.values())[0] || 0;
        
        if (currentPrice === 0) continue;
        
        // Check if stop loss or take profit hit
        const stopLoss = trade.tradeSignal.stopLoss!;
        const takeProfit = trade.tradeSignal.takeProfit!;
        const side = trade.tradeSignal.side;
        
        const stopLossHit = side === 'buy' 
          ? currentPrice <= stopLoss
          : currentPrice >= stopLoss;
          
        const takeProfitHit = side === 'buy'
          ? currentPrice >= takeProfit
          : currentPrice <= takeProfit;
        
        // Check if we should close the trade
        if (stopLossHit || takeProfitHit) {
          // Close trade
          trade.status = 'closed';
          trade.exitPrice = currentPrice;
          
          // Calculate P&L
          const entryPrice = trade.entryPrice!;
          const exitPrice = currentPrice;
          const quantity = trade.tradeSignal.quantity;
          
          if (side === 'buy') {
            trade.pnl = (exitPrice - entryPrice) * quantity;
            trade.pnlPercentage = (exitPrice - entryPrice) / entryPrice * 100;
          } else {
            trade.pnl = (entryPrice - exitPrice) * quantity;
            trade.pnlPercentage = (entryPrice - exitPrice) / entryPrice * 100;
          }
          
          // Add note
          if (stopLossHit) {
            trade.notes.push(`Closed at ${currentPrice.toFixed(2)} - Stop loss hit`);
          } else {
            trade.notes.push(`Closed at ${currentPrice.toFixed(2)} - Take profit hit`);
          }
          
          trade.updatedAt = new Date();
          
          // Move to completed trades
          this.completedTrades.push(trade);
          this.activeTrades.delete(tradeId);
          
          // Emit trade closed event
          this.emit('tradeClosed', trade);
          
          console.log(`✅ REGULATORY TRADE CLOSED: ${trade.tradeSignal.asset}`);
          console.log(`📊 P&L: ${trade.pnl.toFixed(2)} (${trade.pnlPercentage.toFixed(2)}%)`);
        }
      } catch (error) {
        console.error(`Error monitoring trade ${tradeId}:`, error);
      }
    }
  }

  /**
   * 📊 GET TRADE STATISTICS
   */
  getTradeStats(): any {
    // Count trades by status
    const pendingTrades = Array.from(this.activeTrades.values()).filter(t => t.status === 'pending').length;
    const executedTrades = Array.from(this.activeTrades.values()).filter(t => t.status === 'executed').length;
    const completedTrades = this.completedTrades.length;
    const cancelledTrades = Array.from(this.activeTrades.values()).filter(t => t.status === 'cancelled').length;
    
    // Calculate win rate
    const winningTrades = this.completedTrades.filter(t => t.pnl! > 0).length;
    const winRate = completedTrades > 0 ? winningTrades / completedTrades : 0;
    
    // Calculate average P&L
    const totalPnl = this.completedTrades.reduce((sum, t) => sum + t.pnl!, 0);
    const avgPnl = completedTrades > 0 ? totalPnl / completedTrades : 0;
    
    // Calculate average P&L percentage
    const totalPnlPercentage = this.completedTrades.reduce((sum, t) => sum + t.pnlPercentage!, 0);
    const avgPnlPercentage = completedTrades > 0 ? totalPnlPercentage / completedTrades : 0;
    
    return {
      totalTrades: pendingTrades + executedTrades + completedTrades + cancelledTrades,
      pendingTrades,
      executedTrades,
      completedTrades,
      cancelledTrades,
      winningTrades,
      losingTrades: completedTrades - winningTrades,
      winRate,
      totalPnl,
      avgPnl,
      avgPnlPercentage,
      isRunning: this.isRunning,
      minConfidence: this.minConfidence,
      maxActiveTrades: this.maxActiveTrades,
      riskPerTrade: this.riskPerTrade,
      accountBalance: this.accountBalance,
      accountId: this.accountId,
      executionSpeedMs: this.executionSpeedMs
    };
  }

  /**
   * ⚙️ UPDATE CONFIGURATION
   */
  updateConfig(config: {
    minConfidence?: number;
    maxActiveTrades?: number;
    riskPerTrade?: number;
    accountBalance?: number;
    executionSpeedMs?: number;
  }): void {
    if (config.minConfidence !== undefined) {
      this.minConfidence = config.minConfidence;
      console.log(`⚙️ Updated minimum confidence: ${this.minConfidence}`);
    }
    
    if (config.maxActiveTrades !== undefined) {
      this.maxActiveTrades = config.maxActiveTrades;
      console.log(`⚙️ Updated maximum active trades: ${this.maxActiveTrades}`);
    }
    
    if (config.riskPerTrade !== undefined) {
      this.riskPerTrade = config.riskPerTrade;
      console.log(`⚙️ Updated risk per trade: ${this.riskPerTrade}`);
    }
    
    if (config.accountBalance !== undefined) {
      this.accountBalance = config.accountBalance;
      console.log(`⚙️ Updated account balance: ${this.accountBalance}`);
    }
    
    if (config.executionSpeedMs !== undefined) {
      this.executionSpeedMs = config.executionSpeedMs;
      console.log(`⚙️ Updated execution speed: ${this.executionSpeedMs}ms`);
    }
  }

  /**
   * 🛑 STOP TRADING ENGINE
   */
  stop(): void {
    console.log('🛑 STOPPING REGULATORY TRADING ENGINE...');
    
    this.isRunning = false;
    
    console.log('🛑 REGULATORY TRADING ENGINE STOPPED');
  }
}

export default RegulatoryTradingEngine;
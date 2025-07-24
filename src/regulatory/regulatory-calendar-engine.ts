// ULTIMATE TRADING EMPIRE - REGULATORY CALENDAR ENGINE
// Position for scheduled volatility events before they happen

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import ExchangeManager from '../exchanges/exchange-manager';
import RegulatoryMonitor, { RegulatoryCalendarEvent, RegulatorySource, RegulatoryContentType } from './regulatory-monitor';
import { TradeSignal } from '../types/core';

export interface CalendarTrade {
  id: string;
  calendarEvent: RegulatoryCalendarEvent;
  preEventSignal: TradeSignal;
  postEventSignal: TradeSignal | null;
  preEventExecuted: boolean;
  postEventExecuted: boolean;
  preEventPrice?: number;
  postEventPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
  status: 'pending' | 'pre_positioned' | 'event_occurred' | 'completed' | 'cancelled';
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define event types for TypeScript
declare interface RegulatoryCalendarEngine {
  on(event: 'calendarTradeSignal', listener: (signal: TradeSignal) => void): this;
  on(event: 'preEventPosition', listener: (trade: CalendarTrade) => void): this;
  on(event: 'postEventExit', listener: (trade: CalendarTrade) => void): this;
  on(event: 'tradeCompleted', listener: (trade: CalendarTrade) => void): this;
  emit(event: 'calendarTradeSignal', signal: TradeSignal): boolean;
  emit(event: 'preEventPosition', trade: CalendarTrade): boolean;
  emit(event: 'postEventExit', trade: CalendarTrade): boolean;
  emit(event: 'tradeCompleted', trade: CalendarTrade): boolean;
}

export class RegulatoryCalendarEngine extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private regulatoryMonitor: RegulatoryMonitor;
  private activeTrades: Map<string, CalendarTrade> = new Map();
  private completedTrades: CalendarTrade[] = [];
  private isRunning: boolean = false;
  private minImportance: number = 0.7; // Minimum importance to trade
  private maxActiveTrades: number = 10; // Maximum number of active calendar trades
  private riskPerTrade: number = 0.03; // 3% risk per trade
  private accountBalance: number = 1000; // Default account balance
  private accountId: string = 'default'; // Default account ID
  private preEventHours: number = 2; // Hours before event to position
  private postEventMinutes: number = 30; // Minutes after event to exit

  constructor(
    exchangeManager: ExchangeManager,
    regulatoryMonitor: RegulatoryMonitor
  ) {
    super();
    this.exchangeManager = exchangeManager;
    this.regulatoryMonitor = regulatoryMonitor;
  }

  /**
   * 🚀 START CALENDAR ENGINE
   */
  async start(accountId: string, accountBalance: number): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Regulatory calendar engine already running');
      return;
    }

    console.log('🚀 STARTING REGULATORY CALENDAR ENGINE...');
    
    // Set account details
    this.accountId = accountId;
    this.accountBalance = accountBalance;
    
    // Listen for calendar updates
    this.listenForCalendarUpdates();
    
    // Start monitoring scheduled events
    this.startEventMonitoring();
    
    // Start monitoring active trades
    this.startTradeMonitoring();
    
    this.isRunning = true;
    console.log('📊 REGULATORY CALENDAR ENGINE ACTIVE!');
  }

  /**
   * 📡 LISTEN FOR CALENDAR UPDATES
   */
  private listenForCalendarUpdates(): void {
    this.regulatoryMonitor.on('calendarUpdate', (events: RegulatoryCalendarEvent[]) => {
      console.log(`📅 RECEIVED ${events.length} CALENDAR EVENTS`);
      this.processCalendarEvents(events);
    });
  }

  /**
   * 📅 PROCESS CALENDAR EVENTS
   */
  private processCalendarEvents(events: RegulatoryCalendarEvent[]): void {
    events.forEach(event => {
      // Skip if importance is too low
      if (event.importance < this.minImportance) {
        console.log(`⚠️ Event importance (${event.importance.toFixed(2)}) below threshold (${this.minImportance}), skipping`);
        return;
      }
      
      // Skip if we already have a trade for this event
      const existingTrade = Array.from(this.activeTrades.values()).find(trade => 
        trade.calendarEvent.id === event.id
      );
      
      if (existingTrade) {
        console.log(`⚠️ Already have trade for event ${event.title}, skipping`);
        return;
      }
      
      // Check if we can take more trades
      if (this.activeTrades.size >= this.maxActiveTrades) {
        console.log(`⚠️ Maximum active trades (${this.maxActiveTrades}) reached, skipping event`);
        return;
      }
      
      // Create calendar trade
      this.createCalendarTrade(event);
    });
  }

  /**
   * 💰 CREATE CALENDAR TRADE
   */
  private async createCalendarTrade(event: RegulatoryCalendarEvent): Promise<void> {
    try {
      console.log(`💰 CREATING CALENDAR TRADE FOR: ${event.title}`);
      
      // Determine primary affected asset
      const primaryAsset = event.affectedAssets[0] || 'BTC/USDT';
      
      // Get current price
      const prices = await this.exchangeManager.getExchangePrices(primaryAsset);
      const currentPrice = Array.from(prices.values())[0] || 0;
      
      if (currentPrice === 0) {
        console.log(`⚠️ Could not get price for ${primaryAsset}, skipping event`);
        return;
      }
      
      // Calculate position size
      const positionSize = this.calculatePositionSize(primaryAsset, currentPrice, event.importance);
      
      // Determine trade direction based on expected impact
      const side = event.expectedImpact > 0 ? 'buy' : 'sell';
      
      // Calculate pre-event positioning time
      const preEventTime = new Date(event.scheduledAt.getTime() - (this.preEventHours * 60 * 60 * 1000));
      
      // Calculate post-event exit time
      const postEventTime = new Date(event.scheduledAt.getTime() + (this.postEventMinutes * 60 * 1000));
      
      // Calculate expected volatility multiplier
      const volatilityMultiplier = this.calculateVolatilityMultiplier(event);
      
      // Calculate stop loss and take profit
      const stopLossPercent = 0.03; // 3% stop loss
      const takeProfitPercent = volatilityMultiplier * 0.05; // 2-10% take profit based on expected volatility
      
      const stopLoss = side === 'buy' 
        ? currentPrice * (1 - stopLossPercent)
        : currentPrice * (1 + stopLossPercent);
        
      const takeProfit = side === 'buy'
        ? currentPrice * (1 + takeProfitPercent)
        : currentPrice * (1 - takeProfitPercent);
      
      // Create pre-event signal
      const preEventSignal: TradeSignal = {
        id: uuidv4(),
        strategyType: 'regulatory-calendar',
        account: this.accountId,
        asset: primaryAsset,
        side,
        quantity: positionSize,
        price: currentPrice,
        orderType: 'market',
        leverage: 1, // No leverage by default
        stopLoss,
        takeProfit,
        confidence: event.confidence,
        urgency: 'medium',
        executionDeadline: preEventTime,
        expectedProfit: Math.abs(takeProfit - currentPrice) * positionSize,
        maxRisk: Math.abs(stopLoss - currentPrice) * positionSize,
        createdAt: new Date()
      };
      
      // Create post-event signal (opposite direction)
      const postEventSignal: TradeSignal = {
        id: uuidv4(),
        strategyType: 'regulatory-calendar',
        account: this.accountId,
        asset: primaryAsset,
        side: side === 'buy' ? 'sell' : 'buy',
        quantity: positionSize,
        orderType: 'market',
        leverage: 1,
        confidence: event.confidence,
        urgency: 'high',
        executionDeadline: postEventTime,
        expectedProfit: 0, // Will be calculated when executed
        maxRisk: 0,
        createdAt: new Date()
      };
      
      // Create calendar trade
      const trade: CalendarTrade = {
        id: uuidv4(),
        calendarEvent: event,
        preEventSignal,
        postEventSignal,
        preEventExecuted: false,
        postEventExecuted: false,
        status: 'pending',
        notes: [`Created for ${event.eventType} scheduled at ${event.scheduledAt.toLocaleString()}`],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store trade
      this.activeTrades.set(trade.id, trade);
      
      console.log(`📊 CALENDAR TRADE CREATED: ${side.toUpperCase()} ${primaryAsset} before ${event.title}`);
      console.log(`📊 Pre-event time: ${preEventTime.toLocaleString()}, Post-event time: ${postEventTime.toLocaleString()}`);
      
    } catch (error) {
      console.error('Error creating calendar trade:', error);
    }
  }

  /**
   * 💰 CALCULATE POSITION SIZE
   */
  private calculatePositionSize(asset: string, price: number, importance: number): number {
    // Calculate risk amount
    const riskAmount = this.accountBalance * this.riskPerTrade;
    
    // Calculate stop loss distance (3% of price)
    const stopDistance = price * 0.03;
    
    // Calculate position size based on risk
    const positionSize = riskAmount / stopDistance;
    
    // Adjust position size based on importance
    const importanceAdjustment = 0.5 + (importance * 0.5); // 0.5-1.0 based on importance
    
    return positionSize * importanceAdjustment;
  }

  /**
   * 📊 CALCULATE VOLATILITY MULTIPLIER
   */
  private calculateVolatilityMultiplier(event: RegulatoryCalendarEvent): number {
    let multiplier = 1.0;
    
    // Adjust based on event type
    switch (event.eventType) {
      case RegulatoryContentType.RATE_DECISION:
        multiplier = 2.0; // Rate decisions create high volatility
        break;
      case RegulatoryContentType.ENFORCEMENT_ACTION:
        multiplier = 1.8; // Enforcement actions create significant volatility
        break;
      case RegulatoryContentType.RULE_CHANGE:
        multiplier = 1.5; // Rule changes create moderate volatility
        break;
      case RegulatoryContentType.SPEECH:
      case RegulatoryContentType.TESTIMONY:
        multiplier = 1.3; // Speeches create some volatility
        break;
      default:
        multiplier = 1.0; // Default volatility
    }
    
    // Adjust based on source
    switch (event.source) {
      case RegulatorySource.FED:
        multiplier *= 1.5; // Fed events have higher impact
        break;
      case RegulatorySource.SEC:
      case RegulatorySource.CFTC:
        multiplier *= 1.3; // SEC/CFTC events have significant impact on crypto
        break;
      case RegulatorySource.ECB:
        multiplier *= 1.2; // ECB events have moderate impact
        break;
    }
    
    // Adjust based on importance
    multiplier *= event.importance;
    
    return Math.min(2.0, multiplier); // Cap at 2.0x
  }

  /**
   * 🔄 START EVENT MONITORING
   */
  private startEventMonitoring(): void {
    // Check for upcoming events every minute
    global.setInterval(() => {
      this.checkUpcomingEvents();
    }, 60000); // Every minute
  }

  /**
   * 📅 CHECK UPCOMING EVENTS
   */
  private checkUpcomingEvents(): void {
    const now = new Date();
    
    for (const [tradeId, trade] of this.activeTrades.entries()) {
      // Skip if already executed or cancelled
      if (trade.status === 'completed' || trade.status === 'cancelled') continue;
      
      const preEventTime = trade.preEventSignal.executionDeadline;
      const eventTime = trade.calendarEvent.scheduledAt;
      const postEventTime = trade.postEventSignal?.executionDeadline;
      
      // Check if it's time for pre-event positioning
      if (!trade.preEventExecuted && now >= preEventTime) {
        this.executePreEventPosition(trade);
      }
      
      // Check if event has occurred and it's time for post-event exit
      if (trade.preEventExecuted && !trade.postEventExecuted && postEventTime && now >= postEventTime) {
        this.executePostEventExit(trade);
      }
    }
  }

  /**
   * 💰 EXECUTE PRE-EVENT POSITION
   */
  private async executePreEventPosition(trade: CalendarTrade): Promise<void> {
    try {
      console.log(`💰 EXECUTING PRE-EVENT POSITION: ${trade.preEventSignal.side.toUpperCase()} ${trade.preEventSignal.asset}`);
      
      // Get current price
      const prices = await this.exchangeManager.getExchangePrices(trade.preEventSignal.asset);
      const currentPrice = Array.from(prices.values())[0] || trade.preEventSignal.price;
      
      // Update trade
      trade.preEventExecuted = true;
      trade.preEventPrice = currentPrice;
      trade.status = 'pre_positioned';
      trade.notes.push(`Pre-event position executed at ${currentPrice.toFixed(2)}`);
      trade.updatedAt = new Date();
      
      // Emit trade signal
      this.emit('calendarTradeSignal', trade.preEventSignal);
      
      // Emit pre-event position event
      this.emit('preEventPosition', trade);
      
      console.log(`✅ PRE-EVENT POSITION EXECUTED: ${trade.preEventSignal.side.toUpperCase()} ${trade.preEventSignal.asset} @ ${currentPrice.toFixed(2)}`);
      
    } catch (error) {
      console.error(`Error executing pre-event position for trade ${trade.id}:`, error);
      
      // Update trade status
      trade.status = 'cancelled';
      trade.notes.push(`Pre-event execution failed: ${error}`);
      trade.updatedAt = new Date();
    }
  }

  /**
   * 💰 EXECUTE POST-EVENT EXIT
   */
  private async executePostEventExit(trade: CalendarTrade): Promise<void> {
    try {
      console.log(`💰 EXECUTING POST-EVENT EXIT: ${trade.postEventSignal?.side.toUpperCase()} ${trade.preEventSignal.asset}`);
      
      // Get current price
      const prices = await this.exchangeManager.getExchangePrices(trade.preEventSignal.asset);
      const currentPrice = Array.from(prices.values())[0] || 0;
      
      if (currentPrice === 0) {
        console.log(`⚠️ Could not get price for ${trade.preEventSignal.asset}, skipping exit`);
        return;
      }
      
      // Update trade
      trade.postEventExecuted = true;
      trade.postEventPrice = currentPrice;
      trade.status = 'completed';
      
      // Calculate P&L
      const entryPrice = trade.preEventPrice!;
      const exitPrice = currentPrice;
      const quantity = trade.preEventSignal.quantity;
      const side = trade.preEventSignal.side;
      
      if (side === 'buy') {
        trade.pnl = (exitPrice - entryPrice) * quantity;
        trade.pnlPercentage = (exitPrice - entryPrice) / entryPrice * 100;
      } else {
        trade.pnl = (entryPrice - exitPrice) * quantity;
        trade.pnlPercentage = (entryPrice - exitPrice) / entryPrice * 100;
      }
      
      trade.notes.push(`Post-event exit executed at ${currentPrice.toFixed(2)}`);
      trade.updatedAt = new Date();
      
      // Emit trade signal
      if (trade.postEventSignal) {
        trade.postEventSignal.price = currentPrice;
        this.emit('calendarTradeSignal', trade.postEventSignal);
      }
      
      // Emit post-event exit event
      this.emit('postEventExit', trade);
      
      // Move to completed trades
      this.completedTrades.push(trade);
      this.activeTrades.delete(trade.id);
      
      // Emit trade completed event
      this.emit('tradeCompleted', trade);
      
      console.log(`✅ CALENDAR TRADE COMPLETED: ${trade.preEventSignal.asset}`);
      console.log(`📊 P&L: ${trade.pnl.toFixed(2)} (${trade.pnlPercentage.toFixed(2)}%)`);
      
    } catch (error) {
      console.error(`Error executing post-event exit for trade ${trade.id}:`, error);
      
      // Update trade status
      trade.status = 'cancelled';
      trade.notes.push(`Post-event exit failed: ${error}`);
      trade.updatedAt = new Date();
    }
  }

  /**
   * 🔄 START TRADE MONITORING
   */
  private startTradeMonitoring(): void {
    // Check active trades every 30 seconds
    global.setInterval(() => {
      this.monitorActiveTrades();
    }, 30000);
  }

  /**
   * 📊 MONITOR ACTIVE TRADES
   */
  private async monitorActiveTrades(): Promise<void> {
    if (this.activeTrades.size === 0) return;
    
    console.log(`📊 MONITORING ${this.activeTrades.size} ACTIVE CALENDAR TRADES...`);
    
    for (const [tradeId, trade] of this.activeTrades.entries()) {
      try {
        // Skip trades that are not pre-positioned or already completed
        if (trade.status !== 'pre_positioned' || trade.status === 'completed' || trade.status === 'cancelled') continue;
        
        // Get current price
        const prices = await this.exchangeManager.getExchangePrices(trade.preEventSignal.asset);
        const currentPrice = Array.from(prices.values())[0] || 0;
        
        if (currentPrice === 0) continue;
        
        // Check if stop loss or take profit hit
        const stopLoss = trade.preEventSignal.stopLoss!;
        const takeProfit = trade.preEventSignal.takeProfit!;
        const side = trade.preEventSignal.side;
        
        const stopLossHit = side === 'buy' 
          ? currentPrice <= stopLoss
          : currentPrice >= stopLoss;
          
        const takeProfitHit = side === 'buy'
          ? currentPrice >= takeProfit
          : currentPrice <= takeProfit;
        
        // Check if we should close the trade early
        if (stopLossHit || takeProfitHit) {
          // Close trade early
          trade.postEventExecuted = true;
          trade.postEventPrice = currentPrice;
          trade.status = 'completed';
          
          // Calculate P&L
          const entryPrice = trade.preEventPrice!;
          const exitPrice = currentPrice;
          const quantity = trade.preEventSignal.quantity;
          
          if (side === 'buy') {
            trade.pnl = (exitPrice - entryPrice) * quantity;
            trade.pnlPercentage = (exitPrice - entryPrice) / entryPrice * 100;
          } else {
            trade.pnl = (entryPrice - exitPrice) * quantity;
            trade.pnlPercentage = (entryPrice - exitPrice) / entryPrice * 100;
          }
          
          // Add note
          if (stopLossHit) {
            trade.notes.push(`Closed early at ${currentPrice.toFixed(2)} - Stop loss hit`);
          } else {
            trade.notes.push(`Closed early at ${currentPrice.toFixed(2)} - Take profit hit`);
          }
          
          trade.updatedAt = new Date();
          
          // Move to completed trades
          this.completedTrades.push(trade);
          this.activeTrades.delete(tradeId);
          
          // Emit trade completed event
          this.emit('tradeCompleted', trade);
          
          console.log(`✅ CALENDAR TRADE CLOSED EARLY: ${trade.preEventSignal.asset}`);
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
    const prePositionedTrades = Array.from(this.activeTrades.values()).filter(t => t.status === 'pre_positioned').length;
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
      totalTrades: pendingTrades + prePositionedTrades + completedTrades + cancelledTrades,
      pendingTrades,
      prePositionedTrades,
      completedTrades,
      cancelledTrades,
      winningTrades,
      losingTrades: completedTrades - winningTrades,
      winRate,
      totalPnl,
      avgPnl,
      avgPnlPercentage,
      isRunning: this.isRunning,
      minImportance: this.minImportance,
      maxActiveTrades: this.maxActiveTrades,
      riskPerTrade: this.riskPerTrade,
      accountBalance: this.accountBalance,
      accountId: this.accountId,
      preEventHours: this.preEventHours,
      postEventMinutes: this.postEventMinutes
    };
  }

  /**
   * ⚙️ UPDATE CONFIGURATION
   */
  updateConfig(config: {
    minImportance?: number;
    maxActiveTrades?: number;
    riskPerTrade?: number;
    accountBalance?: number;
    preEventHours?: number;
    postEventMinutes?: number;
  }): void {
    if (config.minImportance !== undefined) {
      this.minImportance = config.minImportance;
      console.log(`⚙️ Updated minimum importance: ${this.minImportance}`);
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
    
    if (config.preEventHours !== undefined) {
      this.preEventHours = config.preEventHours;
      console.log(`⚙️ Updated pre-event hours: ${this.preEventHours}`);
    }
    
    if (config.postEventMinutes !== undefined) {
      this.postEventMinutes = config.postEventMinutes;
      console.log(`⚙️ Updated post-event minutes: ${this.postEventMinutes}`);
    }
  }

  /**
   * 🛑 STOP ENGINE
   */
  stop(): void {
    console.log('🛑 STOPPING REGULATORY CALENDAR ENGINE...');
    
    this.isRunning = false;
    
    console.log('🛑 REGULATORY CALENDAR ENGINE STOPPED');
  }
}

export default RegulatoryCalendarEngine;
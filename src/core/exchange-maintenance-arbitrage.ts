// EXCHANGE MAINTENANCE ARBITRAGE SYSTEM - REVOLUTIONARY DOWNTIME EXPLOITATION
// Exploit price discrepancies during exchange maintenance periods and restarts

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import ExchangeManager from '../exchanges/exchange-manager';
import { TradeSignal } from '../types/core';

/**
 * Exchange status
 */
export enum ExchangeStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  DEGRADED = 'degraded',
  RESTARTING = 'restarting'
}

/**
 * Maintenance type
 */
export enum MaintenanceType {
  SCHEDULED = 'scheduled',
  EMERGENCY = 'emergency',
  UPGRADE = 'upgrade',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}

/**
 * Maintenance event
 */
export interface MaintenanceEvent {
  id: string;
  exchange: string;
  status: ExchangeStatus;
  type: MaintenanceType;
  startTime: Date;
  estimatedEndTime: Date | null;
  actualEndTime: Date | null;
  duration: number | null; // milliseconds
  announcement: string | null;
  affectedServices: string[];
  severity: number; // 1-10 scale
  detectedAt: Date;
  notes: string[];
}/*
*
 * Price discrepancy
 */
export interface PriceDiscrepancy {
  id: string;
  asset: string;
  maintenanceExchange: string;
  referenceExchange: string;
  priceBeforeMaintenance: number;
  currentReferencePrice: number;
  expectedPostMaintenancePrice: number;
  priceDifference: number;
  priceDifferencePercentage: number;
  confidence: number;
  volatility: number;
  volume: number;
  detectedAt: Date;
  maintenanceEvent: MaintenanceEvent;
}

/**
 * Maintenance arbitrage opportunity
 */
export interface MaintenanceArbitrageOpportunity {
  id: string;
  asset: string;
  maintenanceExchange: string;
  referenceExchanges: string[];
  priceDiscrepancy: PriceDiscrepancy;
  expectedProfit: number;
  expectedProfitPercentage: number;
  executionStrategy: 'pre_maintenance' | 'post_maintenance' | 'cross_exchange';
  optimalEntryTime: Date;
  optimalExitTime: Date;
  riskScore: number; // 1-10 scale
  confidence: number;
  detectedAt: Date;
  status: 'active' | 'executed' | 'completed' | 'expired' | 'failed';
  notes: string[];
}

/**
 * Maintenance arbitrage trade
 */
export interface MaintenanceArbitrageTrade {
  id: string;
  opportunityId: string;
  asset: string;
  maintenanceExchange: string;
  referenceExchange: string;
  entryTrade: {
    exchange: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    executed: boolean;
    executionTime: Date | null;
  };
  exitTrade: {
    exchange: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number | null;
    executed: boolean;
    executionTime: Date | null;
  };
  pnl: number | null;
  pnlPercentage: number | null;
  status: 'pending' | 'partial' | 'active' | 'completed' | 'failed';
  entryTime: Date | null;
  exitTime: Date | null;
  notes: string[];
}/
**
 * Exchange maintenance schedule
 */
export interface ExchangeMaintenanceSchedule {
  exchange: string;
  regularMaintenanceDay: number; // 0 = Sunday, 6 = Saturday
  regularMaintenanceHour: number; // 0-23 UTC
  regularMaintenanceDuration: number; // minutes
  lastMaintenanceDate: Date | null;
  nextScheduledMaintenance: Date | null;
  maintenanceFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'irregular';
  historicalDowntimes: {
    startTime: Date;
    endTime: Date;
    type: MaintenanceType;
  }[];
  announcementSources: string[];
}

/**
 * Exchange maintenance arbitrage configuration
 */
export interface ExchangeMaintenanceArbitrageConfig {
  minPriceDifferencePercentage: number;
  minConfidence: number;
  maxRiskScore: number;
  maxPositionSizeUsd: number;
  maxActiveTrades: number;
  scanIntervalMs: number;
  monitoredExchanges: string[];
  monitoredAssets: string[];
  maintenanceSchedules: ExchangeMaintenanceSchedule[];
  referenceExchanges: string[];
  priceReversionThresholdPercentage: number;
  maxWaitTimeMinutes: number;
}

/**
 * Exchange Maintenance Arbitrage System
 * 
 * REVOLUTIONARY INSIGHT: When cryptocurrency exchanges undergo maintenance or
 * experience downtime, significant price discrepancies often emerge between the
 * affected exchange and other exchanges. These discrepancies create two major
 * arbitrage opportunities:
 * 
 * 1. PRE-MAINTENANCE: Position before maintenance based on historical patterns
 * 2. POST-MAINTENANCE: Exploit price gaps when trading resumes
 * 
 * By systematically monitoring exchange maintenance schedules and historical
 * price behavior during downtime events, we can predict and exploit these
 * temporary inefficiencies for substantial profits.
 */
export class ExchangeMaintenanceArbitrage extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private config: ExchangeMaintenanceArbitrageConfig;
  private exchangeStatuses: Map<string, ExchangeStatus> = new Map();
  private maintenanceEvents: Map<string, MaintenanceEvent> = new Map();
  private priceDiscrepancies: Map<string, PriceDiscrepancy> = new Map();
  private opportunities: Map<string, MaintenanceArbitrageOpportunity> = new Map();
  private activeTrades: Map<string, MaintenanceArbitrageTrade> = new Map();
  private completedTrades: MaintenanceArbitrageTrade[] = [];
  private lastPrices: Map<string, Map<string, number>> = new Map(); // exchange -> symbol -> price
  private priceHistories: Map<string, Map<string, number[]>> = new Map(); // exchange_symbol -> prices
  private isRunning: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private maintenanceCheckInterval: NodeJS.Timeout | null = null;
  private accountBalance: number = 1000;
  private accountId: string = 'default';  
/**
   * Constructor
   * @param exchangeManager Exchange manager
   * @param config Configuration
   */
  constructor(
    exchangeManager: ExchangeManager,
    config?: Partial<ExchangeMaintenanceArbitrageConfig>
  ) {
    super();
    this.exchangeManager = exchangeManager;
    
    // Default configuration
    this.config = {
      minPriceDifferencePercentage: 1.0, // 1.0% minimum price difference
      minConfidence: 0.7, // 70% minimum confidence
      maxRiskScore: 7, // 7/10 maximum risk score
      maxPositionSizeUsd: 10000, // $10,000 maximum position size
      maxActiveTrades: 5,
      scanIntervalMs: 60 * 1000, // 1 minute
      monitoredExchanges: [
        'binance', 'coinbase', 'kraken', 'bybit', 'okx', 
        'huobi', 'kucoin', 'gate', 'bitfinex', 'bitstamp'
      ],
      monitoredAssets: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'],
      maintenanceSchedules: [
        {
          exchange: 'binance',
          regularMaintenanceDay: 2, // Tuesday
          regularMaintenanceHour: 2, // 2:00 UTC
          regularMaintenanceDuration: 120, // 2 hours
          lastMaintenanceDate: null,
          nextScheduledMaintenance: null,
          maintenanceFrequency: 'biweekly',
          historicalDowntimes: [],
          announcementSources: [
            'https://www.binance.com/en/support/announcement',
            'https://twitter.com/binance'
          ]
        },
        {
          exchange: 'okx',
          regularMaintenanceDay: 3, // Wednesday
          regularMaintenanceHour: 3, // 3:00 UTC
          regularMaintenanceDuration: 60, // 1 hour
          lastMaintenanceDate: null,
          nextScheduledMaintenance: null,
          maintenanceFrequency: 'weekly',
          historicalDowntimes: [],
          announcementSources: [
            'https://www.okx.com/support/hc/en-us/sections/360000030652',
            'https://twitter.com/okx'
          ]
        },
        {
          exchange: 'bybit',
          regularMaintenanceDay: 4, // Thursday
          regularMaintenanceHour: 4, // 4:00 UTC
          regularMaintenanceDuration: 90, // 1.5 hours
          lastMaintenanceDate: null,
          nextScheduledMaintenance: null,
          maintenanceFrequency: 'biweekly',
          historicalDowntimes: [],
          announcementSources: [
            'https://announcements.bybit.com/',
            'https://twitter.com/Bybit_Official'
          ]
        },
        {
          exchange: 'kucoin',
          regularMaintenanceDay: 5, // Friday
          regularMaintenanceHour: 2, // 2:00 UTC
          regularMaintenanceDuration: 120, // 2 hours
          lastMaintenanceDate: null,
          nextScheduledMaintenance: null,
          maintenanceFrequency: 'monthly',
          historicalDowntimes: [],
          announcementSources: [
            'https://www.kucoin.com/news',
            'https://twitter.com/kucoincom'
          ]
        }
      ],
      referenceExchanges: ['binance', 'coinbase', 'kraken'],
      priceReversionThresholdPercentage: 0.2, // 0.2% price reversion threshold
      maxWaitTimeMinutes: 120 // 2 hours maximum wait time
    };
    
    // Override with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Initialize exchange statuses
    for (const exchange of this.config.monitoredExchanges) {
      this.exchangeStatuses.set(exchange, ExchangeStatus.ONLINE);
    }
    
    // Initialize last prices map
    for (const exchange of this.config.monitoredExchanges) {
      this.lastPrices.set(exchange, new Map());
    }
    
    // Calculate next scheduled maintenance for each exchange
    this.calculateNextScheduledMaintenance();
  } 
 /**
   * Calculate next scheduled maintenance for each exchange
   */
  private calculateNextScheduledMaintenance(): void {
    const now = new Date();
    
    for (const schedule of this.config.maintenanceSchedules) {
      // Get current day of week (0 = Sunday, 6 = Saturday)
      const currentDay = now.getUTCDay();
      const currentHour = now.getUTCHours();
      
      // Calculate days until next maintenance
      let daysUntilMaintenance = (schedule.regularMaintenanceDay - currentDay + 7) % 7;
      
      // If maintenance is today but already passed, add 7 days
      if (daysUntilMaintenance === 0 && currentHour > schedule.regularMaintenanceHour) {
        daysUntilMaintenance = 7;
      }
      
      // If maintenance frequency is not weekly, adjust accordingly
      if (schedule.maintenanceFrequency === 'biweekly') {
        // If last maintenance was less than 14 days ago, add 7 more days
        if (schedule.lastMaintenanceDate) {
          const daysSinceLastMaintenance = Math.floor((now.getTime() - schedule.lastMaintenanceDate.getTime()) / (24 * 60 * 60 * 1000));
          if (daysSinceLastMaintenance < 14) {
            daysUntilMaintenance += 7;
          }
        }
      } else if (schedule.maintenanceFrequency === 'monthly') {
        // For monthly, set to the same day next month
        if (schedule.lastMaintenanceDate) {
          const lastMonth = schedule.lastMaintenanceDate.getUTCMonth();
          const currentMonth = now.getUTCMonth();
          const monthDiff = (currentMonth - lastMonth + 12) % 12;
          
          if (monthDiff < 1) {
            // Less than a month since last maintenance, calculate days until next month
            const nextMonth = new Date(now);
            nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
            nextMonth.setUTCDate(schedule.regularMaintenanceDay);
            
            daysUntilMaintenance = Math.floor((nextMonth.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          }
        }
      }
      
      // Calculate next maintenance date
      const nextMaintenance = new Date(now);
      nextMaintenance.setUTCDate(nextMaintenance.getUTCDate() + daysUntilMaintenance);
      nextMaintenance.setUTCHours(schedule.regularMaintenanceHour, 0, 0, 0);
      
      // Update schedule
      schedule.nextScheduledMaintenance = nextMaintenance;
    }
  }
  
  /**
   * Start the exchange maintenance arbitrage system
   * @param accountId Account ID
   * @param accountBalance Account balance
   */
  async start(
    accountId: string = 'default',
    accountBalance: number = 1000
  ): Promise<void> {
    if (this.isRunning) {
      console.log('🔧 Exchange maintenance arbitrage system already running');
      return;
    }
    
    console.log('🚀 STARTING EXCHANGE MAINTENANCE ARBITRAGE SYSTEM...');
    
    // Set account details
    this.accountId = accountId;
    this.accountBalance = accountBalance;
    
    // Start price monitoring
    this.startPriceMonitoring();
    
    // Start maintenance monitoring
    this.startMaintenanceMonitoring();
    
    // Start opportunity scanning
    this.startOpportunityScan();
    
    this.isRunning = true;
    console.log(`🔧 EXCHANGE MAINTENANCE ARBITRAGE SYSTEM ACTIVE! Monitoring ${this.config.monitoredAssets.length} assets across ${this.config.monitoredExchanges.length} exchanges`);
  }  /*
*
   * Start price monitoring
   */
  private startPriceMonitoring(): void {
    console.log('📡 STARTING PRICE MONITORING...');
    
    // Listen for price updates from exchange manager
    this.exchangeManager.on('priceUpdate', (priceUpdate) => {
      const { exchange, symbol, price } = priceUpdate;
      
      // Skip if not a monitored exchange
      if (!this.config.monitoredExchanges.includes(exchange)) {
        return;
      }
      
      // Store price
      const exchangePrices = this.lastPrices.get(exchange) || new Map();
      exchangePrices.set(symbol, price);
      this.lastPrices.set(exchange, exchangePrices);
      
      // Store in price history
      const key = `${exchange}_${symbol}`;
      const history = this.priceHistories.get(key) || [];
      history.push(price);
      
      // Keep only the last 1000 prices
      if (history.length > 1000) {
        history.shift();
      }
      
      this.priceHistories.set(key, history);
      
      // Check for exchange status changes based on price updates
      this.checkExchangeStatus(exchange);
    });
  }
  
  /**
   * Check exchange status
   * @param exchange Exchange
   */
  private checkExchangeStatus(exchange: string): void {
    // Get current status
    const currentStatus = this.exchangeStatuses.get(exchange) || ExchangeStatus.ONLINE;
    
    // Get connection status from exchange manager
    const connectionStatus = this.exchangeManager.getConnectionStatus();
    const isConnected = connectionStatus.get(exchange) || false;
    
    // If not connected, mark as offline
    if (!isConnected && currentStatus !== ExchangeStatus.OFFLINE) {
      this.updateExchangeStatus(exchange, ExchangeStatus.OFFLINE);
      return;
    }
    
    // If connected but was offline, mark as restarting
    if (isConnected && currentStatus === ExchangeStatus.OFFLINE) {
      this.updateExchangeStatus(exchange, ExchangeStatus.RESTARTING);
      
      // After 5 minutes, mark as online
      setTimeout(() => {
        if (this.exchangeStatuses.get(exchange) === ExchangeStatus.RESTARTING) {
          this.updateExchangeStatus(exchange, ExchangeStatus.ONLINE);
        }
      }, 5 * 60 * 1000);
      
      return;
    }
    
    // Check for price update frequency to detect degraded service
    const exchangePrices = this.lastPrices.get(exchange);
    if (exchangePrices && exchangePrices.size > 0) {
      // TODO: Implement price update frequency check
    }
  }
  
  /**
   * Update exchange status
   * @param exchange Exchange
   * @param status New status
   */
  private updateExchangeStatus(exchange: string, status: ExchangeStatus): void {
    const oldStatus = this.exchangeStatuses.get(exchange);
    
    // Skip if status hasn't changed
    if (oldStatus === status) {
      return;
    }
    
    console.log(`🔄 EXCHANGE STATUS CHANGE: ${exchange} ${oldStatus} → ${status}`);
    
    // Update status
    this.exchangeStatuses.set(exchange, status);
    
    // If going into maintenance or offline, create maintenance event
    if ((status === ExchangeStatus.MAINTENANCE || status === ExchangeStatus.OFFLINE) && 
        (oldStatus === ExchangeStatus.ONLINE || oldStatus === ExchangeStatus.DEGRADED)) {
      this.createMaintenanceEvent(exchange, status);
    }
    
    // If coming back online after maintenance, update maintenance event
    if ((status === ExchangeStatus.ONLINE || status === ExchangeStatus.RESTARTING) && 
        (oldStatus === ExchangeStatus.MAINTENANCE || oldStatus === ExchangeStatus.OFFLINE)) {
      this.updateMaintenanceEventEnd(exchange);
    }
    
    // Emit status change event
    this.emit('exchangeStatusChange', { exchange, oldStatus, newStatus: status });
  }  
/**
   * Create maintenance event
   * @param exchange Exchange
   * @param status Exchange status
   */
  private createMaintenanceEvent(exchange: string, status: ExchangeStatus): void {
    // Check if there's already an active maintenance event for this exchange
    const existingEvent = Array.from(this.maintenanceEvents.values())
      .find(e => e.exchange === exchange && e.actualEndTime === null);
    
    if (existingEvent) {
      return;
    }
    
    // Determine maintenance type
    let maintenanceType = MaintenanceType.UNKNOWN;
    
    // Check if this is a scheduled maintenance
    const schedule = this.config.maintenanceSchedules.find(s => s.exchange === exchange);
    if (schedule) {
      const now = new Date();
      const nextMaintenance = schedule.nextScheduledMaintenance;
      
      if (nextMaintenance) {
        const timeDiff = Math.abs(now.getTime() - nextMaintenance.getTime());
        
        // If within 3 hours of scheduled maintenance, consider it scheduled
        if (timeDiff < 3 * 60 * 60 * 1000) {
          maintenanceType = MaintenanceType.SCHEDULED;
        }
      }
    }
    
    // Create maintenance event
    const maintenanceEvent: MaintenanceEvent = {
      id: uuidv4(),
      exchange,
      status,
      type: maintenanceType,
      startTime: new Date(),
      estimatedEndTime: this.estimateMaintenanceEndTime(exchange, maintenanceType),
      actualEndTime: null,
      duration: null,
      announcement: null,
      affectedServices: ['trading', 'deposits', 'withdrawals'],
      severity: status === ExchangeStatus.OFFLINE ? 9 : 7,
      detectedAt: new Date(),
      notes: [
        `${exchange} entered ${status} state at ${new Date().toISOString()}`,
        `Maintenance type: ${maintenanceType}`,
        `Estimated end time: ${this.estimateMaintenanceEndTime(exchange, maintenanceType)?.toISOString() || 'unknown'}`
      ]
    };
    
    // Store maintenance event
    this.maintenanceEvents.set(maintenanceEvent.id, maintenanceEvent);
    
    console.log(`🔧 MAINTENANCE EVENT DETECTED: ${exchange} (${maintenanceType})`);
    
    // Emit maintenance event
    this.emit('maintenanceDetected', maintenanceEvent);
    
    // Capture pre-maintenance prices for all assets
    this.capturePreMaintenancePrices(exchange, maintenanceEvent);
  }
  
  /**
   * Estimate maintenance end time
   * @param exchange Exchange
   * @param maintenanceType Maintenance type
   * @returns Estimated end time
   */
  private estimateMaintenanceEndTime(exchange: string, maintenanceType: MaintenanceType): Date | null {
    const now = new Date();
    
    // If scheduled maintenance, use schedule duration
    if (maintenanceType === MaintenanceType.SCHEDULED) {
      const schedule = this.config.maintenanceSchedules.find(s => s.exchange === exchange);
      
      if (schedule) {
        const endTime = new Date(now);
        endTime.setMinutes(endTime.getMinutes() + schedule.regularMaintenanceDuration);
        return endTime;
      }
    }
    
    // For other maintenance types, use historical data or defaults
    const defaultDurations = {
      [MaintenanceType.EMERGENCY]: 180, // 3 hours
      [MaintenanceType.UPGRADE]: 240, // 4 hours
      [MaintenanceType.SECURITY]: 300, // 5 hours
      [MaintenanceType.UNKNOWN]: 120 // 2 hours
    };
    
    const duration = defaultDurations[maintenanceType] || 120;
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + duration);
    
    return endTime;
  }  /**
  
 * Update maintenance event end
   * @param exchange Exchange
   */
  private updateMaintenanceEventEnd(exchange: string): void {
    // Find active maintenance event for this exchange
    const maintenanceEvent = Array.from(this.maintenanceEvents.values())
      .find(e => e.exchange === exchange && e.actualEndTime === null);
    
    if (!maintenanceEvent) {
      return;
    }
    
    // Update maintenance event
    maintenanceEvent.actualEndTime = new Date();
    maintenanceEvent.duration = maintenanceEvent.actualEndTime.getTime() - maintenanceEvent.startTime.getTime();
    maintenanceEvent.notes.push(`Maintenance ended at ${maintenanceEvent.actualEndTime.toISOString()}`);
    maintenanceEvent.notes.push(`Actual duration: ${Math.floor(maintenanceEvent.duration / (60 * 1000))} minutes`);
    
    // Store updated maintenance event
    this.maintenanceEvents.set(maintenanceEvent.id, maintenanceEvent);
    
    console.log(`✅ MAINTENANCE COMPLETED: ${exchange} (${Math.floor(maintenanceEvent.duration / (60 * 1000))} minutes)`);
    
    // Emit maintenance end event
    this.emit('maintenanceEnded', maintenanceEvent);
    
    // Update maintenance schedule
    const schedule = this.config.maintenanceSchedules.find(s => s.exchange === exchange);
    if (schedule) {
      schedule.lastMaintenanceDate = new Date();
      schedule.historicalDowntimes.push({
        startTime: maintenanceEvent.startTime,
        endTime: maintenanceEvent.actualEndTime,
        type: maintenanceEvent.type
      });
      
      // Recalculate next scheduled maintenance
      this.calculateNextScheduledMaintenance();
    }
    
    // Check for post-maintenance price discrepancies
    this.checkPostMaintenancePriceDiscrepancies(exchange, maintenanceEvent);
  }
  
  /**
   * Capture pre-maintenance prices
   * @param exchange Exchange
   * @param maintenanceEvent Maintenance event
   */
  private capturePreMaintenancePrices(exchange: string, maintenanceEvent: MaintenanceEvent): void {
    console.log(`📊 CAPTURING PRE-MAINTENANCE PRICES FOR ${exchange}...`);
    
    const exchangePrices = this.lastPrices.get(exchange);
    if (!exchangePrices) {
      return;
    }
    
    // For each monitored asset
    for (const asset of this.config.monitoredAssets) {
      const symbol = `${asset}/USDT`;
      const price = exchangePrices.get(symbol);
      
      if (!price) {
        continue;
      }
      
      // Get reference price from other exchanges
      const referencePrices: number[] = [];
      
      for (const refExchange of this.config.referenceExchanges) {
        if (refExchange === exchange) {
          continue;
        }
        
        const refExchangePrices = this.lastPrices.get(refExchange);
        if (refExchangePrices) {
          const refPrice = refExchangePrices.get(symbol);
          if (refPrice) {
            referencePrices.push(refPrice);
          }
        }
      }
      
      // Skip if no reference prices
      if (referencePrices.length === 0) {
        continue;
      }
      
      // Calculate average reference price
      const avgReferencePrice = referencePrices.reduce((sum, p) => sum + p, 0) / referencePrices.length;
      
      // Create price discrepancy
      const priceDiscrepancy: PriceDiscrepancy = {
        id: uuidv4(),
        asset,
        maintenanceExchange: exchange,
        referenceExchange: this.config.referenceExchanges[0],
        priceBeforeMaintenance: price,
        currentReferencePrice: avgReferencePrice,
        expectedPostMaintenancePrice: avgReferencePrice,
        priceDifference: avgReferencePrice - price,
        priceDifferencePercentage: ((avgReferencePrice - price) / price) * 100,
        confidence: 0.8,
        volatility: this.calculateAssetVolatility(asset),
        volume: this.calculateAssetVolume(asset),
        detectedAt: new Date(),
        maintenanceEvent
      };
      
      // Store price discrepancy
      this.priceDiscrepancies.set(priceDiscrepancy.id, priceDiscrepancy);
      
      console.log(`📊 PRE-MAINTENANCE PRICE CAPTURED: ${asset} on ${exchange} @ ${price.toFixed(2)}`);
    }
  }  /*
*
   * Check post-maintenance price discrepancies
   * @param exchange Exchange
   * @param maintenanceEvent Maintenance event
   */
  private checkPostMaintenancePriceDiscrepancies(exchange: string, maintenanceEvent: MaintenanceEvent): void {
    console.log(`📊 CHECKING POST-MAINTENANCE PRICE DISCREPANCIES FOR ${exchange}...`);
    
    const exchangePrices = this.lastPrices.get(exchange);
    if (!exchangePrices) {
      return;
    }
    
    // Find price discrepancies for this maintenance event
    const discrepancies = Array.from(this.priceDiscrepancies.values())
      .filter(d => d.maintenanceEvent.id === maintenanceEvent.id);
    
    // For each discrepancy
    for (const discrepancy of discrepancies) {
      const symbol = `${discrepancy.asset}/USDT`;
      const postMaintenancePrice = exchangePrices.get(symbol);
      
      if (!postMaintenancePrice) {
        continue;
      }
      
      // Get current reference price
      const referencePrices: number[] = [];
      
      for (const refExchange of this.config.referenceExchanges) {
        if (refExchange === exchange) {
          continue;
        }
        
        const refExchangePrices = this.lastPrices.get(refExchange);
        if (refExchangePrices) {
          const refPrice = refExchangePrices.get(symbol);
          if (refPrice) {
            referencePrices.push(refPrice);
          }
        }
      }
      
      // Skip if no reference prices
      if (referencePrices.length === 0) {
        continue;
      }
      
      // Calculate average reference price
      const avgReferencePrice = referencePrices.reduce((sum, p) => sum + p, 0) / referencePrices.length;
      
      // Calculate post-maintenance price difference
      const priceDifference = postMaintenancePrice - avgReferencePrice;
      const priceDifferencePercentage = (priceDifference / avgReferencePrice) * 100;
      
      console.log(`📊 POST-MAINTENANCE PRICE CHECK: ${discrepancy.asset} on ${exchange} @ ${postMaintenancePrice.toFixed(2)} (${priceDifferencePercentage.toFixed(2)}% diff)`);
      
      // If price difference is significant, create arbitrage opportunity
      if (Math.abs(priceDifferencePercentage) >= this.config.minPriceDifferencePercentage) {
        this.createPostMaintenanceArbitrageOpportunity(discrepancy, postMaintenancePrice, avgReferencePrice);
      }
    }
  }
  
  /**
   * Create post-maintenance arbitrage opportunity
   * @param discrepancy Price discrepancy
   * @param postMaintenancePrice Post-maintenance price
   * @param referencePrice Reference price
   */
  private createPostMaintenanceArbitrageOpportunity(
    discrepancy: PriceDiscrepancy,
    postMaintenancePrice: number,
    referencePrice: number
  ): void {
    // Calculate price difference
    const priceDifference = postMaintenancePrice - referencePrice;
    const priceDifferencePercentage = (priceDifference / referencePrice) * 100;
    
    // Determine execution strategy
    const executionStrategy = 'post_maintenance';
    
    // Calculate expected profit
    const expectedProfit = Math.abs(priceDifference);
    const expectedProfitPercentage = Math.abs(priceDifferencePercentage);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(discrepancy.asset, discrepancy.maintenanceExchange, priceDifferencePercentage);
    
    // Skip if risk is too high
    if (riskScore > this.config.maxRiskScore) {
      console.log(`⚠️ RISK TOO HIGH: ${discrepancy.asset} on ${discrepancy.maintenanceExchange} (${riskScore.toFixed(1)}/10)`);
      return;
    }
    
    // Calculate confidence
    const confidence = this.calculateConfidence(discrepancy.asset, discrepancy.maintenanceExchange, priceDifferencePercentage);
    
    // Skip if confidence is too low
    if (confidence < this.config.minConfidence) {
      console.log(`⚠️ CONFIDENCE TOO LOW: ${discrepancy.asset} on ${discrepancy.maintenanceExchange} (${(confidence * 100).toFixed(1)}%)`);
      return;
    }  
  // Create opportunity
    const opportunity: MaintenanceArbitrageOpportunity = {
      id: uuidv4(),
      asset: discrepancy.asset,
      maintenanceExchange: discrepancy.maintenanceExchange,
      referenceExchanges: this.config.referenceExchanges.filter(e => e !== discrepancy.maintenanceExchange),
      priceDiscrepancy: {
        ...discrepancy,
        currentReferencePrice: referencePrice,
        priceDifference,
        priceDifferencePercentage
      },
      expectedProfit,
      expectedProfitPercentage,
      executionStrategy,
      optimalEntryTime: new Date(),
      optimalExitTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      riskScore,
      confidence,
      detectedAt: new Date(),
      status: 'active',
      notes: [
        `Post-maintenance price discrepancy detected for ${discrepancy.asset} on ${discrepancy.maintenanceExchange}`,
        `Price difference: ${priceDifference.toFixed(2)} (${priceDifferencePercentage.toFixed(2)}%)`,
        `Risk score: ${riskScore.toFixed(1)}/10, Confidence: ${(confidence * 100).toFixed(1)}%`,
        `Execution strategy: ${executionStrategy}`
      ]
    };
    
    // Store opportunity
    this.opportunities.set(opportunity.id, opportunity);
    
    console.log(`💰 POST-MAINTENANCE ARBITRAGE OPPORTUNITY DETECTED: ${discrepancy.asset} on ${discrepancy.maintenanceExchange}`);
    console.log(`📊 ${priceDifferencePercentage.toFixed(2)}% price difference, ${expectedProfitPercentage.toFixed(2)}% expected profit`);
    
    // Emit opportunity detected event
    this.emit('opportunityDetected', opportunity);
    
    // Create trade if confidence is high enough
    if (confidence >= this.config.minConfidence) {
      this.createMaintenanceArbitrageTrade(opportunity);
    }
  }
  
  /**
   * Start maintenance monitoring
   */
  private startMaintenanceMonitoring(): void {
    console.log('🔧 STARTING MAINTENANCE MONITORING...');
    
    // Check for scheduled maintenance every hour
    this.maintenanceCheckInterval = setInterval(() => {
      this.checkScheduledMaintenance();
    }, 60 * 60 * 1000);
    
    // Check for scheduled maintenance immediately
    this.checkScheduledMaintenance();
  }
  
  /**
   * Check scheduled maintenance
   */
  private checkScheduledMaintenance(): void {
    const now = new Date();
    
    for (const schedule of this.config.maintenanceSchedules) {
      if (!schedule.nextScheduledMaintenance) {
        continue;
      }
      
      const timeDiff = schedule.nextScheduledMaintenance.getTime() - now.getTime();
      
      // If maintenance is scheduled to start within the next hour
      if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
        console.log(`🔧 SCHEDULED MAINTENANCE APPROACHING: ${schedule.exchange} at ${schedule.nextScheduledMaintenance.toISOString()}`);
        
        // Check if we already have a maintenance event for this
        const existingEvent = Array.from(this.maintenanceEvents.values())
          .find(e => e.exchange === schedule.exchange && e.type === MaintenanceType.SCHEDULED && e.actualEndTime === null);
        
        if (!existingEvent) {
          // Create pre-maintenance opportunities
          this.createPreMaintenanceOpportunities(schedule.exchange, schedule.nextScheduledMaintenance);
        }
      }
    }
  }  /*
*
   * Create pre-maintenance opportunities
   * @param exchange Exchange
   * @param maintenanceTime Maintenance time
   */
  private createPreMaintenanceOpportunities(exchange: string, maintenanceTime: Date): void {
    console.log(`🔍 CREATING PRE-MAINTENANCE OPPORTUNITIES FOR ${exchange}...`);
    
    const exchangePrices = this.lastPrices.get(exchange);
    if (!exchangePrices) {
      return;
    }
    
    // For each monitored asset
    for (const asset of this.config.monitoredAssets) {
      const symbol = `${asset}/USDT`;
      const price = exchangePrices.get(symbol);
      
      if (!price) {
        continue;
      }
      
      // Get reference price from other exchanges
      const referencePrices: number[] = [];
      
      for (const refExchange of this.config.referenceExchanges) {
        if (refExchange === exchange) {
          continue;
        }
        
        const refExchangePrices = this.lastPrices.get(refExchange);
        if (refExchangePrices) {
          const refPrice = refExchangePrices.get(symbol);
          if (refPrice) {
            referencePrices.push(refPrice);
          }
        }
      }
      
      // Skip if no reference prices
      if (referencePrices.length === 0) {
        continue;
      }
      
      // Calculate average reference price
      const avgReferencePrice = referencePrices.reduce((sum, p) => sum + p, 0) / referencePrices.length;
      
      // Analyze historical maintenance events for this exchange
      const historicalImpact = this.analyzeHistoricalMaintenanceImpact(exchange, asset);
      
      // Skip if no historical impact data
      if (!historicalImpact) {
        continue;
      }
      
      // Create maintenance event
      const maintenanceEvent: MaintenanceEvent = {
        id: uuidv4(),
        exchange,
        status: ExchangeStatus.MAINTENANCE,
        type: MaintenanceType.SCHEDULED,
        startTime: maintenanceTime,
        estimatedEndTime: new Date(maintenanceTime.getTime() + this.getMaintenanceDuration(exchange) * 60 * 1000),
        actualEndTime: null,
        duration: null,
        announcement: null,
        affectedServices: ['trading', 'deposits', 'withdrawals'],
        severity: 5,
        detectedAt: new Date(),
        notes: [
          `Scheduled maintenance for ${exchange} at ${maintenanceTime.toISOString()}`,
          `Estimated duration: ${this.getMaintenanceDuration(exchange)} minutes`,
          `Historical impact: ${historicalImpact.averageImpactPercentage.toFixed(2)}% price change`
        ]
      };
      
      // Create price discrepancy
      const priceDiscrepancy: PriceDiscrepancy = {
        id: uuidv4(),
        asset,
        maintenanceExchange: exchange,
        referenceExchange: this.config.referenceExchanges[0],
        priceBeforeMaintenance: price,
        currentReferencePrice: avgReferencePrice,
        expectedPostMaintenancePrice: price * (1 + historicalImpact.averageImpactPercentage / 100),
        priceDifference: (price * (1 + historicalImpact.averageImpactPercentage / 100)) - price,
        priceDifferencePercentage: historicalImpact.averageImpactPercentage,
        confidence: historicalImpact.confidence,
        volatility: this.calculateAssetVolatility(asset),
        volume: this.calculateAssetVolume(asset),
        detectedAt: new Date(),
        maintenanceEvent
      };
      
      // Calculate expected profit
      const expectedProfit = Math.abs(priceDiscrepancy.priceDifference);
      const expectedProfitPercentage = Math.abs(priceDiscrepancy.priceDifferencePercentage);
      
      // Skip if expected profit is too small
      if (expectedProfitPercentage < this.config.minPriceDifferencePercentage) {
        continue;
      }
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(asset, exchange, historicalImpact.averageImpactPercentage);
      
      // Skip if risk is too high
      if (riskScore > this.config.maxRiskScore) {
        continue;
      }    
  // Create opportunity
      const opportunity: MaintenanceArbitrageOpportunity = {
        id: uuidv4(),
        asset,
        maintenanceExchange: exchange,
        referenceExchanges: this.config.referenceExchanges.filter(e => e !== exchange),
        priceDiscrepancy,
        expectedProfit,
        expectedProfitPercentage,
        executionStrategy: 'pre_maintenance',
        optimalEntryTime: new Date(maintenanceTime.getTime() - 30 * 60 * 1000), // 30 minutes before maintenance
        optimalExitTime: new Date(maintenanceTime.getTime() + this.getMaintenanceDuration(exchange) * 60 * 1000 + 30 * 60 * 1000), // 30 minutes after maintenance ends
        riskScore,
        confidence: historicalImpact.confidence,
        detectedAt: new Date(),
        status: 'active',
        notes: [
          `Pre-maintenance opportunity detected for ${asset} on ${exchange}`,
          `Scheduled maintenance at ${maintenanceTime.toISOString()}`,
          `Historical impact: ${historicalImpact.averageImpactPercentage.toFixed(2)}% price change`,
          `Expected profit: ${expectedProfitPercentage.toFixed(2)}%, Risk score: ${riskScore.toFixed(1)}/10`
        ]
      };
      
      // Store opportunity
      this.opportunities.set(opportunity.id, opportunity);
      
      console.log(`💰 PRE-MAINTENANCE ARBITRAGE OPPORTUNITY DETECTED: ${asset} on ${exchange}`);
      console.log(`📊 Expected ${historicalImpact.averageImpactPercentage.toFixed(2)}% price change, ${expectedProfitPercentage.toFixed(2)}% expected profit`);
      
      // Emit opportunity detected event
      this.emit('opportunityDetected', opportunity);
      
      // Create trade if confidence is high enough and we're close to optimal entry time
      const timeToOptimalEntry = opportunity.optimalEntryTime.getTime() - Date.now();
      if (opportunity.confidence >= this.config.minConfidence && timeToOptimalEntry <= 15 * 60 * 1000) {
        this.createMaintenanceArbitrageTrade(opportunity);
      }
    }
  }
  
  /**
   * Analyze historical maintenance impact
   * @param exchange Exchange
   * @param asset Asset
   * @returns Historical impact
   */
  private analyzeHistoricalMaintenanceImpact(exchange: string, asset: string): { 
    averageImpactPercentage: number;
    confidence: number;
    sampleSize: number;
  } | null {
    // In a real implementation, this would analyze historical price data
    // For now, we'll return simulated data
    
    // Get exchange schedule
    const schedule = this.config.maintenanceSchedules.find(s => s.exchange === exchange);
    if (!schedule) {
      return null;
    }
    
    // Generate simulated impact based on exchange and asset
    let baseImpact: number;
    let confidenceBase: number;
    
    switch (exchange) {
      case 'binance':
        baseImpact = 1.2;
        confidenceBase = 0.85;
        break;
      case 'okx':
        baseImpact = 1.8;
        confidenceBase = 0.8;
        break;
      case 'bybit':
        baseImpact = 2.2;
        confidenceBase = 0.75;
        break;
      case 'kucoin':
        baseImpact = 2.5;
        confidenceBase = 0.7;
        break;
      default:
        baseImpact = 1.5;
        confidenceBase = 0.7;
    }
    
    // Adjust based on asset
    let assetMultiplier: number;
    
    switch (asset) {
      case 'BTC':
        assetMultiplier = 0.8;
        break;
      case 'ETH':
        assetMultiplier = 1.0;
        break;
      case 'SOL':
        assetMultiplier = 1.3;
        break;
      case 'BNB':
        assetMultiplier = 1.1;
        break;
      case 'XRP':
        assetMultiplier = 1.2;
        break;
      default:
        assetMultiplier = 1.0;
    }
    
    // Calculate impact
    const averageImpactPercentage = baseImpact * assetMultiplier;
    
    // Add some randomness
    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8-1.2
    const finalImpact = averageImpactPercentage * randomFactor;
    
    // Calculate confidence
    const confidence = Math.min(0.95, confidenceBase * (1 + (schedule.historicalDowntimes.length / 20)));
    
    return {
      averageImpactPercentage: finalImpact,
      confidence,
      sampleSize: schedule.historicalDowntimes.length
    };
  }  /**

   * Get maintenance duration
   * @param exchange Exchange
   * @returns Maintenance duration in minutes
   */
  private getMaintenanceDuration(exchange: string): number {
    const schedule = this.config.maintenanceSchedules.find(s => s.exchange === exchange);
    return schedule ? schedule.regularMaintenanceDuration : 120; // Default to 2 hours
  }
  
  /**
   * Calculate asset volatility
   * @param asset Asset
   * @returns Volatility (0-10 scale)
   */
  private calculateAssetVolatility(asset: string): number {
    // In a real implementation, this would calculate actual volatility
    // For now, we'll return simulated data
    
    switch (asset) {
      case 'BTC':
        return 5 + (Math.random() * 2); // 5-7
      case 'ETH':
        return 6 + (Math.random() * 2); // 6-8
      case 'SOL':
        return 7 + (Math.random() * 2); // 7-9
      case 'BNB':
        return 5.5 + (Math.random() * 2); // 5.5-7.5
      case 'XRP':
        return 6.5 + (Math.random() * 2); // 6.5-8.5
      default:
        return 6 + (Math.random() * 2); // 6-8
    }
  }
  
  /**
   * Calculate asset volume
   * @param asset Asset
   * @returns Volume (USD)
   */
  private calculateAssetVolume(asset: string): number {
    // In a real implementation, this would calculate actual volume
    // For now, we'll return simulated data
    
    switch (asset) {
      case 'BTC':
        return 20000000000 + (Math.random() * 10000000000); // $20B-$30B
      case 'ETH':
        return 10000000000 + (Math.random() * 5000000000); // $10B-$15B
      case 'SOL':
        return 2000000000 + (Math.random() * 1000000000); // $2B-$3B
      case 'BNB':
        return 1500000000 + (Math.random() * 500000000); // $1.5B-$2B
      case 'XRP':
        return 1000000000 + (Math.random() * 500000000); // $1B-$1.5B
      default:
        return 500000000 + (Math.random() * 500000000); // $500M-$1B
    }
  }
  
  /**
   * Calculate risk score
   * @param asset Asset
   * @param exchange Exchange
   * @param priceDifferencePercentage Price difference percentage
   * @returns Risk score (1-10 scale)
   */
  private calculateRiskScore(asset: string, exchange: string, priceDifferencePercentage: number): number {
    // Base risk based on price difference
    let baseRisk = Math.min(10, Math.abs(priceDifferencePercentage) * 2);
    
    // Adjust based on asset volatility
    const volatility = this.calculateAssetVolatility(asset);
    baseRisk += (volatility - 5) * 0.5; // Higher volatility = higher risk
    
    // Adjust based on exchange reliability
    let exchangeReliabilityFactor: number;
    
    switch (exchange) {
      case 'binance':
        exchangeReliabilityFactor = 0.8; // Most reliable
        break;
      case 'coinbase':
        exchangeReliabilityFactor = 0.85;
        break;
      case 'kraken':
        exchangeReliabilityFactor = 0.9;
        break;
      case 'bybit':
        exchangeReliabilityFactor = 1.0;
        break;
      case 'okx':
        exchangeReliabilityFactor = 1.05;
        break;
      case 'kucoin':
        exchangeReliabilityFactor = 1.1;
        break;
      default:
        exchangeReliabilityFactor = 1.0;
    }
    
    baseRisk *= exchangeReliabilityFactor;
    
    // Cap risk score between 1 and 10
    return Math.max(1, Math.min(10, baseRisk));
  }  /**
 
  * Calculate confidence
   * @param asset Asset
   * @param exchange Exchange
   * @param priceDifferencePercentage Price difference percentage
   * @returns Confidence (0-1)
   */
  private calculateConfidence(asset: string, exchange: string, priceDifferencePercentage: number): number {
    // Base confidence
    let baseConfidence = 0.7;
    
    // Adjust based on price difference
    baseConfidence += Math.min(0.1, Math.abs(priceDifferencePercentage) / 20); // Up to +0.1 for large price differences
    
    // Adjust based on exchange reliability
    let exchangeReliabilityFactor: number;
    
    switch (exchange) {
      case 'binance':
        exchangeReliabilityFactor = 0.1; // Most reliable
        break;
      case 'coinbase':
        exchangeReliabilityFactor = 0.08;
        break;
      case 'kraken':
        exchangeReliabilityFactor = 0.07;
        break;
      case 'bybit':
        exchangeReliabilityFactor = 0.05;
        break;
      case 'okx':
        exchangeReliabilityFactor = 0.04;
        break;
      case 'kucoin':
        exchangeReliabilityFactor = 0.03;
        break;
      default:
        exchangeReliabilityFactor = 0.05;
    }
    
    baseConfidence += exchangeReliabilityFactor;
    
    // Adjust based on asset liquidity
    let assetLiquidityFactor: number;
    
    switch (asset) {
      case 'BTC':
        assetLiquidityFactor = 0.1; // Most liquid
        break;
      case 'ETH':
        assetLiquidityFactor = 0.08;
        break;
      case 'SOL':
        assetLiquidityFactor = 0.05;
        break;
      case 'BNB':
        assetLiquidityFactor = 0.06;
        break;
      case 'XRP':
        assetLiquidityFactor = 0.04;
        break;
      default:
        assetLiquidityFactor = 0.03;
    }
    
    baseConfidence += assetLiquidityFactor;
    
    // Cap confidence between 0.5 and 0.95
    return Math.max(0.5, Math.min(0.95, baseConfidence));
  }
  
  /**
   * Start opportunity scan
   */
  private startOpportunityScan(): void {
    console.log('🔍 STARTING OPPORTUNITY SCAN...');
    
    // Scan for opportunities immediately
    this.scanForOpportunities();
    
    // Set up interval for regular opportunity scanning
    this.scanInterval = setInterval(() => {
      this.scanForOpportunities();
    }, this.config.scanIntervalMs);
  }
  
  /**
   * Scan for opportunities
   */
  private scanForOpportunities(): void {
    // Check for active maintenance events
    const activeMaintenanceEvents = Array.from(this.maintenanceEvents.values())
      .filter(e => e.actualEndTime === null);
    
    if (activeMaintenanceEvents.length === 0) {
      return;
    }
    
    console.log(`🔍 SCANNING FOR MAINTENANCE ARBITRAGE OPPORTUNITIES (${activeMaintenanceEvents.length} active events)...`);
    
    // Check for cross-exchange opportunities during maintenance
    for (const event of activeMaintenanceEvents) {
      this.scanForCrossExchangeOpportunities(event);
    }
    
    // Update active opportunities
    this.updateActiveOpportunities();
  } 
 /**
   * Scan for cross-exchange opportunities
   * @param event Maintenance event
   */
  private scanForCrossExchangeOpportunities(event: MaintenanceEvent): void {
    // Skip if exchange is offline (can't execute trades)
    if (event.status === ExchangeStatus.OFFLINE) {
      return;
    }
    
    // For each monitored asset
    for (const asset of this.config.monitoredAssets) {
      const symbol = `${asset}/USDT`;
      
      // Get prices from reference exchanges
      const referencePrices: { exchange: string, price: number }[] = [];
      
      for (const refExchange of this.config.referenceExchanges) {
        if (refExchange === event.exchange) {
          continue;
        }
        
        const refExchangePrices = this.lastPrices.get(refExchange);
        if (refExchangePrices) {
          const refPrice = refExchangePrices.get(symbol);
          if (refPrice) {
            referencePrices.push({ exchange: refExchange, price: refPrice });
          }
        }
      }
      
      // Skip if no reference prices
      if (referencePrices.length === 0) {
        continue;
      }
      
      // Find min and max prices
      const minPrice = referencePrices.reduce((min, p) => p.price < min.price ? p : min, referencePrices[0]);
      const maxPrice = referencePrices.reduce((max, p) => p.price > max.price ? p : max, referencePrices[0]);
      
      // Calculate price difference
      const priceDifference = maxPrice.price - minPrice.price;
      const priceDifferencePercentage = (priceDifference / minPrice.price) * 100;
      
      // Skip if price difference is too small
      if (Math.abs(priceDifferencePercentage) < this.config.minPriceDifferencePercentage) {
        continue;
      }
      
      // Create price discrepancy
      const priceDiscrepancy: PriceDiscrepancy = {
        id: uuidv4(),
        asset,
        maintenanceExchange: event.exchange,
        referenceExchange: minPrice.exchange,
        priceBeforeMaintenance: 0, // Unknown
        currentReferencePrice: minPrice.price,
        expectedPostMaintenancePrice: maxPrice.price,
        priceDifference,
        priceDifferencePercentage,
        confidence: 0.8,
        volatility: this.calculateAssetVolatility(asset),
        volume: this.calculateAssetVolume(asset),
        detectedAt: new Date(),
        maintenanceEvent: event
      };
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(asset, event.exchange, priceDifferencePercentage);
      
      // Skip if risk is too high
      if (riskScore > this.config.maxRiskScore) {
        continue;
      }
      
      // Calculate confidence
      const confidence = this.calculateConfidence(asset, event.exchange, priceDifferencePercentage);
      
      // Skip if confidence is too low
      if (confidence < this.config.minConfidence) {
        continue;
      }
      
      // Create opportunity
      const opportunity: MaintenanceArbitrageOpportunity = {
        id: uuidv4(),
        asset,
        maintenanceExchange: event.exchange,
        referenceExchanges: [minPrice.exchange, maxPrice.exchange],
        priceDiscrepancy,
        expectedProfit: priceDifference,
        expectedProfitPercentage: priceDifferencePercentage,
        executionStrategy: 'cross_exchange',
        optimalEntryTime: new Date(),
        optimalExitTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        riskScore,
        confidence,
        detectedAt: new Date(),
        status: 'active',
        notes: [
          `Cross-exchange opportunity detected during ${event.exchange} maintenance`,
          `Buy on ${minPrice.exchange} @ ${minPrice.price.toFixed(2)}, Sell on ${maxPrice.exchange} @ ${maxPrice.price.toFixed(2)}`,
          `Price difference: ${priceDifference.toFixed(2)} (${priceDifferencePercentage.toFixed(2)}%)`,
          `Risk score: ${riskScore.toFixed(1)}/10, Confidence: ${(confidence * 100).toFixed(1)}%`
        ]
      };
      
      // Store opportunity
      this.opportunities.set(opportunity.id, opportunity);
      
      console.log(`💰 CROSS-EXCHANGE ARBITRAGE OPPORTUNITY DETECTED: ${asset}`);
      console.log(`📊 Buy on ${minPrice.exchange} @ ${minPrice.price.toFixed(2)}, Sell on ${maxPrice.exchange} @ ${maxPrice.price.toFixed(2)}`);
      console.log(`📊 Price difference: ${priceDifference.toFixed(2)} (${priceDifferencePercentage.toFixed(2)}%)`);
      
      // Emit opportunity detected event
      this.emit('opportunityDetected', opportunity);
      
      // Create trade if confidence is high enough
      if (confidence >= this.config.minConfidence) {
        this.createMaintenanceArbitrageTrade(opportunity);
      }
    }
  } 
 /**
   * Update active opportunities
   */
  private updateActiveOpportunities(): void {
    // Update status of active opportunities
    for (const opportunity of this.opportunities.values()) {
      // Skip non-active opportunities
      if (opportunity.status !== 'active') {
        continue;
      }
      
      // Check if opportunity has expired
      const now = new Date();
      const timeSinceDetection = now.getTime() - opportunity.detectedAt.getTime();
      
      if (timeSinceDetection > this.config.maxWaitTimeMinutes * 60 * 1000) {
        opportunity.status = 'expired';
        opportunity.notes.push(`Opportunity expired at ${now.toISOString()}`);
        continue;
      }
      
      // Check if maintenance has ended
      if (opportunity.priceDiscrepancy.maintenanceEvent.actualEndTime !== null) {
        // For pre-maintenance opportunities, check if we missed the window
        if (opportunity.executionStrategy === 'pre_maintenance') {
          opportunity.status = 'expired';
          opportunity.notes.push(`Maintenance ended before opportunity could be executed`);
          continue;
        }
      }
      
      // Update reference prices
      const symbol = `${opportunity.asset}/USDT`;
      const referencePrices: number[] = [];
      
      for (const refExchange of opportunity.referenceExchanges) {
        const refExchangePrices = this.lastPrices.get(refExchange);
        if (refExchangePrices) {
          const refPrice = refExchangePrices.get(symbol);
          if (refPrice) {
            referencePrices.push(refPrice);
          }
        }
      }
      
      if (referencePrices.length > 0) {
        const avgReferencePrice = referencePrices.reduce((sum, p) => sum + p, 0) / referencePrices.length;
        opportunity.priceDiscrepancy.currentReferencePrice = avgReferencePrice;
      }
    }
  }
  
  /**
   * Create maintenance arbitrage trade
   * @param opportunity Maintenance arbitrage opportunity
   */
  private createMaintenanceArbitrageTrade(opportunity: MaintenanceArbitrageOpportunity): void {
    // Check if we already have too many active trades
    if (this.activeTrades.size >= this.config.maxActiveTrades) {
      console.log(`⚠️ Maximum active trades (${this.config.maxActiveTrades}) reached, skipping trade`);
      return;
    }
    
    console.log(`🔧 CREATING MAINTENANCE ARBITRAGE TRADE: ${opportunity.asset}`);
    
    // Determine trade details based on execution strategy
    let entryExchange: string;
    let entrySide: 'buy' | 'sell';
    let entryPrice: number;
    let exitExchange: string;
    let exitSide: 'buy' | 'sell';
    
    if (opportunity.executionStrategy === 'pre_maintenance') {
      // For pre-maintenance, we position before maintenance and exit after
      entryExchange = opportunity.maintenanceExchange;
      entrySide = opportunity.priceDiscrepancy.priceDifferencePercentage > 0 ? 'buy' : 'sell';
      entryPrice = opportunity.priceDiscrepancy.priceBeforeMaintenance;
      exitExchange = opportunity.maintenanceExchange;
      exitSide = entrySide === 'buy' ? 'sell' : 'buy';
    } else if (opportunity.executionStrategy === 'post_maintenance') {
      // For post-maintenance, we exploit price gaps after restart
      entryExchange = opportunity.maintenanceExchange;
      entrySide = opportunity.priceDiscrepancy.priceDifferencePercentage < 0 ? 'buy' : 'sell';
      entryPrice = opportunity.priceDiscrepancy.currentReferencePrice;
      exitExchange = opportunity.referenceExchanges[0];
      exitSide = entrySide === 'buy' ? 'sell' : 'buy';
    } else {
      // For cross-exchange, we arbitrage between exchanges during maintenance
      if (opportunity.priceDiscrepancy.priceDifferencePercentage > 0) {
        entryExchange = opportunity.referenceExchanges[0]; // Buy on cheaper exchange
        entrySide = 'buy';
        entryPrice = opportunity.priceDiscrepancy.currentReferencePrice;
        exitExchange = opportunity.referenceExchanges[1]; // Sell on more expensive exchange
        exitSide = 'sell';
      } else {
        entryExchange = opportunity.referenceExchanges[1]; // Buy on cheaper exchange
        entrySide = 'buy';
        entryPrice = opportunity.priceDiscrepancy.expectedPostMaintenancePrice;
        exitExchange = opportunity.referenceExchanges[0]; // Sell on more expensive exchange
        exitSide = 'sell';
      }
    }    //
 Calculate position size based on available capital
    const positionSize = this.calculatePositionSize(opportunity, entryPrice);
    
    // Create trade
    const trade: MaintenanceArbitrageTrade = {
      id: uuidv4(),
      opportunityId: opportunity.id,
      asset: opportunity.asset,
      maintenanceExchange: opportunity.maintenanceExchange,
      referenceExchange: opportunity.referenceExchanges[0],
      entryTrade: {
        exchange: entryExchange,
        side: entrySide,
        quantity: positionSize,
        price: entryPrice,
        executed: false,
        executionTime: null
      },
      exitTrade: {
        exchange: exitExchange,
        side: exitSide,
        quantity: positionSize,
        price: null,
        executed: false,
        executionTime: null
      },
      pnl: null,
      pnlPercentage: null,
      status: 'pending',
      entryTime: null,
      exitTime: null,
      notes: [
        `Created maintenance arbitrage trade for ${opportunity.asset}`,
        `Strategy: ${opportunity.executionStrategy}`,
        `Entry: ${entrySide} on ${entryExchange} @ ${entryPrice.toFixed(2)}`,
        `Exit: ${exitSide} on ${exitExchange} (price TBD)`,
        `Expected profit: ${opportunity.expectedProfitPercentage.toFixed(2)}%`
      ]
    };
    
    // Store trade
    this.activeTrades.set(trade.id, trade);
    
    // Update opportunity status
    opportunity.status = 'executed';
    this.opportunities.set(opportunity.id, opportunity);
    
    console.log(`📊 TRADE CREATED: ${entrySide} on ${entryExchange}, ${exitSide} on ${exitExchange}`);
    console.log(`📊 Quantity: ${positionSize}, Expected profit: ${opportunity.expectedProfitPercentage.toFixed(2)}%`);
    
    // Emit trade created event
    this.emit('tradeCreated', trade);
    
    // Execute trade
    this.executeTrade(trade);
  }
  
  /**
   * Calculate position size
   * @param opportunity Maintenance arbitrage opportunity
   * @param price Price
   * @returns Position size
   */
  private calculatePositionSize(opportunity: MaintenanceArbitrageOpportunity, price: number): number {
    // Calculate maximum position size based on available capital and max position size
    const maxCapital = Math.min(this.accountBalance * 0.2, this.config.maxPositionSizeUsd);
    
    // Calculate position size based on price
    const maxSize = maxCapital / price;
    
    // Adjust position size based on confidence
    const confidenceMultiplier = 0.5 + (opportunity.confidence * 0.5); // 0.5-1.0 based on confidence
    
    // Adjust position size based on risk score
    const riskMultiplier = 1.0 - (opportunity.riskScore / 20); // 0.5-0.95 based on risk score
    
    // Calculate final position size
    const positionSize = maxSize * confidenceMultiplier * riskMultiplier;
    
    // Round to 4 decimal places
    return Math.floor(positionSize * 10000) / 10000;
  }  /**

   * Execute trade
   * @param trade Maintenance arbitrage trade
   */
  private async executeTrade(trade: MaintenanceArbitrageTrade): Promise<void> {
    console.log(`⚡ EXECUTING MAINTENANCE ARBITRAGE TRADE: ${trade.asset}...`);
    
    try {
      // In a real implementation, this would execute the trades on the exchanges
      // For now, we'll simulate execution
      
      // Execute entry trade
      trade.entryTrade.executed = true;
      trade.entryTrade.executionTime = new Date();
      
      // Add note
      trade.notes.push(`Executed entry trade on ${trade.entryTrade.exchange} at ${trade.entryTrade.executionTime.toISOString()}`);
      
      // Update trade status
      trade.status = 'partial';
      trade.entryTime = new Date();
      
      console.log(`✅ ENTRY TRADE EXECUTED: ${trade.entryTrade.side} on ${trade.entryTrade.exchange} @ ${trade.entryTrade.price.toFixed(2)}`);
      
      // For pre-maintenance strategy, we need to wait for maintenance to end
      if (trade.entryTrade.exchange === trade.maintenanceExchange && 
          trade.exitTrade.exchange === trade.maintenanceExchange) {
        console.log(`⏳ WAITING FOR MAINTENANCE TO END ON ${trade.maintenanceExchange}...`);
        return;
      }
      
      // For other strategies, execute exit trade immediately
      await this.executeExitTrade(trade);
      
    } catch (error) {
      console.error(`❌ ERROR EXECUTING TRADE: ${error}`);
      
      // Update trade status
      trade.status = 'failed';
      trade.notes.push(`Trade failed: ${error}`);
      
      // Emit trade failed event
      this.emit('tradeFailed', trade, error);
    }
  }
  
  /**
   * Execute exit trade
   * @param trade Maintenance arbitrage trade
   */
  private async executeExitTrade(trade: MaintenanceArbitrageTrade): Promise<void> {
    console.log(`⚡ EXECUTING EXIT TRADE: ${trade.asset}...`);
    
    try {
      // Get current price on exit exchange
      const exitExchangePrices = this.lastPrices.get(trade.exitTrade.exchange);
      if (!exitExchangePrices) {
        throw new Error(`No price data for ${trade.exitTrade.exchange}`);
      }
      
      const symbol = `${trade.asset}/USDT`;
      const exitPrice = exitExchangePrices.get(symbol);
      
      if (!exitPrice) {
        throw new Error(`No price data for ${symbol} on ${trade.exitTrade.exchange}`);
      }
      
      // Update exit trade
      trade.exitTrade.price = exitPrice;
      trade.exitTrade.executed = true;
      trade.exitTrade.executionTime = new Date();
      
      // Add note
      trade.notes.push(`Executed exit trade on ${trade.exitTrade.exchange} at ${trade.exitTrade.executionTime.toISOString()}`);
      
      // Calculate P&L
      let pnl: number;
      
      if (trade.entryTrade.side === 'buy' && trade.exitTrade.side === 'sell') {
        pnl = (trade.exitTrade.price - trade.entryTrade.price) * trade.entryTrade.quantity;
      } else {
        pnl = (trade.entryTrade.price - trade.exitTrade.price) * trade.entryTrade.quantity;
      }
      
      const pnlPercentage = (pnl / (trade.entryTrade.price * trade.entryTrade.quantity)) * 100;
      
      // Update trade
      trade.pnl = pnl;
      trade.pnlPercentage = pnlPercentage;
      trade.status = 'completed';
      trade.exitTime = new Date();
      
      // Add note
      trade.notes.push(`Trade completed with P&L: ${pnl.toFixed(2)} (${pnlPercentage.toFixed(2)}%)`);
      
      console.log(`✅ EXIT TRADE EXECUTED: ${trade.exitTrade.side} on ${trade.exitTrade.exchange} @ ${trade.exitTrade.price.toFixed(2)}`);
      console.log(`💰 P&L: ${pnl.toFixed(2)} (${pnlPercentage.toFixed(2)}%)`);
      
      // Move to completed trades
      this.completedTrades.push(trade);
      this.activeTrades.delete(trade.id);
      
      // Emit trade completed event
      this.emit('tradeCompleted', trade);
      
    } catch (error) {
      console.error(`❌ ERROR EXECUTING EXIT TRADE: ${error}`);
      
      // Update trade status
      trade.status = 'failed';
      trade.notes.push(`Exit trade failed: ${error}`);
      
      // Emit trade failed event
      this.emit('tradeFailed', trade, error);
    }
  }  /**
   
* Get exchange statuses
   * @returns Exchange statuses
   */
  getExchangeStatuses(): Map<string, ExchangeStatus> {
    return new Map(this.exchangeStatuses);
  }
  
  /**
   * Get maintenance events
   * @returns Maintenance events
   */
  getMaintenanceEvents(): MaintenanceEvent[] {
    return Array.from(this.maintenanceEvents.values());
  }
  
  /**
   * Get opportunities
   * @returns Maintenance arbitrage opportunities
   */
  getOpportunities(): MaintenanceArbitrageOpportunity[] {
    return Array.from(this.opportunities.values());
  }
  
  /**
   * Get active trades
   * @returns Active trades
   */
  getActiveTrades(): MaintenanceArbitrageTrade[] {
    return Array.from(this.activeTrades.values());
  }
  
  /**
   * Get completed trades
   * @returns Completed trades
   */
  getCompletedTrades(): MaintenanceArbitrageTrade[] {
    return this.completedTrades;
  }
  
  /**
   * Get statistics
   * @returns Statistics
   */
  getStatistics(): any {
    // Calculate success rate
    const successfulTrades = this.completedTrades.filter(t => t.pnl !== null && t.pnl > 0);
    const successRate = this.completedTrades.length > 0
      ? successfulTrades.length / this.completedTrades.length
      : 0;
    
    // Calculate average profit
    const totalPnl = this.completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgPnl = this.completedTrades.length > 0
      ? totalPnl / this.completedTrades.length
      : 0;
    
    // Calculate average profit percentage
    const totalPnlPercentage = this.completedTrades.reduce((sum, t) => sum + (t.pnlPercentage || 0), 0);
    const avgPnlPercentage = this.completedTrades.length > 0
      ? totalPnlPercentage / this.completedTrades.length
      : 0;
    
    // Calculate strategy statistics
    const strategyStats = new Map<string, { trades: number, successRate: number, avgPnl: number }>();
    
    for (const strategy of ['pre_maintenance', 'post_maintenance', 'cross_exchange']) {
      const strategyTrades = this.completedTrades.filter(t => {
        const opportunity = this.opportunities.get(t.opportunityId);
        return opportunity && opportunity.executionStrategy === strategy;
      });
      
      const strategySuccessfulTrades = strategyTrades.filter(t => t.pnl !== null && t.pnl > 0);
      const strategyTotalPnl = strategyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      strategyStats.set(strategy, {
        trades: strategyTrades.length,
        successRate: strategyTrades.length > 0 ? strategySuccessfulTrades.length / strategyTrades.length : 0,
        avgPnl: strategyTrades.length > 0 ? strategyTotalPnl / strategyTrades.length : 0
      });
    }
    
    // Calculate exchange statistics
    const exchangeStats = new Map<string, { maintenanceEvents: number, avgDuration: number }>();
    
    for (const exchange of this.config.monitoredExchanges) {
      const exchangeEvents = Array.from(this.maintenanceEvents.values())
        .filter(e => e.exchange === exchange && e.actualEndTime !== null);
      
      const totalDuration = exchangeEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
      
      exchangeStats.set(exchange, {
        maintenanceEvents: exchangeEvents.length,
        avgDuration: exchangeEvents.length > 0 ? totalDuration / exchangeEvents.length / (60 * 1000) : 0 // minutes
      });
    }
    
    return {
      exchangeStatuses: Object.fromEntries(this.exchangeStatuses),
      maintenanceEvents: this.maintenanceEvents.size,
      opportunities: this.opportunities.size,
      activeTrades: this.activeTrades.size,
      completedTrades: this.completedTrades.length,
      successfulTrades: successfulTrades.length,
      failedTrades: this.completedTrades.length - successfulTrades.length,
      successRate: successRate * 100,
      totalPnl,
      avgPnl,
      avgPnlPercentage,
      strategyStats: Object.fromEntries(strategyStats),
      exchangeStats: Object.fromEntries(exchangeStats),
      isRunning: this.isRunning,
      config: this.config
    };
  }
  
  /**
   * Update configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<ExchangeMaintenanceArbitrageConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Updated exchange maintenance arbitrage configuration');
  }
  
  /**
   * Stop the exchange maintenance arbitrage system
   */
  stop(): void {
    console.log('🛑 STOPPING EXCHANGE MAINTENANCE ARBITRAGE SYSTEM...');
    
    // Clear intervals
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    if (this.maintenanceCheckInterval) {
      clearInterval(this.maintenanceCheckInterval);
      this.maintenanceCheckInterval = null;
    }
    
    this.isRunning = false;
    console.log('🛑 EXCHANGE MAINTENANCE ARBITRAGE SYSTEM STOPPED');
  }
}

export default ExchangeMaintenanceArbitrage;
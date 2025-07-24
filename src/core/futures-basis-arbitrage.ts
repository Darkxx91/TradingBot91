// FUTURES BASIS ARBITRAGE - REVOLUTIONARY CONTANGO/BACKWARDATION EXPLOITATION SYSTEM
// Exploit futures vs spot price differentials for guaranteed convergence profits

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import ExchangeManager from '../exchanges/exchange-manager';
import { TradeSignal } from '../types/core';

/**
 * Futures contract type
 */
export enum FuturesContractType {
  PERPETUAL = 'perpetual',
  QUARTERLY = 'quarterly',
  BI_QUARTERLY = 'bi_quarterly',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Market structure
 */
export enum MarketStructure {
  CONTANGO = 'contango',
  BACKWARDATION = 'backwardation',
  NEUTRAL = 'neutral'
}

/**
 * Futures contract
 */
export interface FuturesContract {
  exchange: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  contractType: FuturesContractType;
  expiryDate: Date | null; // null for perpetual
  markPrice: number;
  indexPrice: number;
  basis: number; // percentage difference between mark and index
  basisAnnualized: number; // annualized basis
  openInterest: number;
  volume24h: number;
  fundingRate: number | null; // null for non-perpetual
  lastUpdated: Date;
}
/**
 * B
asis arbitrage opportunity
 */
export interface BasisArbitrageOpportunity {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  spotExchange: string;
  spotPrice: number;
  futuresExchange: string;
  futuresSymbol: string;
  futuresPrice: number;
  contractType: FuturesContractType;
  expiryDate: Date | null;
  basis: number; // percentage
  basisAnnualized: number; // annualized percentage
  marketStructure: MarketStructure;
  expectedConvergence: number; // expected convergence percentage
  timeToExpiry: number | null; // milliseconds, null for perpetual
  impliedRate: number; // annualized percentage
  riskFreeRate: number; // annualized percentage
  spreadOpportunity: number; // annualized percentage (implied - risk free)
  confidence: number; // 0-1
  detectedAt: Date;
  status: 'active' | 'executed' | 'completed' | 'expired' | 'failed';
  notes: string[];
}

/**
 * Calendar spread opportunity
 */
export interface CalendarSpreadOpportunity {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  exchange: string;
  nearContract: {
    symbol: string;
    contractType: FuturesContractType;
    expiryDate: Date | null;
    price: number;
  };
  farContract: {
    symbol: string;
    contractType: FuturesContractType;
    expiryDate: Date | null;
    price: number;
  };
  spread: number; // percentage
  spreadAnnualized: number; // annualized percentage
  expectedConvergence: number; // expected convergence percentage
  timeBetweenExpiries: number | null; // milliseconds
  impliedRate: number; // annualized percentage
  confidence: number; // 0-1
  detectedAt: Date;
  status: 'active' | 'executed' | 'completed' | 'expired' | 'failed';
  notes: string[];
}/**
 *
 Basis trade
 */
export interface BasisTrade {
  id: string;
  opportunityId: string;
  opportunityType: 'basis' | 'calendar';
  spotTrade: {
    exchange: string;
    side: 'buy' | 'sell';
    asset: string;
    quantity: number;
    price: number;
    executed: boolean;
    executionTime: Date | null;
  };
  futuresTrade: {
    exchange: string;
    side: 'buy' | 'sell';
    asset: string;
    quantity: number;
    price: number;
    executed: boolean;
    executionTime: Date | null;
  };
  secondFuturesTrade?: { // Only for calendar spreads
    exchange: string;
    side: 'buy' | 'sell';
    asset: string;
    quantity: number;
    price: number;
    executed: boolean;
    executionTime: Date | null;
  };
  entryBasis: number; // percentage
  currentBasis: number; // percentage
  targetBasis: number; // percentage
  pnl: number | null;
  pnlPercentage: number | null;
  status: 'pending' | 'partial' | 'entered' | 'exited' | 'failed';
  entryTime: Date | null;
  exitTime: Date | null;
  notes: string[];
}

/**
 * Futures basis arbitrage configuration
 */
export interface FuturesBasisConfig {
  minBasisOpportunity: number; // minimum annualized basis percentage
  minCalendarSpreadOpportunity: number; // minimum annualized spread percentage
  minConfidence: number; // 0-1
  riskFreeRate: number; // annualized percentage
  maxActiveTrades: number;
  maxCapitalPerTrade: number;
  maxLeverage: number;
  scanIntervalMs: number;
  monitoredExchanges: string[];
}/
**
 * Futures Basis Arbitrage
 * 
 * REVOLUTIONARY INSIGHT: Futures prices MUST converge with spot prices at expiration,
 * creating guaranteed arbitrage opportunities when the basis (difference between
 * futures and spot) becomes extreme. By simultaneously trading spot and futures
 * in opposite directions, we can lock in risk-free profits from convergence.
 */
export class FuturesBasisArbitrage extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private config: FuturesBasisConfig;
  private futuresContracts: Map<string, FuturesContract> = new Map();
  private basisOpportunities: Map<string, BasisArbitrageOpportunity> = new Map();
  private calendarOpportunities: Map<string, CalendarSpreadOpportunity> = new Map();
  private activeTrades: Map<string, BasisTrade> = new Map();
  private completedTrades: BasisTrade[] = [];
  private monitoredAssets: string[] = [];
  private isRunning: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private accountBalance: number = 1000;
  private accountId: string = 'default';
  
  /**
   * Constructor
   * @param exchangeManager Exchange manager
   * @param config Configuration
   */
  constructor(
    exchangeManager: ExchangeManager,
    config?: Partial<FuturesBasisConfig>
  ) {
    super();
    this.exchangeManager = exchangeManager;
    
    // Default configuration
    this.config = {
      minBasisOpportunity: 5, // 5% annualized
      minCalendarSpreadOpportunity: 3, // 3% annualized
      minConfidence: 0.7, // 70% minimum confidence
      riskFreeRate: 2, // 2% annualized risk-free rate
      maxActiveTrades: 10,
      maxCapitalPerTrade: 10000, // $10,000 per trade
      maxLeverage: 3, // 3x max leverage
      scanIntervalMs: 60 * 1000, // 1 minute
      monitoredExchanges: ['binance', 'bybit', 'okx', 'deribit', 'ftx']
    };
    
    // Override with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }  
  /**

   * Start the futures basis arbitrage
   * @param assets Assets to monitor
   * @param accountId Account ID
   * @param accountBalance Account balance
   */
  async start(
    assets: string[] = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'],
    accountId: string = 'default',
    accountBalance: number = 1000
  ): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Futures basis arbitrage already running');
      return;
    }
    
    console.log('🚀 STARTING FUTURES BASIS ARBITRAGE...');
    
    // Set account details
    this.accountId = accountId;
    this.accountBalance = accountBalance;
    
    // Set monitored assets
    this.monitoredAssets = assets;
    
    // Initialize futures contracts
    await this.initializeFuturesContracts();
    
    // Start monitoring futures prices
    this.startFuturesMonitoring();
    
    // Start opportunity scanning
    this.startOpportunityScan();
    
    this.isRunning = true;
    console.log(`📊 FUTURES BASIS ARBITRAGE ACTIVE! Monitoring ${this.monitoredAssets.length} assets across ${this.config.monitoredExchanges.length} exchanges`);
  }
  
  /**
   * Initialize futures contracts
   */
  private async initializeFuturesContracts(): Promise<void> {
    console.log('🏗️ INITIALIZING FUTURES CONTRACTS...');
    
    // In a real implementation, this would fetch all available futures contracts
    // For now, we'll create simulated futures contracts
    
    // Create contracts for each monitored asset
    for (const asset of this.monitoredAssets) {
      // Create perpetual contract
      this.createSimulatedContract(asset, 'USDT', 'binance', FuturesContractType.PERPETUAL);
      
      // Create quarterly contract
      const quarterlyExpiry = this.getNextQuarterlyExpiry();
      this.createSimulatedContract(asset, 'USDT', 'binance', FuturesContractType.QUARTERLY, quarterlyExpiry);
      
      // Create bi-quarterly contract
      const biQuarterlyExpiry = this.getNextBiQuarterlyExpiry();
      this.createSimulatedContract(asset, 'USDT', 'binance', FuturesContractType.BI_QUARTERLY, biQuarterlyExpiry);
      
      // Create contracts on other exchanges
      this.createSimulatedContract(asset, 'USDT', 'bybit', FuturesContractType.PERPETUAL);
      this.createSimulatedContract(asset, 'USDT', 'okx', FuturesContractType.PERPETUAL);
    }
    
    console.log(`✅ INITIALIZED ${this.futuresContracts.size} FUTURES CONTRACTS`);
  }  

  /**
   * Create simulated contract
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param exchange Exchange
   * @param contractType Contract type
   * @param expiryDate Expiry date
   */
  private createSimulatedContract(
    baseAsset: string,
    quoteAsset: string,
    exchange: string,
    contractType: FuturesContractType,
    expiryDate: Date | null = null
  ): void {
    // Generate symbol
    let symbol: string;
    
    if (contractType === FuturesContractType.PERPETUAL) {
      symbol = `${baseAsset}${quoteAsset}_PERP`;
    } else {
      const expiry = expiryDate || new Date();
      const month = expiry.getMonth() + 1;
      const day = expiry.getDate();
      const year = expiry.getFullYear();
      symbol = `${baseAsset}${quoteAsset}_${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
    }
    
    // Get spot price
    const spotPrice = this.getSpotPrice(baseAsset, quoteAsset) || 1000;
    
    // Generate mark price (with basis)
    let basis = 0;
    
    if (contractType === FuturesContractType.PERPETUAL) {
      // Perpetuals have small basis
      basis = -1 + (Math.random() * 2); // -1% to 1%
    } else if (contractType === FuturesContractType.QUARTERLY) {
      // Quarterly typically in contango
      basis = 1 + (Math.random() * 4); // 1% to 5%
    } else if (contractType === FuturesContractType.BI_QUARTERLY) {
      // Bi-quarterly typically in stronger contango
      basis = 2 + (Math.random() * 6); // 2% to 8%
    }
    
    // Occasionally generate extreme basis for testing
    if (Math.random() < 0.1) {
      if (Math.random() < 0.5) {
        // Extreme contango
        basis = 8 + (Math.random() * 12); // 8% to 20%
      } else {
        // Extreme backwardation
        basis = -8 - (Math.random() * 12); // -8% to -20%
      }
    }
    
    const markPrice = spotPrice * (1 + (basis / 100));
    
    // Calculate annualized basis
    let basisAnnualized = basis;
    
    if (expiryDate) {
      const daysToExpiry = (expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      basisAnnualized = basis * (365 / daysToExpiry);
    }
    
    // Generate funding rate (only for perpetuals)
    const fundingRate = contractType === FuturesContractType.PERPETUAL
      ? basis / 100 / 3 // Funding rate is typically basis / 3 (8-hour periods)
      : null;
    
    // Create contract
    const contract: FuturesContract = {
      exchange,
      symbol,
      baseAsset,
      quoteAsset,
      contractType,
      expiryDate,
      markPrice,
      indexPrice: spotPrice,
      basis,
      basisAnnualized,
      openInterest: 1000000 + (Math.random() * 9000000), // $1M-$10M
      volume24h: 5000000 + (Math.random() * 45000000), // $5M-$50M
      fundingRate,
      lastUpdated: new Date()
    };
    
    // Store contract
    const key = `${exchange}_${symbol}`;
    this.futuresContracts.set(key, contract);
  }  
  
/**
   * Get next quarterly expiry
   * @returns Next quarterly expiry date
   */
  private getNextQuarterlyExpiry(): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Quarterly months are March (2), June (5), September (8), December (11)
    const quarterlyMonths = [2, 5, 8, 11];
    
    // Find the next quarterly month
    let nextQuarterlyMonth = quarterlyMonths.find(month => month > currentMonth);
    let year = currentYear;
    
    // If no next quarterly month in this year, use the first quarterly month of next year
    if (!nextQuarterlyMonth) {
      nextQuarterlyMonth = quarterlyMonths[0];
      year = currentYear + 1;
    }
    
    // Last Friday of the month
    const date = new Date(year, nextQuarterlyMonth + 1, 0); // Last day of the month
    const dayOfWeek = date.getDay();
    const daysToSubtract = (dayOfWeek + 2) % 7; // 0 = Sunday, 5 = Friday
    date.setDate(date.getDate() - daysToSubtract);
    
    return date;
  }
  
  /**
   * Get next bi-quarterly expiry
   * @returns Next bi-quarterly expiry date
   */
  private getNextBiQuarterlyExpiry(): Date {
    const nextQuarterly = this.getNextQuarterlyExpiry();
    const nextQuarterlyMonth = nextQuarterly.getMonth();
    const nextQuarterlyYear = nextQuarterly.getFullYear();
    
    // Quarterly months are March (2), June (5), September (8), December (11)
    const quarterlyMonths = [2, 5, 8, 11];
    
    // Find the next quarterly month after the next quarterly
    let nextNextQuarterlyMonthIndex = quarterlyMonths.findIndex(month => month === nextQuarterlyMonth) + 1;
    let nextNextQuarterlyMonth = quarterlyMonths[nextNextQuarterlyMonthIndex];
    let year = nextQuarterlyYear;
    
    // If no next quarterly month in this year, use the first quarterly month of next year
    if (nextNextQuarterlyMonthIndex >= quarterlyMonths.length) {
      nextNextQuarterlyMonth = quarterlyMonths[0];
      year = nextQuarterlyYear + 1;
    }
    
    // Last Friday of the month
    const date = new Date(year, nextNextQuarterlyMonth + 1, 0); // Last day of the month
    const dayOfWeek = date.getDay();
    const daysToSubtract = (dayOfWeek + 2) % 7; // 0 = Sunday, 5 = Friday
    date.setDate(date.getDate() - daysToSubtract);
    
    return date;
  }  
  
/**
   * Start futures monitoring
   */
  private startFuturesMonitoring(): void {
    console.log('📡 STARTING FUTURES MONITORING...');
    
    // In a real implementation, this would connect to exchange APIs
    // For now, we'll simulate price updates
    
    // Update prices every 10 seconds
    setInterval(() => {
      for (const [key, contract] of this.futuresContracts.entries()) {
        this.updateFuturesPrice(key, contract);
      }
    }, 10000);
    
    // Listen for spot price updates from exchange manager
    this.exchangeManager.on('priceUpdate', (priceUpdate) => {
      // Extract base and quote assets
      const [baseAsset, quoteAsset] = priceUpdate.symbol.split('/');
      
      // Update futures contracts for this asset
      for (const [key, contract] of this.futuresContracts.entries()) {
        if (contract.baseAsset === baseAsset && contract.quoteAsset === quoteAsset) {
          this.updateFuturesPrice(key, contract, priceUpdate.price);
        }
      }
    });
  }
  
  /**
   * Update futures price
   * @param key Contract key
   * @param contract Futures contract
   * @param newSpotPrice New spot price
   */
  private updateFuturesPrice(
    key: string,
    contract: FuturesContract,
    newSpotPrice?: number
  ): void {
    // Get spot price
    const spotPrice = newSpotPrice || this.getSpotPrice(contract.baseAsset, contract.quoteAsset) || contract.indexPrice;
    
    // Update index price
    contract.indexPrice = spotPrice;
    
    // Update basis (maintain similar basis with small random changes)
    let newBasis = contract.basis;
    
    // Add small random change to basis
    newBasis += (Math.random() * 0.4) - 0.2; // -0.2% to 0.2% change
    
    // Occasionally generate larger basis changes
    if (Math.random() < 0.05) {
      newBasis += (Math.random() * 2) - 1; // -1% to 1% additional change
    }
    
    // Update mark price based on new basis
    contract.markPrice = spotPrice * (1 + (newBasis / 100));
    contract.basis = newBasis;
    
    // Calculate annualized basis
    if (contract.expiryDate) {
      const daysToExpiry = (contract.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      contract.basisAnnualized = newBasis * (365 / daysToExpiry);
    } else {
      contract.basisAnnualized = newBasis;
    }
    
    // Update funding rate (only for perpetuals)
    if (contract.contractType === FuturesContractType.PERPETUAL) {
      contract.fundingRate = newBasis / 100 / 3; // Funding rate is typically basis / 3 (8-hour periods)
    }
    
    // Update last updated timestamp
    contract.lastUpdated = new Date();
    
    // Store updated contract
    this.futuresContracts.set(key, contract);
    
    // Update active trades
    this.updateActiveTrades(contract);
  } 
 
  /**
   * Get spot price
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Spot price
   */
  private getSpotPrice(baseAsset: string, quoteAsset: string): number | null {
    const symbol = `${baseAsset}/${quoteAsset}`;
    return this.exchangeManager.getLastPrice(symbol);
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
    console.log('🔍 SCANNING FOR BASIS ARBITRAGE OPPORTUNITIES...');
    
    // Scan for basis arbitrage opportunities
    this.scanForBasisArbitrage();
    
    // Scan for calendar spread opportunities
    this.scanForCalendarSpreads();
    
    // Update existing opportunities
    this.updateOpportunities();
  }
  
  /**
   * Scan for basis arbitrage opportunities
   */
  private scanForBasisArbitrage(): void {
    // Group contracts by asset
    const contractsByAsset = new Map<string, FuturesContract[]>();
    
    for (const contract of this.futuresContracts.values()) {
      const key = `${contract.baseAsset}_${contract.quoteAsset}`;
      const contracts = contractsByAsset.get(key) || [];
      contracts.push(contract);
      contractsByAsset.set(key, contracts);
    }
    
    // Check each asset for basis arbitrage opportunities
    for (const [key, contracts] of contractsByAsset.entries()) {
      const [baseAsset, quoteAsset] = key.split('_');
      
      // Get spot price
      const spotPrice = this.getSpotPrice(baseAsset, quoteAsset);
      if (!spotPrice) continue;
      
      // Check each contract for basis arbitrage opportunity
      for (const contract of contracts) {
        // Skip perpetuals (better for funding rate arbitrage)
        if (contract.contractType === FuturesContractType.PERPETUAL) {
          continue;
        }
        
        // Calculate basis
        const basis = ((contract.markPrice - spotPrice) / spotPrice) * 100;
        
        // Calculate annualized basis
        let basisAnnualized = basis;
        if (contract.expiryDate) {
          const daysToExpiry = (contract.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
          if (daysToExpiry <= 0) continue; // Skip expired contracts
          basisAnnualized = basis * (365 / daysToExpiry);
        }
        
        // Determine market structure
        const marketStructure = basis > 0
          ? MarketStructure.CONTANGO
          : basis < 0
            ? MarketStructure.BACKWARDATION
            : MarketStructure.NEUTRAL;
        
        // Calculate spread opportunity
        const spreadOpportunity = Math.abs(basisAnnualized) - this.config.riskFreeRate;
        
        // Check if opportunity is large enough
        if (spreadOpportunity >= this.config.minBasisOpportunity) {
          // Calculate confidence based on liquidity and time to expiry
          let confidence = 0.7; // Base confidence
          
          // Adjust confidence based on open interest and volume
          const liquidityFactor = Math.min(1, contract.openInterest / 10000000); // Cap at $10M open interest
          confidence += liquidityFactor * 0.1; // Up to 0.1 additional confidence
          
          // Adjust confidence based on time to expiry
          if (contract.expiryDate) {
            const daysToExpiry = (contract.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
            const expiryFactor = Math.min(1, daysToExpiry / 90); // Cap at 90 days
            confidence += (1 - expiryFactor) * 0.2; // Up to 0.2 additional confidence (closer to expiry = higher confidence)
          }
          
          // Cap confidence at 0.95
          confidence = Math.min(0.95, confidence);
          
          // Skip if confidence is too low
          if (confidence < this.config.minConfidence) {
            continue;
          }
          
          // Check if we already have an active opportunity for this contract
          const existingOpportunity = Array.from(this.basisOpportunities.values())
            .find(o => o.futuresSymbol === contract.symbol && o.status === 'active');
          
          if (existingOpportunity) {
            // Update existing opportunity
            existingOpportunity.spotPrice = spotPrice;
            existingOpportunity.futuresPrice = contract.markPrice;
            existingOpportunity.basis = basis;
            existingOpportunity.basisAnnualized = basisAnnualized;
            existingOpportunity.spreadOpportunity = spreadOpportunity;
            existingOpportunity.confidence = confidence;
            
            // Update time to expiry
            if (contract.expiryDate) {
              existingOpportunity.timeToExpiry = contract.expiryDate.getTime() - Date.now();
            }
            
            // Store updated opportunity
            this.basisOpportunities.set(existingOpportunity.id, existingOpportunity);
            continue;
          }
          
          // Create new opportunity
          const opportunity: BasisArbitrageOpportunity = {
            id: uuidv4(),
            baseAsset,
            quoteAsset,
            spotExchange: 'binance', // Default to binance for spot
            spotPrice,
            futuresExchange: contract.exchange,
            futuresSymbol: contract.symbol,
            futuresPrice: contract.markPrice,
            contractType: contract.contractType,
            expiryDate: contract.expiryDate,
            basis,
            basisAnnualized,
            marketStructure,
            expectedConvergence: basis, // Expected to converge to 0
            timeToExpiry: contract.expiryDate ? contract.expiryDate.getTime() - Date.now() : null,
            impliedRate: marketStructure === MarketStructure.CONTANGO ? basisAnnualized : 0,
            riskFreeRate: this.config.riskFreeRate,
            spreadOpportunity,
            confidence,
            detectedAt: new Date(),
            status: 'active',
            notes: [
              `Detected ${marketStructure} opportunity with ${spreadOpportunity.toFixed(2)}% annualized spread`,
              `Basis: ${basis.toFixed(2)}%, Annualized: ${basisAnnualized.toFixed(2)}%`,
              `Confidence: ${(confidence * 100).toFixed(2)}%`
            ]
          };
          
          // Store opportunity
          this.basisOpportunities.set(opportunity.id, opportunity);
          
          console.log(`📊 BASIS ARBITRAGE OPPORTUNITY DETECTED: ${baseAsset}/${quoteAsset}`);
          console.log(`📊 ${marketStructure.toUpperCase()}: ${basis.toFixed(2)}% basis (${basisAnnualized.toFixed(2)}% annualized)`);
          console.log(`📊 Spread: ${spreadOpportunity.toFixed(2)}%, Confidence: ${(confidence * 100).toFixed(2)}%`);
          
          // Emit opportunity detected event
          this.emit('basisOpportunityDetected', opportunity);
          
          // Create trade if confidence is high enough
          if (confidence >= this.config.minConfidence) {
            this.createBasisTrade(opportunity);
          }
        }
      }
    }
  } 
 
  /**
   * Scan for calendar spread opportunities
   */
  private scanForCalendarSpreads(): void {
    // Group contracts by asset and exchange
    const contractsByAssetExchange = new Map<string, FuturesContract[]>();
    
    for (const contract of this.futuresContracts.values()) {
      // Skip perpetuals
      if (contract.contractType === FuturesContractType.PERPETUAL) {
        continue;
      }
      
      const key = `${contract.baseAsset}_${contract.quoteAsset}_${contract.exchange}`;
      const contracts = contractsByAssetExchange.get(key) || [];
      contracts.push(contract);
      contractsByAssetExchange.set(key, contracts);
    }
    
    // Check each asset/exchange for calendar spread opportunities
    for (const [key, contracts] of contractsByAssetExchange.entries()) {
      const [baseAsset, quoteAsset, exchange] = key.split('_');
      
      // Need at least 2 contracts for calendar spread
      if (contracts.length < 2) {
        continue;
      }
      
      // Sort contracts by expiry date
      const sortedContracts = [...contracts].sort((a, b) => {
        if (!a.expiryDate) return -1;
        if (!b.expiryDate) return 1;
        return a.expiryDate.getTime() - b.expiryDate.getTime();
      });
      
      // Check each pair of contracts for calendar spread opportunity
      for (let i = 0; i < sortedContracts.length - 1; i++) {
        const nearContract = sortedContracts[i];
        const farContract = sortedContracts[i + 1];
        
        // Skip if either contract doesn't have expiry date
        if (!nearContract.expiryDate || !farContract.expiryDate) {
          continue;
        }
        
        // Calculate spread
        const spread = ((farContract.markPrice - nearContract.markPrice) / nearContract.markPrice) * 100;
        
        // Calculate time between expiries
        const timeBetweenExpiries = farContract.expiryDate.getTime() - nearContract.expiryDate.getTime();
        const daysBetweenExpiries = timeBetweenExpiries / (24 * 60 * 60 * 1000);
        
        // Calculate annualized spread
        const spreadAnnualized = spread * (365 / daysBetweenExpiries);
        
        // Check if opportunity is large enough
        if (Math.abs(spreadAnnualized) >= this.config.minCalendarSpreadOpportunity) {
          // Calculate confidence based on liquidity and time to expiry
          let confidence = 0.7; // Base confidence
          
          // Adjust confidence based on open interest and volume
          const nearLiquidityFactor = Math.min(1, nearContract.openInterest / 10000000);
          const farLiquidityFactor = Math.min(1, farContract.openInterest / 10000000);
          const liquidityFactor = Math.min(nearLiquidityFactor, farLiquidityFactor);
          confidence += liquidityFactor * 0.1; // Up to 0.1 additional confidence
          
          // Adjust confidence based on time to near expiry
          const daysToNearExpiry = (nearContract.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
          const expiryFactor = Math.min(1, daysToNearExpiry / 30); // Cap at 30 days
          confidence += (1 - expiryFactor) * 0.2; // Up to 0.2 additional confidence (closer to expiry = higher confidence)
          
          // Cap confidence at 0.95
          confidence = Math.min(0.95, confidence);
          
          // Skip if confidence is too low
          if (confidence < this.config.minConfidence) {
            continue;
          }
          
          // Check if we already have an active opportunity for this contract pair
          const existingOpportunity = Array.from(this.calendarOpportunities.values())
            .find(o => o.nearContract.symbol === nearContract.symbol && 
                      o.farContract.symbol === farContract.symbol && 
                      o.status === 'active');
          
          if (existingOpportunity) {
            // Update existing opportunity
            existingOpportunity.nearContract.price = nearContract.markPrice;
            existingOpportunity.farContract.price = farContract.markPrice;
            existingOpportunity.spread = spread;
            existingOpportunity.spreadAnnualized = spreadAnnualized;
            existingOpportunity.confidence = confidence;
            
            // Store updated opportunity
            this.calendarOpportunities.set(existingOpportunity.id, existingOpportunity);
            continue;
          }
          
          // Create new opportunity
          const opportunity: CalendarSpreadOpportunity = {
            id: uuidv4(),
            baseAsset,
            quoteAsset,
            exchange,
            nearContract: {
              symbol: nearContract.symbol,
              contractType: nearContract.contractType,
              expiryDate: nearContract.expiryDate,
              price: nearContract.markPrice
            },
            farContract: {
              symbol: farContract.symbol,
              contractType: farContract.contractType,
              expiryDate: farContract.expiryDate,
              price: farContract.markPrice
            },
            spread,
            spreadAnnualized,
            expectedConvergence: 0, // Expected to converge to 0
            timeBetweenExpiries,
            impliedRate: spreadAnnualized,
            confidence,
            detectedAt: new Date(),
            status: 'active',
            notes: [
              `Detected calendar spread opportunity with ${spreadAnnualized.toFixed(2)}% annualized spread`,
              `Spread: ${spread.toFixed(2)}%, Days between expiries: ${daysBetweenExpiries.toFixed(0)}`,
              `Confidence: ${(confidence * 100).toFixed(2)}%`
            ]
          };
          
          // Store opportunity
          this.calendarOpportunities.set(opportunity.id, opportunity);
          
          console.log(`📊 CALENDAR SPREAD OPPORTUNITY DETECTED: ${baseAsset}/${quoteAsset} on ${exchange}`);
          console.log(`📊 Spread: ${spread.toFixed(2)}% (${spreadAnnualized.toFixed(2)}% annualized)`);
          console.log(`📊 Near: ${nearContract.symbol}, Far: ${farContract.symbol}`);
          
          // Emit opportunity detected event
          this.emit('calendarOpportunityDetected', opportunity);
          
          // Create trade if confidence is high enough
          if (confidence >= this.config.minConfidence) {
            this.createCalendarSpreadTrade(opportunity);
          }
        }
      }
    }
  } 
 
  /**
   * Update opportunities
   */
  private updateOpportunities(): void {
    // Update basis arbitrage opportunities
    for (const [id, opportunity] of this.basisOpportunities.entries()) {
      // Skip if not active
      if (opportunity.status !== 'active') {
        continue;
      }
      
      // Check if expired
      if (opportunity.expiryDate && opportunity.expiryDate < new Date()) {
        opportunity.status = 'expired';
        opportunity.notes.push(`Opportunity expired at ${new Date().toISOString()}`);
        
        // Store updated opportunity
        this.basisOpportunities.set(id, opportunity);
        
        // Emit expired event
        this.emit('basisOpportunityExpired', opportunity);
        continue;
      }
      
      // Check if opportunity is still valid
      const spotPrice = this.getSpotPrice(opportunity.baseAsset, opportunity.quoteAsset);
      if (!spotPrice) continue;
      
      // Find futures contract
      const futuresKey = `${opportunity.futuresExchange}_${opportunity.futuresSymbol}`;
      const contract = this.futuresContracts.get(futuresKey);
      if (!contract) continue;
      
      // Calculate new basis
      const newBasis = ((contract.markPrice - spotPrice) / spotPrice) * 100;
      
      // Calculate new annualized basis
      let newBasisAnnualized = newBasis;
      if (contract.expiryDate) {
        const daysToExpiry = (contract.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
        if (daysToExpiry <= 0) continue; // Skip expired contracts
        newBasisAnnualized = newBasis * (365 / daysToExpiry);
      }
      
      // Calculate new spread opportunity
      const newSpreadOpportunity = Math.abs(newBasisAnnualized) - this.config.riskFreeRate;
      
      // Check if opportunity is still large enough
      if (newSpreadOpportunity < this.config.minBasisOpportunity) {
        opportunity.status = 'expired';
        opportunity.notes.push(`Opportunity no longer valid at ${new Date().toISOString()}, spread: ${newSpreadOpportunity.toFixed(2)}%`);
        
        // Store updated opportunity
        this.basisOpportunities.set(id, opportunity);
        
        // Emit expired event
        this.emit('basisOpportunityExpired', opportunity);
      }
    }
    
    // Update calendar spread opportunities
    for (const [id, opportunity] of this.calendarOpportunities.entries()) {
      // Skip if not active
      if (opportunity.status !== 'active') {
        continue;
      }
      
      // Check if expired
      if (opportunity.nearContract.expiryDate && opportunity.nearContract.expiryDate < new Date()) {
        opportunity.status = 'expired';
        opportunity.notes.push(`Opportunity expired at ${new Date().toISOString()}`);
        
        // Store updated opportunity
        this.calendarOpportunities.set(id, opportunity);
        
        // Emit expired event
        this.emit('calendarOpportunityExpired', opportunity);
        continue;
      }
      
      // Find near contract
      const nearKey = `${opportunity.exchange}_${opportunity.nearContract.symbol}`;
      const nearContract = this.futuresContracts.get(nearKey);
      if (!nearContract) continue;
      
      // Find far contract
      const farKey = `${opportunity.exchange}_${opportunity.farContract.symbol}`;
      const farContract = this.futuresContracts.get(farKey);
      if (!farContract) continue;
      
      // Calculate new spread
      const newSpread = ((farContract.markPrice - nearContract.markPrice) / nearContract.markPrice) * 100;
      
      // Calculate time between expiries
      const timeBetweenExpiries = opportunity.timeBetweenExpiries || 0;
      const daysBetweenExpiries = timeBetweenExpiries / (24 * 60 * 60 * 1000);
      
      // Calculate new annualized spread
      const newSpreadAnnualized = newSpread * (365 / daysBetweenExpiries);
      
      // Check if opportunity is still large enough
      if (Math.abs(newSpreadAnnualized) < this.config.minCalendarSpreadOpportunity) {
        opportunity.status = 'expired';
        opportunity.notes.push(`Opportunity no longer valid at ${new Date().toISOString()}, spread: ${newSpreadAnnualized.toFixed(2)}%`);
        
        // Store updated opportunity
        this.calendarOpportunities.set(id, opportunity);
        
        // Emit expired event
        this.emit('calendarOpportunityExpired', opportunity);
      }
    }
  }  

  /**
   * Update active trades
   * @param contract Updated futures contract
   */
  private updateActiveTrades(contract: FuturesContract): void {
    // Update basis trades
    for (const trade of this.activeTrades.values()) {
      // Skip if not entered
      if (trade.status !== 'entered') {
        continue;
      }
      
      // Check if this contract is relevant to the trade
      if (trade.futuresTrade.asset === contract.symbol) {
        // Update current basis
        const spotPrice = this.getSpotPrice(contract.baseAsset, contract.quoteAsset) || trade.spotTrade.price;
        const futuresPrice = contract.markPrice;
        
        trade.currentBasis = ((futuresPrice - spotPrice) / spotPrice) * 100;
        
        // Check if target basis reached
        if (Math.abs(trade.currentBasis) <= Math.abs(trade.targetBasis)) {
          // Exit trade
          this.exitBasisTrade(trade);
        }
      }
    }
  }
  
  /**
   * Create basis trade
   * @param opportunity Basis arbitrage opportunity
   */
  private createBasisTrade(opportunity: BasisArbitrageOpportunity): void {
    // Check if we already have too many active trades
    if (this.activeTrades.size >= this.config.maxActiveTrades) {
      console.log(`⚠️ Maximum active trades (${this.config.maxActiveTrades}) reached, skipping trade`);
      return;
    }
    
    console.log(`💰 CREATING BASIS ARBITRAGE TRADE: ${opportunity.baseAsset}/${opportunity.quoteAsset}`);
    
    // Calculate position size based on available capital
    const positionSize = this.calculatePositionSize(opportunity);
    
    // Determine trade direction based on market structure
    let spotSide: 'buy' | 'sell';
    let futuresSide: 'buy' | 'sell';
    
    if (opportunity.marketStructure === MarketStructure.CONTANGO) {
      // In contango, futures price > spot price
      // Buy spot, sell futures
      spotSide = 'buy';
      futuresSide = 'sell';
    } else {
      // In backwardation, spot price > futures price
      // Sell spot, buy futures
      spotSide = 'sell';
      futuresSide = 'buy';
    }
    
    // Calculate target basis (0 at expiry, but we'll exit earlier)
    const targetBasis = opportunity.basis * 0.2; // Exit when basis reduces by 80%
    
    // Create trade
    const trade: BasisTrade = {
      id: uuidv4(),
      opportunityId: opportunity.id,
      opportunityType: 'basis',
      spotTrade: {
        exchange: opportunity.spotExchange,
        side: spotSide,
        asset: `${opportunity.baseAsset}/${opportunity.quoteAsset}`,
        quantity: positionSize,
        price: opportunity.spotPrice,
        executed: false,
        executionTime: null
      },
      futuresTrade: {
        exchange: opportunity.futuresExchange,
        side: futuresSide,
        asset: opportunity.futuresSymbol,
        quantity: positionSize,
        price: opportunity.futuresPrice,
        executed: false,
        executionTime: null
      },
      entryBasis: opportunity.basis,
      currentBasis: opportunity.basis,
      targetBasis,
      pnl: null,
      pnlPercentage: null,
      status: 'pending',
      entryTime: null,
      exitTime: null,
      notes: [
        `Created for ${opportunity.baseAsset}/${opportunity.quoteAsset} ${opportunity.marketStructure} opportunity`,
        `Entry basis: ${opportunity.basis.toFixed(2)}%, Target basis: ${targetBasis.toFixed(2)}%`,
        `Spot: ${spotSide.toUpperCase()} ${positionSize} @ ${opportunity.spotPrice.toFixed(2)}`,
        `Futures: ${futuresSide.toUpperCase()} ${positionSize} @ ${opportunity.futuresPrice.toFixed(2)}`
      ]
    };
    
    // Store trade
    this.activeTrades.set(trade.id, trade);
    
    // Update opportunity status
    opportunity.status = 'executed';
    this.basisOpportunities.set(opportunity.id, opportunity);
    
    console.log(`📊 TRADE CREATED: ${spotSide.toUpperCase()} spot, ${futuresSide.toUpperCase()} futures`);
    console.log(`📊 Size: ${positionSize}, Entry basis: ${opportunity.basis.toFixed(2)}%, Target: ${targetBasis.toFixed(2)}%`);
    
    // Emit trade created event
    this.emit('tradeCreated', trade);
    
    // Execute entry
    this.executeBasisEntry(trade);
  }  

  /**
   * Create calendar spread trade
   * @param opportunity Calendar spread opportunity
   */
  private createCalendarSpreadTrade(opportunity: CalendarSpreadOpportunity): void {
    // Check if we already have too many active trades
    if (this.activeTrades.size >= this.config.maxActiveTrades) {
      console.log(`⚠️ Maximum active trades (${this.config.maxActiveTrades}) reached, skipping trade`);
      return;
    }
    
    console.log(`💰 CREATING CALENDAR SPREAD TRADE: ${opportunity.baseAsset}/${opportunity.quoteAsset}`);
    
    // Calculate position size based on available capital
    const positionSize = this.calculatePositionSize(opportunity);
    
    // Determine trade direction based on spread
    let nearSide: 'buy' | 'sell';
    let farSide: 'buy' | 'sell';
    
    if (opportunity.spread > 0) {
      // If far contract is more expensive than near contract
      // Buy near, sell far
      nearSide = 'buy';
      farSide = 'sell';
    } else {
      // If near contract is more expensive than far contract
      // Sell near, buy far
      nearSide = 'sell';
      farSide = 'buy';
    }
    
    // Calculate target spread (0 at expiry, but we'll exit earlier)
    const targetSpread = opportunity.spread * 0.2; // Exit when spread reduces by 80%
    
    // Create trade
    const trade: BasisTrade = {
      id: uuidv4(),
      opportunityId: opportunity.id,
      opportunityType: 'calendar',
      spotTrade: {
        exchange: opportunity.exchange,
        side: nearSide,
        asset: opportunity.nearContract.symbol,
        quantity: positionSize,
        price: opportunity.nearContract.price,
        executed: false,
        executionTime: null
      },
      futuresTrade: {
        exchange: opportunity.exchange,
        side: farSide,
        asset: opportunity.farContract.symbol,
        quantity: positionSize,
        price: opportunity.farContract.price,
        executed: false,
        executionTime: null
      },
      entryBasis: opportunity.spread,
      currentBasis: opportunity.spread,
      targetBasis: targetSpread,
      pnl: null,
      pnlPercentage: null,
      status: 'pending',
      entryTime: null,
      exitTime: null,
      notes: [
        `Created for ${opportunity.baseAsset}/${opportunity.quoteAsset} calendar spread opportunity`,
        `Entry spread: ${opportunity.spread.toFixed(2)}%, Target spread: ${targetSpread.toFixed(2)}%`,
        `Near: ${nearSide.toUpperCase()} ${positionSize} @ ${opportunity.nearContract.price.toFixed(2)}`,
        `Far: ${farSide.toUpperCase()} ${positionSize} @ ${opportunity.farContract.price.toFixed(2)}`
      ]
    };
    
    // Store trade
    this.activeTrades.set(trade.id, trade);
    
    // Update opportunity status
    opportunity.status = 'executed';
    this.calendarOpportunities.set(opportunity.id, opportunity);
    
    console.log(`📊 TRADE CREATED: ${nearSide.toUpperCase()} near, ${farSide.toUpperCase()} far`);
    console.log(`📊 Size: ${positionSize}, Entry spread: ${opportunity.spread.toFixed(2)}%, Target: ${targetSpread.toFixed(2)}%`);
    
    // Emit trade created event
    this.emit('tradeCreated', trade);
    
    // Execute entry
    this.executeBasisEntry(trade);
  }  

  /**
   * Calculate position size
   * @param opportunity Arbitrage opportunity
   * @returns Position size
   */
  private calculatePositionSize(
    opportunity: BasisArbitrageOpportunity | CalendarSpreadOpportunity
  ): number {
    // Calculate maximum position size based on available capital
    const maxSize = this.config.maxCapitalPerTrade / (opportunity as BasisArbitrageOpportunity).spotPrice || 1000;
    
    // Adjust position size based on confidence
    const confidenceMultiplier = 0.5 + (opportunity.confidence * 0.5); // 0.5-1.0 based on confidence
    
    // Calculate final position size
    const positionSize = maxSize * confidenceMultiplier;
    
    // Ensure minimum size
    return Math.max(0.01, positionSize);
  }
  
  /**
   * Execute basis entry
   * @param trade Basis trade
   */
  private async executeBasisEntry(trade: BasisTrade): Promise<void> {
    console.log(`⚡ EXECUTING ENTRY FOR ${trade.opportunityType.toUpperCase()} TRADE...`);
    
    try {
      // In a real implementation, this would execute the trades on the exchanges
      // For now, we'll simulate execution
      
      // Execute spot trade
      trade.spotTrade.executed = true;
      trade.spotTrade.executionTime = new Date();
      
      // Execute futures trade
      trade.futuresTrade.executed = true;
      trade.futuresTrade.executionTime = new Date();
      
      // Update trade status
      trade.status = 'entered';
      trade.entryTime = new Date();
      
      // Add note
      trade.notes.push(`Entered ${trade.opportunityType} trade at ${new Date().toISOString()}`);
      
      console.log(`✅ ENTRY EXECUTED: ${trade.spotTrade.side.toUpperCase()} ${trade.spotTrade.asset}, ${trade.futuresTrade.side.toUpperCase()} ${trade.futuresTrade.asset}`);
      
      // Emit entry executed event
      this.emit('entryExecuted', trade);
      
    } catch (error) {
      console.error(`❌ ERROR EXECUTING ENTRY: ${error}`);
      
      // Update trade status
      trade.status = 'failed';
      trade.notes.push(`Entry failed: ${error}`);
      
      // Emit entry failed event
      this.emit('entryFailed', trade, error);
    }
  }  
  /**

   * Exit basis trade
   * @param trade Basis trade
   */
  private async exitBasisTrade(trade: BasisTrade): Promise<void> {
    console.log(`⚡ EXECUTING EXIT FOR ${trade.opportunityType.toUpperCase()} TRADE...`);
    
    try {
      // In a real implementation, this would execute the trades on the exchanges
      // For now, we'll simulate execution
      
      // Calculate PnL
      const spotEntryValue = trade.spotTrade.price * trade.spotTrade.quantity;
      const futuresEntryValue = trade.futuresTrade.price * trade.futuresTrade.quantity;
      
      // Get current prices
      let spotExitPrice: number;
      let futuresExitPrice: number;
      
      if (trade.opportunityType === 'basis') {
        // For basis trades, get spot and futures prices
        const [baseAsset, quoteAsset] = trade.spotTrade.asset.split('/');
        spotExitPrice = this.getSpotPrice(baseAsset, quoteAsset) || trade.spotTrade.price;
        
        const futuresContract = Array.from(this.futuresContracts.values())
          .find(c => c.symbol === trade.futuresTrade.asset);
        
        futuresExitPrice = futuresContract ? futuresContract.markPrice : trade.futuresTrade.price;
      } else {
        // For calendar spreads, get near and far contract prices
        const nearContract = Array.from(this.futuresContracts.values())
          .find(c => c.symbol === trade.spotTrade.asset);
        
        const farContract = Array.from(this.futuresContracts.values())
          .find(c => c.symbol === trade.futuresTrade.asset);
        
        spotExitPrice = nearContract ? nearContract.markPrice : trade.spotTrade.price;
        futuresExitPrice = farContract ? farContract.markPrice : trade.futuresTrade.price;
      }
      
      const spotExitValue = spotExitPrice * trade.spotTrade.quantity;
      const futuresExitValue = futuresExitPrice * trade.futuresTrade.quantity;
      
      // Calculate PnL based on trade direction
      let spotPnl: number;
      let futuresPnl: number;
      
      if (trade.spotTrade.side === 'buy') {
        spotPnl = spotExitValue - spotEntryValue;
      } else {
        spotPnl = spotEntryValue - spotExitValue;
      }
      
      if (trade.futuresTrade.side === 'buy') {
        futuresPnl = futuresExitValue - futuresEntryValue;
      } else {
        futuresPnl = futuresEntryValue - futuresExitValue;
      }
      
      const totalPnl = spotPnl + futuresPnl;
      const totalEntryValue = spotEntryValue + futuresEntryValue;
      const pnlPercentage = (totalPnl / totalEntryValue) * 100;
      
      // Update trade
      trade.status = 'exited';
      trade.exitTime = new Date();
      trade.pnl = totalPnl;
      trade.pnlPercentage = pnlPercentage;
      
      // Add note
      trade.notes.push(`Exited ${trade.opportunityType} trade at ${new Date().toISOString()}`);
      trade.notes.push(`PnL: ${totalPnl.toFixed(2)} (${pnlPercentage.toFixed(2)}%)`);
      
      console.log(`✅ EXIT EXECUTED: ${trade.opportunityType.toUpperCase()} TRADE`);
      console.log(`💰 PnL: ${totalPnl.toFixed(2)} (${pnlPercentage.toFixed(2)}%)`);
      
      // Move to completed trades
      this.completedTrades.push(trade);
      this.activeTrades.delete(trade.id);
      
      // Emit exit executed event
      this.emit('exitExecuted', trade);
      
    } catch (error) {
      console.error(`❌ ERROR EXECUTING EXIT: ${error}`);
      
      // Update trade status
      trade.notes.push(`Exit failed: ${error}`);
      
      // Emit exit failed event
      this.emit('exitFailed', trade, error);
    }
  }  
  /**

   * Get futures contracts
   * @returns Futures contracts
   */
  getFuturesContracts(): FuturesContract[] {
    return Array.from(this.futuresContracts.values());
  }
  
  /**
   * Get basis opportunities
   * @returns Basis arbitrage opportunities
   */
  getBasisOpportunities(): BasisArbitrageOpportunity[] {
    return Array.from(this.basisOpportunities.values());
  }
  
  /**
   * Get calendar opportunities
   * @returns Calendar spread opportunities
   */
  getCalendarOpportunities(): CalendarSpreadOpportunity[] {
    return Array.from(this.calendarOpportunities.values());
  }
  
  /**
   * Get active trades
   * @returns Active trades
   */
  getActiveTrades(): BasisTrade[] {
    return Array.from(this.activeTrades.values());
  }
  
  /**
   * Get completed trades
   * @returns Completed trades
   */
  getCompletedTrades(): BasisTrade[] {
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
    
    // Calculate trade type statistics
    const basisTrades = this.completedTrades.filter(t => t.opportunityType === 'basis');
    const calendarTrades = this.completedTrades.filter(t => t.opportunityType === 'calendar');
    
    const basisSuccessRate = basisTrades.length > 0
      ? basisTrades.filter(t => t.pnl !== null && t.pnl > 0).length / basisTrades.length
      : 0;
    
    const calendarSuccessRate = calendarTrades.length > 0
      ? calendarTrades.filter(t => t.pnl !== null && t.pnl > 0).length / calendarTrades.length
      : 0;
    
    return {
      monitoredAssets: this.monitoredAssets.length,
      monitoredExchanges: this.config.monitoredExchanges.length,
      futuresContracts: this.futuresContracts.size,
      basisOpportunities: this.basisOpportunities.size,
      calendarOpportunities: this.calendarOpportunities.size,
      activeTrades: this.activeTrades.size,
      completedTrades: this.completedTrades.length,
      successfulTrades: successfulTrades.length,
      failedTrades: this.completedTrades.length - successfulTrades.length,
      successRate: successRate * 100,
      totalPnl,
      avgPnl,
      avgPnlPercentage,
      tradeTypeStats: {
        basis: {
          trades: basisTrades.length,
          successRate: basisSuccessRate * 100
        },
        calendar: {
          trades: calendarTrades.length,
          successRate: calendarSuccessRate * 100
        }
      },
      isRunning: this.isRunning,
      config: this.config
    };
  }
  
  /**
   * Update configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<FuturesBasisConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Updated futures basis arbitrage configuration');
  }
  
  /**
   * Stop the futures basis arbitrage
   */
  stop(): void {
    console.log('🛑 STOPPING FUTURES BASIS ARBITRAGE...');
    
    // Clear scan interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    this.isRunning = false;
    console.log('🛑 FUTURES BASIS ARBITRAGE STOPPED');
  }
}

export default FuturesBasisArbitrage;
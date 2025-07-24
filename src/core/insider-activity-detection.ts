// INSIDER ACTIVITY DETECTION AND PATTERN FOLLOWING SYSTEM - REVOLUTIONARY ALPHA EXTRACTION
// Detect and follow unusual trading patterns from whale wallets and insiders before major market moves

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import ExchangeManager from '../exchanges/exchange-manager';
import { TradeSignal } from '../types/core';

/**
 * Wallet type
 */
export enum WalletType {
  WHALE = 'whale',
  INSIDER = 'insider',
  SMART_MONEY = 'smart_money',
  EXCHANGE = 'exchange',
  MARKET_MAKER = 'market_maker',
  DEVELOPER = 'developer',
  DAO = 'dao',
  TREASURY = 'treasury',
  UNKNOWN = 'unknown'
}

/**
 * Transaction type
 */
export enum TransactionType {
  TRANSFER = 'transfer',
  SWAP = 'swap',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  MINT = 'mint',
  BURN = 'burn',
  BORROW = 'borrow',
  REPAY = 'repay',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  CLAIM = 'claim',
  VOTE = 'vote',
  UNKNOWN = 'unknown'
}

/**
 * Blockchain
 */
export enum Blockchain {
  ETHEREUM = 'ethereum',
  BINANCE_SMART_CHAIN = 'binance_smart_chain',
  SOLANA = 'solana',
  AVALANCHE = 'avalanche',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  BASE = 'base',
  NEAR = 'near',
  COSMOS = 'cosmos'
}/*
*
 * Monitored wallet
 */
export interface MonitoredWallet {
  id: string;
  address: string;
  blockchain: Blockchain;
  type: WalletType;
  label: string | null;
  tags: string[];
  balance: number;
  valueUsd: number;
  firstSeen: Date;
  lastActive: Date;
  influenceScore: number; // 0-100
  successRate: number; // 0-1
  avgProfitability: number; // percentage
  correlationToMarket: number; // -1 to 1
  transactionCount: number;
  relatedWallets: string[];
  notes: string[];
}

/**
 * Wallet transaction
 */
export interface WalletTransaction {
  id: string;
  walletId: string;
  blockchain: Blockchain;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  type: TransactionType;
  fromAddress: string;
  toAddress: string;
  tokenAddress: string | null;
  tokenSymbol: string | null;
  amount: number;
  valueUsd: number;
  gasUsed: number;
  gasPrice: number;
  success: boolean;
  relatedTransactions: string[];
  notes: string[];
}

/**
 * Unusual activity
 */
export interface UnusualActivity {
  id: string;
  wallet: MonitoredWallet;
  transactions: WalletTransaction[];
  activityType: 'accumulation' | 'distribution' | 'token_swap' | 'large_transfer' | 'unusual_timing' | 'correlated_action';
  asset: string;
  totalValueUsd: number;
  detectedAt: Date;
  confidence: number; // 0-1
  significance: number; // 0-10
  expectedImpact: number; // -10 to 10, negative = bearish, positive = bullish
  relatedActivities: string[];
  status: 'active' | 'confirmed' | 'invalidated' | 'expired';
  notes: string[];
}

/**
 * Insider pattern
 */
export interface InsiderPattern {
  id: string;
  name: string;
  description: string;
  wallets: MonitoredWallet[];
  activities: UnusualActivity[];
  asset: string;
  patternType: 'accumulation' | 'distribution' | 'rotation' | 'coordinated' | 'pre_announcement' | 'pre_listing' | 'insider_trading';
  detectedAt: Date;
  confidence: number; // 0-1
  significance: number; // 0-10
  expectedPriceMove: number; // percentage
  expectedTimeframe: number; // hours
  status: 'active' | 'confirmed' | 'invalidated' | 'expired';
  profitPotential: number; // percentage
  riskLevel: number; // 1-10
  notes: string[];
}/**

 * Insider trade
 */
export interface InsiderTrade {
  id: string;
  patternId: string;
  asset: string;
  exchange: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  entryTime: Date | null;
  exitTime: Date | null;
  pnl: number | null;
  pnlPercentage: number | null;
  status: 'pending' | 'active' | 'completed' | 'stopped' | 'failed';
  confidence: number;
  notes: string[];
}

/**
 * Insider activity configuration
 */
export interface InsiderActivityConfig {
  minConfidence: number;
  minSignificance: number;
  maxRiskLevel: number;
  maxPositionSizeUsd: number;
  maxActiveTrades: number;
  scanIntervalMs: number;
  monitoredBlockchains: Blockchain[];
  monitoredAssets: string[];
  minWalletValueUsd: number;
  minTransactionValueUsd: number;
  minWalletInfluenceScore: number;
  maxWalletsToMonitor: number;
  patternConfirmationThreshold: number;
  unusualVolumeThresholdMultiplier: number;
  correlationThreshold: number;
}

/**
 * Insider Activity Detection and Pattern Following System
 * 
 * REVOLUTIONARY INSIGHT: Cryptocurrency markets are heavily influenced by insider
 * activity and whale movements that occur before public announcements. By monitoring
 * key wallets and detecting unusual patterns, we can identify and follow smart money
 * flows before they manifest as price movements. This system tracks thousands of
 * high-value wallets across multiple blockchains, analyzes their transaction patterns,
 * and identifies coordinated activities that precede major market moves.
 */
export class InsiderActivityDetection extends EventEmitter {
  private exchangeManager: ExchangeManager;
  private config: InsiderActivityConfig;
  private monitoredWallets: Map<string, MonitoredWallet> = new Map();
  private walletTransactions: Map<string, WalletTransaction[]> = new Map();
  private unusualActivities: Map<string, UnusualActivity> = new Map();
  private insiderPatterns: Map<string, InsiderPattern> = new Map();
  private activeTrades: Map<string, InsiderTrade> = new Map();
  private completedTrades: InsiderTrade[] = [];
  private lastPrices: Map<string, number> = new Map(); // symbol -> price
  private isRunning: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private accountBalance: number = 1000;
  private accountId: string = 'default';  /**
  
 * Constructor
   * @param exchangeManager Exchange manager
   * @param config Configuration
   */
  constructor(
    exchangeManager: ExchangeManager,
    config?: Partial<InsiderActivityConfig>
  ) {
    super();
    this.exchangeManager = exchangeManager;
    
    // Default configuration
    this.config = {
      minConfidence: 0.7, // 70% minimum confidence
      minSignificance: 7, // 7/10 minimum significance
      maxRiskLevel: 8, // 8/10 maximum risk level
      maxPositionSizeUsd: 10000, // $10,000 maximum position size
      maxActiveTrades: 5,
      scanIntervalMs: 5 * 60 * 1000, // 5 minutes
      monitoredBlockchains: [
        Blockchain.ETHEREUM,
        Blockchain.BINANCE_SMART_CHAIN,
        Blockchain.SOLANA,
        Blockchain.ARBITRUM,
        Blockchain.OPTIMISM,
        Blockchain.BASE
      ],
      monitoredAssets: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ARB', 'OP', 'MATIC'],
      minWalletValueUsd: 1000000, // $1M minimum wallet value
      minTransactionValueUsd: 100000, // $100K minimum transaction value
      minWalletInfluenceScore: 70, // 70/100 minimum influence score
      maxWalletsToMonitor: 5000, // Monitor up to 5,000 wallets
      patternConfirmationThreshold: 0.8, // 80% confirmation threshold
      unusualVolumeThresholdMultiplier: 3, // 3x normal volume
      correlationThreshold: 0.7 // 70% correlation threshold
    };
    
    // Override with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }
  
  /**
   * Start the insider activity detection system
   * @param accountId Account ID
   * @param accountBalance Account balance
   */
  async start(
    accountId: string = 'default',
    accountBalance: number = 1000
  ): Promise<void> {
    if (this.isRunning) {
      console.log('👁️ Insider activity detection system already running');
      return;
    }
    
    console.log('🚀 STARTING INSIDER ACTIVITY DETECTION SYSTEM...');
    
    // Set account details
    this.accountId = accountId;
    this.accountBalance = accountBalance;
    
    // Initialize wallet monitoring
    await this.initializeWalletMonitoring();
    
    // Start price monitoring
    this.startPriceMonitoring();
    
    // Start transaction monitoring
    this.startTransactionMonitoring();
    
    // Start pattern detection
    this.startPatternDetection();
    
    this.isRunning = true;
    console.log(`👁️ INSIDER ACTIVITY DETECTION SYSTEM ACTIVE! Monitoring ${this.monitoredWallets.size} wallets across ${this.config.monitoredBlockchains.length} blockchains`);
  }  
/**
   * Initialize wallet monitoring
   */
  private async initializeWalletMonitoring(): Promise<void> {
    console.log('👛 INITIALIZING WALLET MONITORING...');
    
    // In a real implementation, this would load wallet data from a database
    // For now, we'll create simulated wallets
    
    // Create whale wallets
    await this.createSimulatedWallets(WalletType.WHALE, 50);
    
    // Create insider wallets
    await this.createSimulatedWallets(WalletType.INSIDER, 30);
    
    // Create smart money wallets
    await this.createSimulatedWallets(WalletType.SMART_MONEY, 100);
    
    // Create developer wallets
    await this.createSimulatedWallets(WalletType.DEVELOPER, 20);
    
    // Create DAO wallets
    await this.createSimulatedWallets(WalletType.DAO, 10);
    
    console.log(`✅ INITIALIZED MONITORING FOR ${this.monitoredWallets.size} WALLETS`);
  }
  
  /**
   * Create simulated wallets
   * @param type Wallet type
   * @param count Number of wallets to create
   */
  private async createSimulatedWallets(type: WalletType, count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      // Generate random blockchain
      const blockchain = this.getRandomBlockchain();
      
      // Generate random address based on blockchain
      const address = this.generateRandomAddress(blockchain);
      
      // Generate wallet value based on type
      let baseValue: number;
      let influenceBase: number;
      let successRateBase: number;
      
      switch (type) {
        case WalletType.WHALE:
          baseValue = 10000000 + Math.random() * 90000000; // $10M-$100M
          influenceBase = 80 + Math.random() * 20; // 80-100
          successRateBase = 0.7 + Math.random() * 0.25; // 70-95%
          break;
        case WalletType.INSIDER:
          baseValue = 1000000 + Math.random() * 9000000; // $1M-$10M
          influenceBase = 85 + Math.random() * 15; // 85-100
          successRateBase = 0.8 + Math.random() * 0.15; // 80-95%
          break;
        case WalletType.SMART_MONEY:
          baseValue = 5000000 + Math.random() * 45000000; // $5M-$50M
          influenceBase = 75 + Math.random() * 20; // 75-95
          successRateBase = 0.75 + Math.random() * 0.2; // 75-95%
          break;
        case WalletType.DEVELOPER:
          baseValue = 500000 + Math.random() * 4500000; // $500K-$5M
          influenceBase = 70 + Math.random() * 20; // 70-90
          successRateBase = 0.7 + Math.random() * 0.2; // 70-90%
          break;
        case WalletType.DAO:
          baseValue = 20000000 + Math.random() * 80000000; // $20M-$100M
          influenceBase = 85 + Math.random() * 15; // 85-100
          successRateBase = 0.7 + Math.random() * 0.2; // 70-90%
          break;
        default:
          baseValue = 1000000 + Math.random() * 9000000; // $1M-$10M
          influenceBase = 60 + Math.random() * 30; // 60-90
          successRateBase = 0.6 + Math.random() * 0.3; // 60-90%
      }
      
      // Create wallet
      const wallet: MonitoredWallet = {
        id: uuidv4(),
        address,
        blockchain,
        type,
        label: null,
        tags: this.generateRandomTags(type),
        balance: Math.random() * 1000, // Random balance
        valueUsd: baseValue,
        firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // 0-365 days ago
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 0-7 days ago
        influenceScore: influenceBase,
        successRate: successRateBase,
        avgProfitability: 20 + Math.random() * 80, // 20-100%
        correlationToMarket: -0.5 + Math.random() * 1.5, // -0.5 to 1.0
        transactionCount: 100 + Math.floor(Math.random() * 900), // 100-1000
        relatedWallets: [],
        notes: [
          `Simulated ${type} wallet on ${blockchain}`,
          `Value: $${baseValue.toLocaleString()}, Influence: ${influenceBase.toFixed(1)}/100`
        ]
      };
      
      // Store wallet
      this.monitoredWallets.set(wallet.id, wallet);
      
      // Create initial transactions
      this.createInitialTransactions(wallet);
    }
  }  /
**
   * Get random blockchain
   * @returns Random blockchain
   */
  private getRandomBlockchain(): Blockchain {
    const blockchains = this.config.monitoredBlockchains;
    return blockchains[Math.floor(Math.random() * blockchains.length)];
  }
  
  /**
   * Generate random address
   * @param blockchain Blockchain
   * @returns Random address
   */
  private generateRandomAddress(blockchain: Blockchain): string {
    // Generate random address based on blockchain
    switch (blockchain) {
      case Blockchain.ETHEREUM:
      case Blockchain.ARBITRUM:
      case Blockchain.OPTIMISM:
      case Blockchain.BASE:
        return '0x' + this.generateRandomHex(40);
      case Blockchain.BINANCE_SMART_CHAIN:
        return '0x' + this.generateRandomHex(40);
      case Blockchain.SOLANA:
        return this.generateRandomBase58(44);
      case Blockchain.AVALANCHE:
        return 'X-avax1' + this.generateRandomHex(38);
      case Blockchain.POLYGON:
        return '0x' + this.generateRandomHex(40);
      case Blockchain.NEAR:
        return this.generateRandomAlphanumeric(16) + '.near';
      case Blockchain.COSMOS:
        return 'cosmos1' + this.generateRandomBase32(38);
      default:
        return '0x' + this.generateRandomHex(40);
    }
  }
  
  /**
   * Generate random hex string
   * @param length Length
   * @returns Random hex string
   */
  private generateRandomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Generate random base58 string
   * @param length Length
   * @returns Random base58 string
   */
  private generateRandomBase58(length: number): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Generate random base32 string
   * @param length Length
   * @returns Random base32 string
   */
  private generateRandomBase32(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz234567';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Generate random alphanumeric string
   * @param length Length
   * @returns Random alphanumeric string
   */
  private generateRandomAlphanumeric(length: number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }  /**
 
  * Generate random tags
   * @param type Wallet type
   * @returns Random tags
   */
  private generateRandomTags(type: WalletType): string[] {
    const tags: string[] = [];
    
    // Add type-specific tags
    switch (type) {
      case WalletType.WHALE:
        tags.push('whale');
        if (Math.random() > 0.5) tags.push('institutional');
        if (Math.random() > 0.7) tags.push('early_investor');
        break;
      case WalletType.INSIDER:
        tags.push('insider');
        if (Math.random() > 0.5) tags.push('team');
        if (Math.random() > 0.7) tags.push('early_investor');
        break;
      case WalletType.SMART_MONEY:
        tags.push('smart_money');
        if (Math.random() > 0.5) tags.push('trader');
        if (Math.random() > 0.7) tags.push('fund');
        break;
      case WalletType.DEVELOPER:
        tags.push('developer');
        if (Math.random() > 0.5) tags.push('team');
        if (Math.random() > 0.7) tags.push('core_contributor');
        break;
      case WalletType.DAO:
        tags.push('dao');
        if (Math.random() > 0.5) tags.push('governance');
        if (Math.random() > 0.7) tags.push('treasury');
        break;
    }
    
    // Add random project tags
    const projects = ['ethereum', 'solana', 'arbitrum', 'optimism', 'base', 'uniswap', 'aave', 'compound', 'maker'];
    if (Math.random() > 0.5) {
      tags.push(projects[Math.floor(Math.random() * projects.length)]);
    }
    
    // Add random behavior tags
    const behaviors = ['active_trader', 'hodler', 'swing_trader', 'degen', 'arbitrageur', 'liquidator'];
    if (Math.random() > 0.7) {
      tags.push(behaviors[Math.floor(Math.random() * behaviors.length)]);
    }
    
    return tags;
  }
  
  /**
   * Create initial transactions
   * @param wallet Monitored wallet
   */
  private createInitialTransactions(wallet: MonitoredWallet): void {
    // Create 5-20 initial transactions
    const transactionCount = 5 + Math.floor(Math.random() * 15);
    const transactions: WalletTransaction[] = [];
    
    for (let i = 0; i < transactionCount; i++) {
      // Generate transaction timestamp (oldest to newest)
      const timestamp = new Date(wallet.firstSeen.getTime() + 
        (i / transactionCount) * (wallet.lastActive.getTime() - wallet.firstSeen.getTime()));
      
      // Generate transaction type
      const transactionTypes = Object.values(TransactionType);
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)] as TransactionType;
      
      // Generate transaction value
      let valueUsd: number;
      
      if (wallet.type === WalletType.WHALE || wallet.type === WalletType.DAO) {
        valueUsd = 500000 + Math.random() * 4500000; // $500K-$5M
      } else if (wallet.type === WalletType.INSIDER || wallet.type === WalletType.SMART_MONEY) {
        valueUsd = 100000 + Math.random() * 900000; // $100K-$1M
      } else {
        valueUsd = 10000 + Math.random() * 90000; // $10K-$100K
      }
      
      // Generate random token
      const tokens = ['ETH', 'WETH', 'USDT', 'USDC', 'BTC', 'SOL', 'BNB', 'ARB', 'OP', 'MATIC'];
      const tokenSymbol = tokens[Math.floor(Math.random() * tokens.length)];
      
      // Create transaction
      const transaction: WalletTransaction = {
        id: uuidv4(),
        walletId: wallet.id,
        blockchain: wallet.blockchain,
        transactionHash: '0x' + this.generateRandomHex(64),
        blockNumber: 10000000 + Math.floor(Math.random() * 5000000),
        timestamp,
        type,
        fromAddress: Math.random() > 0.5 ? wallet.address : this.generateRandomAddress(wallet.blockchain),
        toAddress: Math.random() > 0.5 ? this.generateRandomAddress(wallet.blockchain) : wallet.address,
        tokenAddress: Math.random() > 0.2 ? '0x' + this.generateRandomHex(40) : null,
        tokenSymbol: Math.random() > 0.2 ? tokenSymbol : null,
        amount: Math.random() * 1000,
        valueUsd,
        gasUsed: 50000 + Math.floor(Math.random() * 950000),
        gasPrice: 10 + Math.random() * 90,
        success: Math.random() > 0.05, // 95% success rate
        relatedTransactions: [],
        notes: []
      };
      
      transactions.push(transaction);
    }
    
    // Store transactions
    this.walletTransactions.set(wallet.id, transactions);
  } 
 /**
   * Start price monitoring
   */
  private startPriceMonitoring(): void {
    console.log('📡 STARTING PRICE MONITORING...');
    
    // Listen for price updates from exchange manager
    this.exchangeManager.on('priceUpdate', (priceUpdate) => {
      const { symbol, price } = priceUpdate;
      
      // Extract asset from symbol
      const asset = symbol.split('/')[0];
      
      // Skip if not a monitored asset
      if (!this.config.monitoredAssets.includes(asset)) {
        return;
      }
      
      // Store price
      this.lastPrices.set(asset, price);
    });
  }
  
  /**
   * Start transaction monitoring
   */
  private startTransactionMonitoring(): void {
    console.log('📡 STARTING TRANSACTION MONITORING...');
    
    // In a real implementation, this would connect to blockchain APIs
    // For now, we'll simulate new transactions every minute
    
    setInterval(() => {
      this.simulateNewTransactions();
    }, 60 * 1000);
  }
  
  /**
   * Simulate new transactions
   */
  private simulateNewTransactions(): void {
    // Simulate new transactions for 1-5% of wallets
    const walletCount = Math.max(1, Math.floor(this.monitoredWallets.size * (0.01 + Math.random() * 0.04)));
    const walletIds = Array.from(this.monitoredWallets.keys());
    
    // Shuffle wallet IDs
    for (let i = walletIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [walletIds[i], walletIds[j]] = [walletIds[j], walletIds[i]];
    }
    
    // Take the first N wallets
    const selectedWalletIds = walletIds.slice(0, walletCount);
    
    // Create new transactions for selected wallets
    for (const walletId of selectedWalletIds) {
      this.createNewTransaction(walletId);
    }
  }
  
  /**
   * Create new transaction
   * @param walletId Wallet ID
   */
  private createNewTransaction(walletId: string): void {
    const wallet = this.monitoredWallets.get(walletId);
    if (!wallet) return;
    
    // Get existing transactions
    const existingTransactions = this.walletTransactions.get(walletId) || [];
    
    // Generate transaction type
    const transactionTypes = Object.values(TransactionType);
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)] as TransactionType;
    
    // Generate transaction value
    let valueUsd: number;
    
    if (wallet.type === WalletType.WHALE || wallet.type === WalletType.DAO) {
      valueUsd = 500000 + Math.random() * 4500000; // $500K-$5M
    } else if (wallet.type === WalletType.INSIDER || wallet.type === WalletType.SMART_MONEY) {
      valueUsd = 100000 + Math.random() * 900000; // $100K-$1M
    } else {
      valueUsd = 10000 + Math.random() * 90000; // $10K-$100K
    }
    
    // Occasionally generate unusually large transactions
    if (Math.random() < 0.05) {
      valueUsd *= 5; // 5x normal value
    }
    
    // Generate random token
    const tokens = this.config.monitoredAssets;
    const tokenSymbol = tokens[Math.floor(Math.random() * tokens.length)];
    
    // Create transaction
    const transaction: WalletTransaction = {
      id: uuidv4(),
      walletId: wallet.id,
      blockchain: wallet.blockchain,
      transactionHash: '0x' + this.generateRandomHex(64),
      blockNumber: 10000000 + Math.floor(Math.random() * 5000000),
      timestamp: new Date(),
      type,
      fromAddress: Math.random() > 0.5 ? wallet.address : this.generateRandomAddress(wallet.blockchain),
      toAddress: Math.random() > 0.5 ? this.generateRandomAddress(wallet.blockchain) : wallet.address,
      tokenAddress: Math.random() > 0.2 ? '0x' + this.generateRandomHex(40) : null,
      tokenSymbol: Math.random() > 0.2 ? tokenSymbol : null,
      amount: Math.random() * 1000,
      valueUsd,
      gasUsed: 50000 + Math.floor(Math.random() * 950000),
      gasPrice: 10 + Math.random() * 90,
      success: Math.random() > 0.05, // 95% success rate
      relatedTransactions: [],
      notes: []
    };
    
    // Add transaction to existing transactions
    existingTransactions.push(transaction);
    
    // Store updated transactions
    this.walletTransactions.set(walletId, existingTransactions);
    
    // Update wallet last active time
    wallet.lastActive = new Date();
    wallet.transactionCount++;
    this.monitoredWallets.set(walletId, wallet);
    
    // Check for unusual activity
    this.checkForUnusualActivity(wallet, transaction);
  }  /**
   
* Check for unusual activity
   * @param wallet Monitored wallet
   * @param transaction Wallet transaction
   */
  private checkForUnusualActivity(wallet: MonitoredWallet, transaction: WalletTransaction): void {
    // Skip if transaction failed
    if (!transaction.success) return;
    
    // Skip if transaction value is too small
    if (transaction.valueUsd < this.config.minTransactionValueUsd) return;
    
    // Check for unusual activity based on transaction type and value
    let isUnusual = false;
    let activityType: 'accumulation' | 'distribution' | 'token_swap' | 'large_transfer' | 'unusual_timing' | 'correlated_action' = 'large_transfer';
    let confidence = 0.7;
    let significance = 7;
    let expectedImpact = 0;
    
    // Check for large transfer
    if (transaction.valueUsd > this.config.minTransactionValueUsd * 5) {
      isUnusual = true;
      activityType = 'large_transfer';
      confidence = 0.8;
      significance = 8;
      expectedImpact = transaction.fromAddress === wallet.address ? -3 : 5; // Outgoing = bearish, incoming = bullish
    }
    
    // Check for token swap
    if (transaction.type === TransactionType.SWAP && transaction.tokenSymbol && this.config.monitoredAssets.includes(transaction.tokenSymbol)) {
      isUnusual = true;
      activityType = 'token_swap';
      confidence = 0.75;
      significance = 7;
      expectedImpact = transaction.fromAddress === wallet.address ? 5 : -3; // Buying = bullish, selling = bearish
    }
    
    // Check for accumulation pattern
    const recentTransactions = this.getRecentTransactions(wallet.id, 7); // Last 7 days
    const incomingValue = recentTransactions
      .filter(t => t.toAddress === wallet.address && t.tokenSymbol === transaction.tokenSymbol)
      .reduce((sum, t) => sum + t.valueUsd, 0);
    const outgoingValue = recentTransactions
      .filter(t => t.fromAddress === wallet.address && t.tokenSymbol === transaction.tokenSymbol)
      .reduce((sum, t) => sum + t.valueUsd, 0);
    
    if (incomingValue > outgoingValue * 3 && incomingValue > this.config.minTransactionValueUsd * 3) {
      isUnusual = true;
      activityType = 'accumulation';
      confidence = 0.85;
      significance = 9;
      expectedImpact = 7; // Strongly bullish
    }
    
    // Check for distribution pattern
    if (outgoingValue > incomingValue * 3 && outgoingValue > this.config.minTransactionValueUsd * 3) {
      isUnusual = true;
      activityType = 'distribution';
      confidence = 0.85;
      significance = 9;
      expectedImpact = -7; // Strongly bearish
    }
    
    // Check for unusual timing
    const hour = new Date().getUTCHours();
    if ((hour < 2 || hour > 22) && transaction.valueUsd > this.config.minTransactionValueUsd * 2) {
      isUnusual = true;
      activityType = 'unusual_timing';
      confidence = 0.75;
      significance = 8;
      expectedImpact = transaction.fromAddress === wallet.address ? -4 : 4; // Outgoing = bearish, incoming = bullish
    }
    
    // Check for correlated action
    const similarWallets = this.getSimilarWallets(wallet);
    const correlatedTransactions = this.getCorrelatedTransactions(transaction, similarWallets);
    
    if (correlatedTransactions.length >= 2) {
      isUnusual = true;
      activityType = 'correlated_action';
      confidence = 0.9;
      significance = 10;
      expectedImpact = transaction.fromAddress === wallet.address ? -8 : 8; // Outgoing = very bearish, incoming = very bullish
    }
    
    // If unusual activity detected, create unusual activity record
    if (isUnusual) {
      this.createUnusualActivity(wallet, transaction, activityType, confidence, significance, expectedImpact, correlatedTransactions);
    }
  }  /**

   * Get recent transactions
   * @param walletId Wallet ID
   * @param days Number of days
   * @returns Recent transactions
   */
  private getRecentTransactions(walletId: string, days: number): WalletTransaction[] {
    const transactions = this.walletTransactions.get(walletId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return transactions.filter(t => t.timestamp >= cutoffDate);
  }
  
  /**
   * Get similar wallets
   * @param wallet Monitored wallet
   * @returns Similar wallets
   */
  private getSimilarWallets(wallet: MonitoredWallet): MonitoredWallet[] {
    // Find wallets with similar type, tags, and influence score
    return Array.from(this.monitoredWallets.values())
      .filter(w => w.id !== wallet.id && 
                  w.type === wallet.type && 
                  w.influenceScore >= wallet.influenceScore * 0.8 &&
                  this.hasCommonTags(w.tags, wallet.tags));
  }
  
  /**
   * Check if two arrays have common elements
   * @param arr1 First array
   * @param arr2 Second array
   * @returns True if arrays have common elements
   */
  private hasCommonTags(arr1: string[], arr2: string[]): boolean {
    return arr1.some(item => arr2.includes(item));
  }
  
  /**
   * Get correlated transactions
   * @param transaction Wallet transaction
   * @param similarWallets Similar wallets
   * @returns Correlated transactions
   */
  private getCorrelatedTransactions(transaction: WalletTransaction, similarWallets: MonitoredWallet[]): WalletTransaction[] {
    const result: WalletTransaction[] = [];
    const timeWindow = 12 * 60 * 60 * 1000; // 12 hours
    
    // Check for similar transactions from similar wallets in the time window
    for (const wallet of similarWallets) {
      const walletTransactions = this.walletTransactions.get(wallet.id) || [];
      
      const correlatedTxs = walletTransactions.filter(t => 
        Math.abs(t.timestamp.getTime() - transaction.timestamp.getTime()) < timeWindow &&
        t.tokenSymbol === transaction.tokenSymbol &&
        t.type === transaction.type &&
        t.valueUsd >= transaction.valueUsd * 0.5 && // At least 50% of the value
        t.success
      );
      
      result.push(...correlatedTxs);
    }
    
    return result;
  }
  
  /**
   * Create unusual activity
   * @param wallet Monitored wallet
   * @param transaction Wallet transaction
   * @param activityType Activity type
   * @param confidence Confidence
   * @param significance Significance
   * @param expectedImpact Expected impact
   * @param correlatedTransactions Correlated transactions
   */
  private createUnusualActivity(
    wallet: MonitoredWallet,
    transaction: WalletTransaction,
    activityType: 'accumulation' | 'distribution' | 'token_swap' | 'large_transfer' | 'unusual_timing' | 'correlated_action',
    confidence: number,
    significance: number,
    expectedImpact: number,
    correlatedTransactions: WalletTransaction[] = []
  ): void {
    // Create unusual activity
    const activity: UnusualActivity = {
      id: uuidv4(),
      wallet,
      transactions: [transaction, ...correlatedTransactions],
      activityType,
      asset: transaction.tokenSymbol || 'Unknown',
      totalValueUsd: transaction.valueUsd + correlatedTransactions.reduce((sum, t) => sum + t.valueUsd, 0),
      detectedAt: new Date(),
      confidence,
      significance,
      expectedImpact,
      relatedActivities: [],
      status: 'active',
      notes: [
        `Unusual ${activityType} activity detected for ${wallet.type} wallet`,
        `Asset: ${transaction.tokenSymbol || 'Unknown'}, Value: $${transaction.valueUsd.toLocaleString()}`,
        `Expected impact: ${expectedImpact > 0 ? 'Bullish' : 'Bearish'} (${expectedImpact}/10)`,
        `Confidence: ${(confidence * 100).toFixed(1)}%, Significance: ${significance}/10`,
        `Correlated transactions: ${correlatedTransactions.length}`
      ]
    };
    
    // Store unusual activity
    this.unusualActivities.set(activity.id, activity);
    
    console.log(`👁️ UNUSUAL ACTIVITY DETECTED: ${activityType} of ${transaction.tokenSymbol || 'Unknown'} by ${wallet.type} wallet`);
    console.log(`💰 Value: $${transaction.valueUsd.toLocaleString()}, Impact: ${expectedImpact > 0 ? 'Bullish' : 'Bearish'} (${expectedImpact}/10)`);
    
    // Emit unusual activity event
    this.emit('unusualActivityDetected', activity);
  }  /**
   
* Start pattern detection
   */
  private startPatternDetection(): void {
    console.log('🔍 STARTING PATTERN DETECTION...');
    
    // Scan for patterns immediately
    this.scanForPatterns();
    
    // Set up interval for regular pattern scanning
    this.scanInterval = setInterval(() => {
      this.scanForPatterns();
    }, this.config.scanIntervalMs);
  }
  
  /**
   * Scan for patterns
   */
  private scanForPatterns(): void {
    console.log('🔍 SCANNING FOR INSIDER PATTERNS...');
    
    // Get recent unusual activities
    const recentActivities = Array.from(this.unusualActivities.values())
      .filter(a => a.status === 'active' && 
                  (Date.now() - a.detectedAt.getTime()) < 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    // Group activities by asset
    const activitiesByAsset = new Map<string, UnusualActivity[]>();
    
    for (const activity of recentActivities) {
      if (!activity.asset || activity.asset === 'Unknown') continue;
      
      const activities = activitiesByAsset.get(activity.asset) || [];
      activities.push(activity);
      activitiesByAsset.set(activity.asset, activities);
    }
    
    // Check each asset for patterns
    for (const [asset, activities] of activitiesByAsset.entries()) {
      // Skip if not enough activities
      if (activities.length < 3) continue;
      
      // Check for accumulation pattern
      this.checkForAccumulationPattern(asset, activities);
      
      // Check for distribution pattern
      this.checkForDistributionPattern(asset, activities);
      
      // Check for rotation pattern
      this.checkForRotationPattern(asset, activities);
      
      // Check for coordinated pattern
      this.checkForCoordinatedPattern(asset, activities);
      
      // Check for pre-announcement pattern
      this.checkForPreAnnouncementPattern(asset, activities);
    }
    
    // Update active patterns
    this.updateActivePatterns();
  }
  
  /**
   * Check for accumulation pattern
   * @param asset Asset
   * @param activities Unusual activities
   */
  private checkForAccumulationPattern(asset: string, activities: UnusualActivity[]): void {
    // Filter for accumulation and token swap activities
    const accumulationActivities = activities.filter(a => 
      (a.activityType === 'accumulation' || 
       (a.activityType === 'token_swap' && a.expectedImpact > 0) || 
       (a.activityType === 'large_transfer' && a.expectedImpact > 0)) && 
      a.asset === asset
    );
    
    // Skip if not enough activities
    if (accumulationActivities.length < 3) return;
    
    // Calculate total value
    const totalValue = accumulationActivities.reduce((sum, a) => sum + a.totalValueUsd, 0);
    
    // Skip if total value is too small
    if (totalValue < this.config.minTransactionValueUsd * 5) return;
    
    // Calculate average confidence and significance
    const avgConfidence = accumulationActivities.reduce((sum, a) => sum + a.confidence, 0) / accumulationActivities.length;
    const avgSignificance = accumulationActivities.reduce((sum, a) => sum + a.significance, 0) / accumulationActivities.length;
    
    // Skip if confidence or significance is too low
    if (avgConfidence < this.config.minConfidence || avgSignificance < this.config.minSignificance) return;
    
    // Get unique wallets involved
    const wallets = Array.from(new Set(accumulationActivities.map(a => a.wallet)));
    
    // Calculate expected price move based on wallet influence and activity significance
    const avgInfluence = wallets.reduce((sum, w) => sum + w.influenceScore, 0) / wallets.length;
    const expectedPriceMove = (avgInfluence / 20) * (avgSignificance / 2); // 0-25% expected move
    
    // Create insider pattern
    this.createInsiderPattern(
      asset,
      'accumulation',
      wallets,
      accumulationActivities,
      avgConfidence,
      avgSignificance,
      expectedPriceMove,
      48 // 48 hours expected timeframe
    );
  }  /**

   * Check for distribution pattern
   * @param asset Asset
   * @param activities Unusual activities
   */
  private checkForDistributionPattern(asset: string, activities: UnusualActivity[]): void {
    // Filter for distribution and token swap activities
    const distributionActivities = activities.filter(a => 
      (a.activityType === 'distribution' || 
       (a.activityType === 'token_swap' && a.expectedImpact < 0) || 
       (a.activityType === 'large_transfer' && a.expectedImpact < 0)) && 
      a.asset === asset
    );
    
    // Skip if not enough activities
    if (distributionActivities.length < 3) return;
    
    // Calculate total value
    const totalValue = distributionActivities.reduce((sum, a) => sum + a.totalValueUsd, 0);
    
    // Skip if total value is too small
    if (totalValue < this.config.minTransactionValueUsd * 5) return;
    
    // Calculate average confidence and significance
    const avgConfidence = distributionActivities.reduce((sum, a) => sum + a.confidence, 0) / distributionActivities.length;
    const avgSignificance = distributionActivities.reduce((sum, a) => sum + a.significance, 0) / distributionActivities.length;
    
    // Skip if confidence or significance is too low
    if (avgConfidence < this.config.minConfidence || avgSignificance < this.config.minSignificance) return;
    
    // Get unique wallets involved
    const wallets = Array.from(new Set(distributionActivities.map(a => a.wallet)));
    
    // Calculate expected price move based on wallet influence and activity significance
    const avgInfluence = wallets.reduce((sum, w) => sum + w.influenceScore, 0) / wallets.length;
    const expectedPriceMove = -((avgInfluence / 20) * (avgSignificance / 2)); // 0-25% expected move (negative)
    
    // Create insider pattern
    this.createInsiderPattern(
      asset,
      'distribution',
      wallets,
      distributionActivities,
      avgConfidence,
      avgSignificance,
      expectedPriceMove,
      48 // 48 hours expected timeframe
    );
  }
  
  /**
   * Check for rotation pattern
   * @param asset Asset
   * @param activities Unusual activities
   */
  private checkForRotationPattern(asset: string, activities: UnusualActivity[]): void {
    // For rotation pattern, we need to look at multiple assets
    // This is a simplified implementation
    
    // Filter for token swap activities
    const swapActivities = activities.filter(a => 
      a.activityType === 'token_swap' && 
      a.asset === asset
    );
    
    // Skip if not enough activities
    if (swapActivities.length < 5) return;
    
    // Calculate total value
    const totalValue = swapActivities.reduce((sum, a) => sum + a.totalValueUsd, 0);
    
    // Skip if total value is too small
    if (totalValue < this.config.minTransactionValueUsd * 10) return;
    
    // Calculate average confidence and significance
    const avgConfidence = swapActivities.reduce((sum, a) => sum + a.confidence, 0) / swapActivities.length;
    const avgSignificance = swapActivities.reduce((sum, a) => sum + a.significance, 0) / swapActivities.length;
    
    // Skip if confidence or significance is too low
    if (avgConfidence < this.config.minConfidence || avgSignificance < this.config.minSignificance) return;
    
    // Get unique wallets involved
    const wallets = Array.from(new Set(swapActivities.map(a => a.wallet)));
    
    // Calculate expected price move based on wallet influence and activity significance
    const avgInfluence = wallets.reduce((sum, w) => sum + w.influenceScore, 0) / wallets.length;
    const netImpact = swapActivities.reduce((sum, a) => sum + a.expectedImpact, 0);
    const expectedPriceMove = (netImpact > 0 ? 1 : -1) * (avgInfluence / 25) * (avgSignificance / 2); // -20% to +20% expected move
    
    // Create insider pattern
    this.createInsiderPattern(
      asset,
      'rotation',
      wallets,
      swapActivities,
      avgConfidence,
      avgSignificance,
      expectedPriceMove,
      72 // 72 hours expected timeframe
    );
  }  /**
   *
 Check for coordinated pattern
   * @param asset Asset
   * @param activities Unusual activities
   */
  private checkForCoordinatedPattern(asset: string, activities: UnusualActivity[]): void {
    // Filter for correlated action activities
    const coordinatedActivities = activities.filter(a => 
      a.activityType === 'correlated_action' && 
      a.asset === asset
    );
    
    // Skip if not enough activities
    if (coordinatedActivities.length < 2) return;
    
    // Calculate total value
    const totalValue = coordinatedActivities.reduce((sum, a) => sum + a.totalValueUsd, 0);
    
    // Skip if total value is too small
    if (totalValue < this.config.minTransactionValueUsd * 10) return;
    
    // Calculate average confidence and significance
    const avgConfidence = coordinatedActivities.reduce((sum, a) => sum + a.confidence, 0) / coordinatedActivities.length;
    const avgSignificance = coordinatedActivities.reduce((sum, a) => sum + a.significance, 0) / coordinatedActivities.length;
    
    // Skip if confidence or significance is too low
    if (avgConfidence < this.config.minConfidence || avgSignificance < this.config.minSignificance) return;
    
    // Get unique wallets involved
    const wallets = Array.from(new Set(coordinatedActivities.map(a => a.wallet)));
    
    // Calculate expected price move based on wallet influence and activity significance
    const avgInfluence = wallets.reduce((sum, w) => sum + w.influenceScore, 0) / wallets.length;
    const netImpact = coordinatedActivities.reduce((sum, a) => sum + a.expectedImpact, 0);
    const expectedPriceMove = (netImpact > 0 ? 1 : -1) * (avgInfluence / 15) * (avgSignificance / 2); // -33% to +33% expected move
    
    // Create insider pattern
    this.createInsiderPattern(
      asset,
      'coordinated',
      wallets,
      coordinatedActivities,
      avgConfidence,
      avgSignificance,
      expectedPriceMove,
      24 // 24 hours expected timeframe
    );
  }
  
  /**
   * Check for pre-announcement pattern
   * @param asset Asset
   * @param activities Unusual activities
   */
  private checkForPreAnnouncementPattern(asset: string, activities: UnusualActivity[]): void {
    // Filter for unusual timing activities
    const unusualTimingActivities = activities.filter(a => 
      a.activityType === 'unusual_timing' && 
      a.asset === asset
    );
    
    // Skip if not enough activities
    if (unusualTimingActivities.length < 3) return;
    
    // Calculate total value
    const totalValue = unusualTimingActivities.reduce((sum, a) => sum + a.totalValueUsd, 0);
    
    // Skip if total value is too small
    if (totalValue < this.config.minTransactionValueUsd * 5) return;
    
    // Calculate average confidence and significance
    const avgConfidence = unusualTimingActivities.reduce((sum, a) => sum + a.confidence, 0) / unusualTimingActivities.length;
    const avgSignificance = unusualTimingActivities.reduce((sum, a) => sum + a.significance, 0) / unusualTimingActivities.length;
    
    // Skip if confidence or significance is too low
    if (avgConfidence < this.config.minConfidence || avgSignificance < this.config.minSignificance) return;
    
    // Get unique wallets involved
    const wallets = Array.from(new Set(unusualTimingActivities.map(a => a.wallet)));
    
    // Check if any wallets are insiders
    const hasInsiders = wallets.some(w => w.type === WalletType.INSIDER || w.type === WalletType.DEVELOPER);
    
    // Skip if no insiders involved
    if (!hasInsiders) return;
    
    // Calculate expected price move based on wallet influence and activity significance
    const avgInfluence = wallets.reduce((sum, w) => sum + w.influenceScore, 0) / wallets.length;
    const netImpact = unusualTimingActivities.reduce((sum, a) => sum + a.expectedImpact, 0);
    const expectedPriceMove = (netImpact > 0 ? 1 : -1) * (avgInfluence / 10) * (avgSignificance / 2); // -50% to +50% expected move
    
    // Create insider pattern
    this.createInsiderPattern(
      asset,
      'pre_announcement',
      wallets,
      unusualTimingActivities,
      avgConfidence,
      avgSignificance,
      expectedPriceMove,
      48 // 48 hours expected timeframe
    );
  }  /**
 
  * Create insider pattern
   * @param asset Asset
   * @param patternType Pattern type
   * @param wallets Wallets
   * @param activities Unusual activities
   * @param confidence Confidence
   * @param significance Significance
   * @param expectedPriceMove Expected price move
   * @param timeframeHours Timeframe in hours
   */
  private createInsiderPattern(
    asset: string,
    patternType: 'accumulation' | 'distribution' | 'rotation' | 'coordinated' | 'pre_announcement' | 'pre_listing' | 'insider_trading',
    wallets: MonitoredWallet[],
    activities: UnusualActivity[],
    confidence: number,
    significance: number,
    expectedPriceMove: number,
    timeframeHours: number
  ): void {
    // Check if we already have a similar pattern
    const existingPattern = Array.from(this.insiderPatterns.values())
      .find(p => p.asset === asset && 
                p.patternType === patternType && 
                p.status === 'active');
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.wallets = Array.from(new Set([...existingPattern.wallets, ...wallets]));
      existingPattern.activities = Array.from(new Set([...existingPattern.activities, ...activities]));
      existingPattern.confidence = Math.max(existingPattern.confidence, confidence);
      existingPattern.significance = Math.max(existingPattern.significance, significance);
      existingPattern.expectedPriceMove = (existingPattern.expectedPriceMove + expectedPriceMove) / 2;
      
      // Store updated pattern
      this.insiderPatterns.set(existingPattern.id, existingPattern);
      return;
    }
    
    // Calculate risk level based on pattern type and expected price move
    let riskLevel = 5; // Base risk
    
    if (patternType === 'coordinated' || patternType === 'pre_announcement') {
      riskLevel = 3; // Lower risk for high-confidence patterns
    } else if (patternType === 'rotation') {
      riskLevel = 6; // Higher risk for rotation patterns
    }
    
    // Adjust risk based on expected price move
    if (Math.abs(expectedPriceMove) > 20) {
      riskLevel += 2; // Higher risk for larger expected moves
    } else if (Math.abs(expectedPriceMove) < 10) {
      riskLevel -= 1; // Lower risk for smaller expected moves
    }
    
    // Adjust risk based on confidence
    if (confidence > 0.9) {
      riskLevel -= 2; // Lower risk for high confidence
    } else if (confidence < 0.8) {
      riskLevel += 1; // Higher risk for lower confidence
    }
    
    // Ensure risk level is within bounds
    riskLevel = Math.max(1, Math.min(10, riskLevel));
    
    // Create pattern name
    const direction = expectedPriceMove > 0 ? 'Bullish' : 'Bearish';
    const magnitude = Math.abs(expectedPriceMove) < 10 ? 'Minor' : 
                     Math.abs(expectedPriceMove) < 20 ? 'Moderate' : 
                     Math.abs(expectedPriceMove) < 30 ? 'Major' : 'Extreme';
    
    const name = `${direction} ${magnitude} ${patternType.charAt(0).toUpperCase() + patternType.slice(1)} Pattern on ${asset}`;
    
    // Create description
    const description = `${direction} ${patternType} pattern detected on ${asset} involving ${wallets.length} wallets with average influence score of ${(wallets.reduce((sum, w) => sum + w.influenceScore, 0) / wallets.length).toFixed(1)}. Expected price move: ${expectedPriceMove.toFixed(1)}% within ${timeframeHours} hours.`;
    
    // Create insider pattern
    const pattern: InsiderPattern = {
      id: uuidv4(),
      name,
      description,
      wallets,
      activities,
      asset,
      patternType,
      detectedAt: new Date(),
      confidence,
      significance,
      expectedPriceMove,
      expectedTimeframe: timeframeHours,
      status: 'active',
      profitPotential: Math.abs(expectedPriceMove),
      riskLevel,
      notes: [
        `${direction} ${patternType} pattern detected on ${asset}`,
        `Involving ${wallets.length} wallets with ${activities.length} unusual activities`,
        `Expected price move: ${expectedPriceMove.toFixed(1)}% within ${timeframeHours} hours`,
        `Confidence: ${(confidence * 100).toFixed(1)}%, Significance: ${significance.toFixed(1)}/10`,
        `Risk level: ${riskLevel}/10, Profit potential: ${Math.abs(expectedPriceMove).toFixed(1)}%`
      ]
    };
    
    // Store pattern
    this.insiderPatterns.set(pattern.id, pattern);
    
    console.log(`🔍 INSIDER PATTERN DETECTED: ${name}`);
    console.log(`📈 Expected move: ${expectedPriceMove.toFixed(1)}% within ${timeframeHours} hours`);
    console.log(`🎯 Confidence: ${(confidence * 100).toFixed(1)}%, Significance: ${significance.toFixed(1)}/10`);
    
    // Emit pattern detected event
    this.emit('insiderPatternDetected', pattern);
    
    // Create trade if pattern meets criteria
    if (confidence >= this.config.minConfidence && 
        significance >= this.config.minSignificance && 
        riskLevel <= this.config.maxRiskLevel &&
        this.activeTrades.size < this.config.maxActiveTrades) {
      this.createTradeFromPattern(pattern);
    }
  } 
 /**
   * Update active patterns
   */
  private updateActivePatterns(): void {
    // Get active patterns
    const activePatterns = Array.from(this.insiderPatterns.values())
      .filter(p => p.status === 'active');
    
    // Update each pattern
    for (const pattern of activePatterns) {
      // Check if pattern has expired
      const expirationTime = pattern.detectedAt.getTime() + pattern.expectedTimeframe * 60 * 60 * 1000;
      
      if (Date.now() > expirationTime) {
        // Pattern has expired
        pattern.status = 'expired';
        this.insiderPatterns.set(pattern.id, pattern);
        console.log(`⏰ PATTERN EXPIRED: ${pattern.name}`);
        continue;
      }
      
      // Check if pattern has been confirmed
      const currentPrice = this.lastPrices.get(pattern.asset);
      const patternPrice = this.getAssetPriceAtTime(pattern.asset, pattern.detectedAt);
      
      if (currentPrice && patternPrice) {
        const priceChange = ((currentPrice - patternPrice) / patternPrice) * 100;
        
        // Check if price moved in expected direction
        if ((pattern.expectedPriceMove > 0 && priceChange > pattern.expectedPriceMove * this.config.patternConfirmationThreshold) ||
            (pattern.expectedPriceMove < 0 && priceChange < pattern.expectedPriceMove * this.config.patternConfirmationThreshold)) {
          // Pattern confirmed
          pattern.status = 'confirmed';
          this.insiderPatterns.set(pattern.id, pattern);
          console.log(`✅ PATTERN CONFIRMED: ${pattern.name}`);
          console.log(`📈 Expected move: ${pattern.expectedPriceMove.toFixed(1)}%, Actual move: ${priceChange.toFixed(1)}%`);
        }
        // Check if price moved strongly against expected direction
        else if ((pattern.expectedPriceMove > 0 && priceChange < -pattern.expectedPriceMove * 0.5) ||
                (pattern.expectedPriceMove < 0 && priceChange > -pattern.expectedPriceMove * 0.5)) {
          // Pattern invalidated
          pattern.status = 'invalidated';
          this.insiderPatterns.set(pattern.id, pattern);
          console.log(`❌ PATTERN INVALIDATED: ${pattern.name}`);
          console.log(`📈 Expected move: ${pattern.expectedPriceMove.toFixed(1)}%, Actual move: ${priceChange.toFixed(1)}%`);
        }
      }
    }
  }
  
  /**
   * Get asset price at time
   * @param asset Asset
   * @param time Time
   * @returns Price
   */
  private getAssetPriceAtTime(asset: string, time: Date): number | undefined {
    // In a real implementation, this would look up historical price data
    // For now, we'll just return the current price
    return this.lastPrices.get(asset);
  }
  
  /**
   * Create trade from pattern
   * @param pattern Insider pattern
   */
  private createTradeFromPattern(pattern: InsiderPattern): void {
    // Skip if we don't have a price for the asset
    const currentPrice = this.lastPrices.get(pattern.asset);
    if (!currentPrice) return;
    
    // Calculate position size based on account balance, risk level, and confidence
    const maxPositionSize = Math.min(
      this.accountBalance * 0.1, // Max 10% of account per trade
      this.config.maxPositionSizeUsd / currentPrice // Max position size in USD
    );
    
    const positionSize = maxPositionSize * (pattern.confidence * 0.5 + 0.5) * (1 - pattern.riskLevel / 20);
    
    // Determine trade side
    const side = pattern.expectedPriceMove > 0 ? 'buy' : 'sell';
    
    // Calculate stop loss and take profit
    const stopLossPercent = side === 'buy' ? -5 : 5;
    const takeProfitPercent = side === 'buy' ? pattern.expectedPriceMove * 0.8 : pattern.expectedPriceMove * 0.8;
    
    const stopLoss = side === 'buy' ? 
      currentPrice * (1 + stopLossPercent / 100) : 
      currentPrice * (1 + stopLossPercent / 100);
    
    const takeProfit = side === 'buy' ? 
      currentPrice * (1 + takeProfitPercent / 100) : 
      currentPrice * (1 + takeProfitPercent / 100);
    
    // Create trade
    const trade: InsiderTrade = {
      id: uuidv4(),
      patternId: pattern.id,
      asset: pattern.asset,
      exchange: 'binance', // Default exchange
      side,
      quantity: positionSize,
      entryPrice: currentPrice,
      exitPrice: null,
      stopLoss,
      takeProfit,
      entryTime: new Date(),
      exitTime: null,
      pnl: null,
      pnlPercentage: null,
      status: 'active',
      confidence: pattern.confidence,
      notes: [
        `Trade based on ${pattern.name}`,
        `Entry: ${currentPrice}, Stop Loss: ${stopLoss}, Take Profit: ${takeProfit}`,
        `Position Size: ${positionSize} ${pattern.asset}, Side: ${side}`,
        `Pattern Confidence: ${(pattern.confidence * 100).toFixed(1)}%, Risk Level: ${pattern.riskLevel}/10`
      ]
    };
    
    // Store trade
    this.activeTrades.set(trade.id, trade);
    
    console.log(`🚀 NEW TRADE: ${side.toUpperCase()} ${positionSize.toFixed(4)} ${pattern.asset} at ${currentPrice}`);
    console.log(`🎯 Stop Loss: ${stopLoss}, Take Profit: ${takeProfit}`);
    
    // Emit trade created event
    this.emit('tradeCreated', trade);
    
    // Create trade signal
    const signal: TradeSignal = {
      id: uuidv4(),
      strategyId: 'insider_activity_detection',
      symbol: `${pattern.asset}/USDT`,
      side,
      type: 'market',
      quantity: positionSize,
      price: currentPrice,
      stopLoss,
      takeProfit,
      timeframe: '1h',
      confidence: pattern.confidence,
      timestamp: new Date(),
      exchange: 'binance',
      notes: [
        `Signal based on ${pattern.name}`,
        `Expected move: ${pattern.expectedPriceMove.toFixed(1)}% within ${pattern.expectedTimeframe} hours`,
        `Confidence: ${(pattern.confidence * 100).toFixed(1)}%, Significance: ${pattern.significance.toFixed(1)}/10`
      ]
    };
    
    // Emit trade signal
    this.emit('signal', signal);
  }  /**
 
  * Update trades
   */
  private updateTrades(): void {
    // Get active trades
    const activeTrades = Array.from(this.activeTrades.values());
    
    // Update each trade
    for (const trade of activeTrades) {
      // Skip if we don't have a current price
      const currentPrice = this.lastPrices.get(trade.asset);
      if (!currentPrice) continue;
      
      // Check for stop loss hit
      if ((trade.side === 'buy' && currentPrice <= trade.stopLoss!) ||
          (trade.side === 'sell' && currentPrice >= trade.stopLoss!)) {
        // Stop loss hit
        this.closeTrade(trade, currentPrice, 'stopped');
        continue;
      }
      
      // Check for take profit hit
      if ((trade.side === 'buy' && currentPrice >= trade.takeProfit!) ||
          (trade.side === 'sell' && currentPrice <= trade.takeProfit!)) {
        // Take profit hit
        this.closeTrade(trade, currentPrice, 'completed');
        continue;
      }
      
      // Check if pattern has expired
      const pattern = this.insiderPatterns.get(trade.patternId);
      if (pattern && pattern.status === 'expired') {
        // Close trade if pattern expired
        this.closeTrade(trade, currentPrice, 'completed');
        continue;
      }
      
      // Check if pattern has been invalidated
      if (pattern && pattern.status === 'invalidated') {
        // Close trade if pattern invalidated
        this.closeTrade(trade, currentPrice, 'stopped');
        continue;
      }
    }
  }
  
  /**
   * Close trade
   * @param trade Trade
   * @param exitPrice Exit price
   * @param status Status
   */
  private closeTrade(trade: InsiderTrade, exitPrice: number, status: 'completed' | 'stopped' | 'failed'): void {
    // Calculate PnL
    const pnl = trade.side === 'buy' ? 
      (exitPrice - trade.entryPrice) * trade.quantity : 
      (trade.entryPrice - exitPrice) * trade.quantity;
    
    const pnlPercentage = trade.side === 'buy' ? 
      ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100 : 
      ((trade.entryPrice - exitPrice) / trade.entryPrice) * 100;
    
    // Update trade
    trade.exitPrice = exitPrice;
    trade.exitTime = new Date();
    trade.pnl = pnl;
    trade.pnlPercentage = pnlPercentage;
    trade.status = status;
    
    // Add note
    trade.notes.push(`Trade closed at ${exitPrice} with ${pnl > 0 ? 'profit' : 'loss'} of ${pnl.toFixed(2)} (${pnlPercentage.toFixed(2)}%)`);
    
    // Move from active to completed trades
    this.activeTrades.delete(trade.id);
    this.completedTrades.push(trade);
    
    console.log(`🏁 TRADE CLOSED: ${trade.side.toUpperCase()} ${trade.quantity.toFixed(4)} ${trade.asset} at ${exitPrice}`);
    console.log(`💰 PnL: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)} (${pnl > 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%)`);
    
    // Update account balance
    this.accountBalance += pnl;
    
    // Emit trade closed event
    this.emit('tradeClosed', trade);
  }
  
  /**
   * Stop the insider activity detection system
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('👁️ Insider activity detection system not running');
      return;
    }
    
    console.log('🛑 STOPPING INSIDER ACTIVITY DETECTION SYSTEM...');
    
    // Clear scan interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    // Close all active trades
    const activeTrades = Array.from(this.activeTrades.values());
    for (const trade of activeTrades) {
      const currentPrice = this.lastPrices.get(trade.asset);
      if (currentPrice) {
        this.closeTrade(trade, currentPrice, 'stopped');
      }
    }
    
    this.isRunning = false;
    console.log('👋 INSIDER ACTIVITY DETECTION SYSTEM STOPPED');
  }
  
  /**
   * Get statistics
   * @returns Statistics
   */
  getStatistics(): any {
    // Calculate pattern statistics
    const patterns = Array.from(this.insiderPatterns.values());
    const confirmedPatterns = patterns.filter(p => p.status === 'confirmed');
    const invalidatedPatterns = patterns.filter(p => p.status === 'invalidated');
    const patternSuccessRate = patterns.length > 0 ? confirmedPatterns.length / patterns.length : 0;
    
    // Calculate trade statistics
    const trades = [...Array.from(this.activeTrades.values()), ...this.completedTrades];
    const completedTrades = this.completedTrades.filter(t => t.status === 'completed');
    const profitableTrades = completedTrades.filter(t => t.pnl !== null && t.pnl > 0);
    const tradeSuccessRate = completedTrades.length > 0 ? profitableTrades.length / completedTrades.length : 0;
    const totalPnl = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    return {
      wallets: {
        total: this.monitoredWallets.size,
        byType: Object.values(WalletType).reduce((acc, type) => {
          acc[type] = Array.from(this.monitoredWallets.values()).filter(w => w.type === type).length;
          return acc;
        }, {} as Record<string, number>)
      },
      transactions: {
        total: Array.from(this.walletTransactions.values()).reduce((sum, txs) => sum + txs.length, 0)
      },
      unusualActivities: {
        total: this.unusualActivities.size,
        byType: Array.from(this.unusualActivities.values()).reduce((acc, activity) => {
          acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      patterns: {
        total: patterns.length,
        active: patterns.filter(p => p.status === 'active').length,
        confirmed: confirmedPatterns.length,
        invalidated: invalidatedPatterns.length,
        expired: patterns.filter(p => p.status === 'expired').length,
        successRate: patternSuccessRate,
        byType: patterns.reduce((acc, pattern) => {
          acc[pattern.patternType] = (acc[pattern.patternType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      trades: {
        total: trades.length,
        active: this.activeTrades.size,
        completed: completedTrades.length,
        profitable: profitableTrades.length,
        successRate: tradeSuccessRate,
        totalPnl,
        averagePnl: completedTrades.length > 0 ? totalPnl / completedTrades.length : 0,
        averagePnlPercentage: completedTrades.length > 0 ? 
          completedTrades.reduce((sum, t) => sum + (t.pnlPercentage || 0), 0) / completedTrades.length : 0
      },
      accountBalance: this.accountBalance
    };
  }
}

export default InsiderActivityDetection;
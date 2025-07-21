// ULTIMATE TRADING EMPIRE - MULTI-EXCHANGE INTEGRATION
// Connect to 20+ exchanges for unlimited arbitrage opportunities

import ccxt from 'ccxt';
import { EventEmitter } from 'events';
import { ArbitrageOpportunity } from '../types/core';
import { v4 as uuidv4 } from 'uuid';

export interface ExchangeConfig {
  id: string;
  name: string;
  apiKey?: string;
  secret?: string;
  sandbox?: boolean;
  rateLimit?: number;
  enabledFeatures: string[];
}

export class ExchangeManager extends EventEmitter {
  private exchanges: Map<string, ccxt.Exchange> = new Map();
  private exchangeConfigs: Map<string, ExchangeConfig> = new Map();
  private connectionStatus: Map<string, boolean> = new Map();
  private orderBooks: Map<string, Map<string, any>> = new Map();
  private lastPrices: Map<string, Map<string, number>> = new Map();

  constructor() {
    super();
    this.initializeExchangeConfigs();
  }

  /**
   * 🏗️ INITIALIZE EXCHANGE CONFIGURATIONS
   */
  private initializeExchangeConfigs(): void {
    const configs: ExchangeConfig[] = [
      // Tier 1 Exchanges - Highest Priority
      {
        id: 'binance',
        name: 'Binance',
        rateLimit: 1200,
        enabledFeatures: ['spot', 'futures', 'options', 'margin']
      },
      {
        id: 'coinbasepro',
        name: 'Coinbase Pro',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'advanced']
      },
      {
        id: 'kraken',
        name: 'Kraken',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures', 'margin']
      },
      {
        id: 'bybit',
        name: 'Bybit',
        rateLimit: 1200,
        enabledFeatures: ['spot', 'futures', 'options']
      },
      {
        id: 'okx',
        name: 'OKX',
        rateLimit: 1200,
        enabledFeatures: ['spot', 'futures', 'options', 'swap']
      },
      
      // Tier 2 Exchanges - High Volume
      {
        id: 'huobi',
        name: 'Huobi',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures']
      },
      {
        id: 'kucoin',
        name: 'KuCoin',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures', 'margin']
      },
      {
        id: 'gateio',
        name: 'Gate.io',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures', 'options']
      },
      {
        id: 'bitfinex',
        name: 'Bitfinex',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'margin']
      },
      {
        id: 'bitget',
        name: 'Bitget',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures']
      },
      
      // Tier 3 Exchanges - Arbitrage Opportunities
      {
        id: 'mexc',
        name: 'MEXC',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures']
      },
      {
        id: 'cryptocom',
        name: 'Crypto.com',
        rateLimit: 1000,
        enabledFeatures: ['spot']
      },
      {
        id: 'bingx',
        name: 'BingX',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures']
      },
      {
        id: 'phemex',
        name: 'Phemex',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures']
      },
      {
        id: 'bitmart',
        name: 'BitMart',
        rateLimit: 1000,
        enabledFeatures: ['spot', 'futures']
      }
    ];

    configs.forEach(config => {
      this.exchangeConfigs.set(config.id, config);
    });

    console.log(`🏗️ INITIALIZED ${configs.length} EXCHANGE CONFIGURATIONS`);
  }

  /**
   * 🚀 CONNECT TO ALL EXCHANGES
   */
  async connectToAllExchanges(): Promise<void> {
    console.log('🚀 CONNECTING TO ALL EXCHANGES...');

    const connectionPromises = Array.from(this.exchangeConfigs.keys()).map(exchangeId => 
      this.connectToExchange(exchangeId)
    );

    const results = await Promise.allSettled(connectionPromises);
    
    let successCount = 0;
    let failCount = 0;

    results.forEach((result, index) => {
      const exchangeId = Array.from(this.exchangeConfigs.keys())[index];
      if (result.status === 'fulfilled') {
        successCount++;
        console.log(`✅ Connected to ${exchangeId}`);
      } else {
        failCount++;
        console.error(`❌ Failed to connect to ${exchangeId}:`, result.reason);
      }
    });

    console.log(`🎯 EXCHANGE CONNECTIONS: ${successCount} successful, ${failCount} failed`);
    
    // Start monitoring connected exchanges
    this.startMarketDataStreams();
  }

  /**
   * 🔗 CONNECT TO SINGLE EXCHANGE
   */
  private async connectToExchange(exchangeId: string): Promise<void> {
    try {
      const config = this.exchangeConfigs.get(exchangeId);
      if (!config) {
        throw new Error(`Exchange config not found: ${exchangeId}`);
      }

      // Create exchange instance
      const ExchangeClass = ccxt[exchangeId as keyof typeof ccxt] as any;
      if (!ExchangeClass) {
        throw new Error(`Exchange not supported by ccxt: ${exchangeId}`);
      }

      const exchange = new ExchangeClass({
        apiKey: config.apiKey,
        secret: config.secret,
        sandbox: config.sandbox || false,
        rateLimit: config.rateLimit,
        enableRateLimit: true,
        timeout: 30000,
      });

      // Test connection
      await exchange.loadMarkets();
      
      this.exchanges.set(exchangeId, exchange);
      this.connectionStatus.set(exchangeId, true);
      this.orderBooks.set(exchangeId, new Map());
      this.lastPrices.set(exchangeId, new Map());

    } catch (error) {
      this.connectionStatus.set(exchangeId, false);
      throw error;
    }
  }

  /**
   * 📊 START MARKET DATA STREAMS
   */
  private startMarketDataStreams(): void {
    console.log('📊 STARTING MARKET DATA STREAMS...');

    // Start price monitoring for major pairs
    const majorPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'];
    
    this.exchanges.forEach((exchange, exchangeId) => {
      majorPairs.forEach(symbol => {
        this.startPriceStream(exchangeId, symbol);
      });
    });

    // Start arbitrage detection
    setInterval(() => {
      this.detectArbitrageOpportunities();
    }, 1000); // Check every second
  }

  /**
   * 💰 START PRICE STREAM FOR SYMBOL
   */
  private async startPriceStream(exchangeId: string, symbol: string): Promise<void> {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) return;

    try {
      // Fetch ticker data
      setInterval(async () => {
        try {
          const ticker = await exchange.fetchTicker(symbol);
          
          // Update last prices
          const exchangePrices = this.lastPrices.get(exchangeId) || new Map();
          exchangePrices.set(symbol, ticker.last || 0);
          this.lastPrices.set(exchangeId, exchangePrices);

          // Emit price update
          this.emit('priceUpdate', {
            exchange: exchangeId,
            symbol,
            price: ticker.last,
            timestamp: new Date()
          });

        } catch (error) {
          // Silently handle rate limit errors
          if (!error.toString().includes('rate limit')) {
            console.error(`Price stream error ${exchangeId}/${symbol}:`, error.message);
          }
        }
      }, 2000); // Every 2 seconds per symbol per exchange

    } catch (error) {
      console.error(`Failed to start price stream ${exchangeId}/${symbol}:`, error);
    }
  }

  /**
   * 🔍 DETECT ARBITRAGE OPPORTUNITIES
   */
  private detectArbitrageOpportunities(): void {
    const majorPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
    
    majorPairs.forEach(symbol => {
      const opportunities = this.findArbitrageForSymbol(symbol);
      opportunities.forEach(opportunity => {
        this.emit('arbitrageOpportunity', opportunity);
      });
    });
  }

  /**
   * 💎 FIND ARBITRAGE FOR SYMBOL
   */
  private findArbitrageForSymbol(symbol: string): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const exchangePrices: { exchange: string; price: number }[] = [];

    // Collect prices from all exchanges
    this.lastPrices.forEach((symbolPrices, exchangeId) => {
      const price = symbolPrices.get(symbol);
      if (price && price > 0) {
        exchangePrices.push({ exchange: exchangeId, price });
      }
    });

    if (exchangePrices.length < 2) return opportunities;

    // Sort by price
    exchangePrices.sort((a, b) => a.price - b.price);

    // Find profitable arbitrage opportunities
    for (let i = 0; i < exchangePrices.length - 1; i++) {
      for (let j = i + 1; j < exchangePrices.length; j++) {
        const buyExchange = exchangePrices[i];
        const sellExchange = exchangePrices[j];
        
        const priceDifference = sellExchange.price - buyExchange.price;
        const profitPercentage = (priceDifference / buyExchange.price) * 100;

        // Only consider opportunities with >0.5% profit potential
        if (profitPercentage > 0.5) {
          const opportunity: ArbitrageOpportunity = {
            id: uuidv4(),
            type: 'exchange',
            buyExchange: buyExchange.exchange,
            sellExchange: sellExchange.exchange,
            asset: symbol,
            buyPrice: buyExchange.price,
            sellPrice: sellExchange.price,
            priceDifference,
            profitPotential: profitPercentage,
            executionWindow: 30000, // 30 seconds
            requiredCapital: 1000, // $1000 minimum
            fees: 0.2, // 0.2% estimated fees
            slippage: 0.1, // 0.1% estimated slippage
            confidence: Math.min(0.9, profitPercentage / 5), // Higher profit = higher confidence
            detectedAt: new Date(),
            expiresAt: new Date(Date.now() + 30000)
          };

          opportunities.push(opportunity);
        }
      }
    }

    return opportunities;
  }

  /**
   * 📈 GET EXCHANGE PRICES
   */
  async getExchangePrices(symbol: string): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    const pricePromises = Array.from(this.exchanges.entries()).map(async ([exchangeId, exchange]) => {
      try {
        const ticker = await exchange.fetchTicker(symbol);
        if (ticker.last) {
          prices.set(exchangeId, ticker.last);
        }
      } catch (error) {
        // Silently handle errors for individual exchanges
      }
    });

    await Promise.allSettled(pricePromises);
    return prices;
  }

  /**
   * 💼 EXECUTE ARBITRAGE TRADE
   */
  async executeArbitrageTrade(opportunity: ArbitrageOpportunity, amount: number): Promise<any> {
    console.log(`💼 EXECUTING ARBITRAGE: ${opportunity.asset} - ${opportunity.profitPotential.toFixed(2)}% profit`);

    const buyExchange = this.exchanges.get(opportunity.buyExchange);
    const sellExchange = this.exchanges.get(opportunity.sellExchange);

    if (!buyExchange || !sellExchange) {
      throw new Error('Exchange not available for arbitrage execution');
    }

    try {
      // Execute buy order
      const buyOrder = await buyExchange.createMarketBuyOrder(opportunity.asset, amount);
      console.log(`✅ BUY ORDER: ${opportunity.buyExchange} - ${amount} ${opportunity.asset}`);

      // Execute sell order
      const sellOrder = await sellExchange.createMarketSellOrder(opportunity.asset, amount);
      console.log(`✅ SELL ORDER: ${opportunity.sellExchange} - ${amount} ${opportunity.asset}`);

      return {
        buyOrder,
        sellOrder,
        estimatedProfit: (opportunity.sellPrice - opportunity.buyPrice) * amount
      };

    } catch (error) {
      console.error('❌ ARBITRAGE EXECUTION ERROR:', error);
      throw error;
    }
  }

  /**
   * 📊 GET CONNECTION STATUS
   */
  getConnectionStatus(): Map<string, boolean> {
    return new Map(this.connectionStatus);
  }

  /**
   * 📈 GET MARKET OVERVIEW
   */
  getMarketOverview(): any {
    const overview = {
      connectedExchanges: Array.from(this.connectionStatus.entries())
        .filter(([_, connected]) => connected)
        .map(([exchange, _]) => exchange),
      totalExchanges: this.exchanges.size,
      monitoredPairs: 0,
      lastUpdate: new Date()
    };

    // Count monitored pairs
    this.lastPrices.forEach(symbolPrices => {
      overview.monitoredPairs += symbolPrices.size;
    });

    return overview;
  }

  /**
   * 🔄 RECONNECT TO EXCHANGE
   */
  async reconnectToExchange(exchangeId: string): Promise<void> {
    console.log(`🔄 RECONNECTING TO ${exchangeId}...`);
    
    // Close existing connection
    const existingExchange = this.exchanges.get(exchangeId);
    if (existingExchange) {
      this.exchanges.delete(exchangeId);
    }

    // Reconnect
    await this.connectToExchange(exchangeId);
    console.log(`✅ RECONNECTED TO ${exchangeId}`);
  }

  /**
   * 🛑 DISCONNECT FROM ALL EXCHANGES
   */
  async disconnectAll(): Promise<void> {
    console.log('🛑 DISCONNECTING FROM ALL EXCHANGES...');
    
    this.exchanges.clear();
    this.connectionStatus.clear();
    this.orderBooks.clear();
    this.lastPrices.clear();
    
    console.log('🛑 ALL EXCHANGES DISCONNECTED');
  }
}

export default ExchangeManager;
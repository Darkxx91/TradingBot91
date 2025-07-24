// COMPREHENSIVE BACKTESTING ENGINE TESTS
// Validates the backtesting engine with sample strategies and data

import ComprehensiveBacktestingEngine, {
  BacktestTimeframe,
  MarketDataPoint,
  BacktestStrategy,
  TradeSignal
} from '../core/comprehensive-backtesting-engine';
import ExchangeManager from '../exchanges/exchange-manager';

/**
 * Mock market data provider
 */
class MockMarketDataProvider {
  async getHistoricalData(
    symbol: string,
    timeframe: BacktestTimeframe,
    startDate: Date,
    endDate: Date
  ): Promise<MarketDataPoint[]> {
    const data: MarketDataPoint[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    let price = 50000; // Starting price
    
    while (current <= end) {
      // Generate realistic OHLC data
      const open = price;
      const change = (Math.random() - 0.5) * 0.02; // ±1% change
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      const volume = 1000000 + Math.random() * 5000000; // 1M-6M volume
      
      data.push({
        timestamp: new Date(current),
        symbol,
        open,
        high,
        low,
        close,
        volume,
        trades: Math.floor(volume / 1000),
        spread: 0.001 // 0.1% spread
      });
      
      price = close;
      current.setHours(current.getHours() + 1); // 1 hour intervals
    }
    
    return data;
  }
}

/**
 * Mock simple moving average strategy
 */
class MockSMAStrategy implements BacktestStrategy {
  id = 'sma_strategy';
  name = 'Simple Moving Average Strategy';
  
  private prices: number[] = [];
  private shortPeriod = 10;
  private longPeriod = 20;
  private position: 'long' | 'short' | 'none' = 'none';
  
  async initialize(config: any): Promise<void> {
    console.log('📊 Initializing SMA Strategy');
    this.prices = [];
    this.position = 'none';
  }
  
  async onMarketData(data: MarketDataPoint): Promise<TradeSignal[]> {
    this.prices.push(data.close);
    
    // Keep only required data points
    if (this.prices.length > this.longPeriod) {
      this.prices = this.prices.slice(-this.longPeriod);
    }
    
    // Need enough data for long MA
    if (this.prices.length < this.longPeriod) {
      return [];
    }
    
    // Calculate moving averages
    const shortMA = this.calculateMA(this.shortPeriod);
    const longMA = this.calculateMA(this.longPeriod);
    
    const signals: TradeSignal[] = [];
    
    // Generate signals
    if (shortMA > longMA && this.position !== 'long') {
      // Buy signal
      signals.push({
        symbol: data.symbol,
        side: 'buy',
        confidence: 0.8,
        reasoning: `SMA crossover: ${shortMA.toFixed(2)} > ${longMA.toFixed(2)}`,
        tags: ['sma', 'crossover', 'bullish']
      });
      this.position = 'long';
    } else if (shortMA < longMA && this.position !== 'short') {
      // Sell signal
      signals.push({
        symbol: data.symbol,
        side: 'sell',
        confidence: 0.8,
        reasoning: `SMA crossover: ${shortMA.toFixed(2)} < ${longMA.toFixed(2)}`,
        tags: ['sma', 'crossover', 'bearish']
      });
      this.position = 'short';
    }
    
    return signals;
  }
  
  async onTrade(trade: any): Promise<void> {
    console.log(`📊 SMA Strategy executed trade: ${trade.side} ${trade.quantity} ${trade.symbol} at ${trade.entryPrice}`);
  }
  
  async cleanup(): Promise<void> {
    console.log('📊 Cleaning up SMA Strategy');
  }
  
  getParameters(): Record<string, any> {
    return {
      shortPeriod: this.shortPeriod,
      longPeriod: this.longPeriod
    };
  }
  
  setParameters(params: Record<string, any>): void {
    if (params.shortPeriod) this.shortPeriod = params.shortPeriod;
    if (params.longPeriod) this.longPeriod = params.longPeriod;
  }
  
  getRequiredSymbols(): string[] {
    return ['BTC/USD'];
  }
  
  getRequiredTimeframes(): BacktestTimeframe[] {
    return [BacktestTimeframe.HOUR_1];
  }
  
  getMinimumDataPoints(): number {
    return this.longPeriod;
  }
  
  private calculateMA(period: number): number {
    const data = this.prices.slice(-period);
    return data.reduce((sum, price) => sum + price, 0) / data.length;
  }
}

/**
 * Mock RSI strategy
 */
class MockRSIStrategy implements BacktestStrategy {
  id = 'rsi_strategy';
  name = 'RSI Mean Reversion Strategy';
  
  private prices: number[] = [];
  private period = 14;
  private overbought = 70;
  private oversold = 30;
  private position: 'long' | 'short' | 'none' = 'none';
  
  async initialize(config: any): Promise<void> {
    console.log('📊 Initializing RSI Strategy');
    this.prices = [];
    this.position = 'none';
  }
  
  async onMarketData(data: MarketDataPoint): Promise<TradeSignal[]> {
    this.prices.push(data.close);
    
    // Keep only required data points
    if (this.prices.length > this.period + 1) {
      this.prices = this.prices.slice(-(this.period + 1));
    }
    
    // Need enough data for RSI
    if (this.prices.length < this.period + 1) {
      return [];
    }
    
    const rsi = this.calculateRSI();
    const signals: TradeSignal[] = [];
    
    // Generate signals
    if (rsi < this.oversold && this.position !== 'long') {
      // Buy signal (oversold)
      signals.push({
        symbol: data.symbol,
        side: 'buy',
        confidence: 0.7,
        reasoning: `RSI oversold: ${rsi.toFixed(2)} < ${this.oversold}`,
        tags: ['rsi', 'oversold', 'mean-reversion']
      });
      this.position = 'long';
    } else if (rsi > this.overbought && this.position !== 'short') {
      // Sell signal (overbought)
      signals.push({
        symbol: data.symbol,
        side: 'sell',
        confidence: 0.7,
        reasoning: `RSI overbought: ${rsi.toFixed(2)} > ${this.overbought}`,
        tags: ['rsi', 'overbought', 'mean-reversion']
      });
      this.position = 'short';
    }
    
    return signals;
  }
  
  async onTrade(trade: any): Promise<void> {
    console.log(`📊 RSI Strategy executed trade: ${trade.side} ${trade.quantity} ${trade.symbol} at ${trade.entryPrice}`);
  }
  
  async cleanup(): Promise<void> {
    console.log('📊 Cleaning up RSI Strategy');
  }
  
  getParameters(): Record<string, any> {
    return {
      period: this.period,
      overbought: this.overbought,
      oversold: this.oversold
    };
  }
  
  setParameters(params: Record<string, any>): void {
    if (params.period) this.period = params.period;
    if (params.overbought) this.overbought = params.overbought;
    if (params.oversold) this.oversold = params.oversold;
  }
  
  getRequiredSymbols(): string[] {
    return ['BTC/USD'];
  }
  
  getRequiredTimeframes(): BacktestTimeframe[] {
    return [BacktestTimeframe.HOUR_1];
  }
  
  getMinimumDataPoints(): number {
    return this.period + 1;
  }
  
  private calculateRSI(): number {
    const changes = [];
    for (let i = 1; i < this.prices.length; i++) {
      changes.push(this.prices[i] - this.prices[i - 1]);
    }
    
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
    
    const avgGain = gains.slice(-this.period).reduce((sum, gain) => sum + gain, 0) / this.period;
    const avgLoss = losses.slice(-this.period).reduce((sum, loss) => sum + loss, 0) / this.period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
}

/**
 * Run comprehensive backtesting tests
 */
async function runBacktestingTests(): Promise<void> {
  console.log('🚀 STARTING COMPREHENSIVE BACKTESTING ENGINE TESTS...');
  
  try {
    // Create mock exchange manager
    const exchangeManager = new ExchangeManager();
    
    // Create mock data provider
    const dataProvider = new MockMarketDataProvider();
    
    // Create backtesting engine
    const engine = new ComprehensiveBacktestingEngine(exchangeManager, dataProvider, {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      initialCapital: 100000,
      timeframe: BacktestTimeframe.HOUR_1,
      symbols: ['BTC/USD'],
      maxPositionSize: 5, // 5% position size
      tradingFees: {
        maker: 0.001,
        taker: 0.0015,
        withdrawal: 10
      }
    });
    
    // Add test strategies
    const smaStrategy = new MockSMAStrategy();
    const rsiStrategy = new MockRSIStrategy();
    
    engine.addStrategy(smaStrategy);
    engine.addStrategy(rsiStrategy);
    
    console.log('📊 Running backtest...');
    
    // Run backtest
    const results = await engine.runBacktest();
    
    // Display results
    console.log('\n📊 BACKTESTING RESULTS:');
    console.log('=' .repeat(50));
    
    const portfolioPerformance = engine.getPortfolioPerformance();
    console.log(`\n💰 PORTFOLIO PERFORMANCE:`);
    console.log(`Initial Capital: $${portfolioPerformance.initialCapital.toLocaleString()}`);
    console.log(`Final Equity: $${portfolioPerformance.finalEquity.toLocaleString()}`);
    console.log(`Total Return: ${portfolioPerformance.totalReturnPercentage.toFixed(2)}%`);
    console.log(`Max Drawdown: ${portfolioPerformance.maxDrawdown.toFixed(2)}%`);
    console.log(`Sharpe Ratio: ${portfolioPerformance.sharpeRatio.toFixed(2)}`);
    
    console.log(`\n📈 STRATEGY RESULTS:`);
    for (const [strategyId, result] of results.entries()) {
      console.log(`\n${result.strategyName}:`);
      console.log(`  Total Trades: ${result.totalTrades}`);
      console.log(`  Win Rate: ${result.winRate.toFixed(1)}%`);
      console.log(`  Total Return: ${result.totalPnlPercentage.toFixed(2)}%`);
      console.log(`  Max Drawdown: ${result.maxDrawdown.toFixed(2)}%`);
      console.log(`  Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}`);
      console.log(`  Profit Factor: ${result.profitFactor.toFixed(2)}`);
      console.log(`  Avg Win: $${result.averageWin.toFixed(2)}`);
      console.log(`  Avg Loss: $${result.averageLoss.toFixed(2)}`);
    }
    
    // Generate and display report
    console.log('\n📋 DETAILED REPORT:');
    console.log(engine.generateReport());
    
    // Export results
    const exportData = engine.exportResults();
    console.log('\n💾 Results exported to JSON format');
    
    console.log('\n✅ COMPREHENSIVE BACKTESTING ENGINE TESTS COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ BACKTESTING TEST ERROR:', error);
    throw error;
  }
}

// Export for use in other tests
export {
  MockMarketDataProvider,
  MockSMAStrategy,
  MockRSIStrategy,
  runBacktestingTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runBacktestingTests().catch(console.error);
}
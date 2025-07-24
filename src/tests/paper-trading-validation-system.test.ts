// PAPER TRADING VALIDATION SYSTEM TESTS
// Tests the paper trading system with live market simulation

import PaperTradingValidationSystem, {
  PaperTradingStrategy,
  LiveMarketData,
  TradeSignal
} from '../core/paper-trading-validation-system';
import ExchangeManager from '../exchanges/exchange-manager';

/**
 * Mock simple trend following strategy for paper trading
 */
class MockTrendFollowingStrategy implements PaperTradingStrategy {
  id = 'trend_following_paper';
  name = 'Paper Trading Trend Following';
  
  private prices: number[] = [];
  private period = 20;
  private position: 'long' | 'short' | 'none' = 'none';
  
  async initialize(config: any): Promise<void> {
    console.log('📊 Initializing Paper Trading Trend Following Strategy');
    this.prices = [];
    this.position = 'none';
  }
  
  async onMarketData(data: LiveMarketData): Promise<TradeSignal[]> {
    this.prices.push(data.price);
    
    // Keep only required data points
    if (this.prices.length > this.period) {
      this.prices = this.prices.slice(-this.period);
    }
    
    // Need enough data for moving average
    if (this.prices.length < this.period) {
      return [];
    }
    
    // Calculate moving average
    const ma = this.prices.reduce((sum, price) => sum + price, 0) / this.prices.length;
    const currentPrice = data.price;
    
    const signals: TradeSignal[] = [];
    
    // Generate signals based on price vs moving average
    if (currentPrice > ma * 1.02 && this.position !== 'long') { // 2% above MA
      signals.push({
        symbol: data.symbol,
        side: 'buy',
        confidence: 0.8,
        reasoning: `Price ${currentPrice.toFixed(2)} is 2%+ above MA ${ma.toFixed(2)}`,
        tags: ['trend', 'bullish', 'breakout']
      });
      this.position = 'long';
    } else if (currentPrice < ma * 0.98 && this.position !== 'short') { // 2% below MA
      signals.push({
        symbol: data.symbol,
        side: 'sell',
        confidence: 0.8,
        reasoning: `Price ${currentPrice.toFixed(2)} is 2%+ below MA ${ma.toFixed(2)}`,
        tags: ['trend', 'bearish', 'breakdown']
      });
      this.position = 'short';
    }
    
    return signals;
  }
  
  async onPositionUpdate(position: any): Promise<void> {
    console.log(`📊 Position updated: ${position.side} ${position.quantity.toFixed(4)} ${position.symbol} - Unrealized PnL: $${position.unrealizedPnl.toFixed(2)}`);
  }
  
  async onTradeExecuted(trade: any): Promise<void> {
    if (trade.status === 'closed') {
      console.log(`📊 Trade closed: ${trade.side} ${trade.quantity.toFixed(4)} ${trade.symbol} - Realized PnL: $${trade.realizedPnl?.toFixed(2)}`);
    } else {
      console.log(`📊 Trade opened: ${trade.side} ${trade.quantity.toFixed(4)} ${trade.symbol} at $${trade.entryPrice.toFixed(2)}`);
    }
  }
  
  async cleanup(): Promise<void> {
    console.log('📊 Cleaning up Paper Trading Trend Following Strategy');
  }
  
  getParameters(): Record<string, any> {
    return {
      period: this.period
    };
  }
  
  setParameters(params: Record<string, any>): void {
    if (params.period) this.period = params.period;
  }
  
  getRequiredSymbols(): string[] {
    return ['BTC/USD'];
  }
  
  getRiskParameters(): {
    maxPositionSize: number;
    stopLossPercentage?: number;
    takeProfitPercentage?: number;
  } {
    return {
      maxPositionSize: 3, // 3% position size
      stopLossPercentage: 2, // 2% stop loss
      takeProfitPercentage: 5 // 5% take profit
    };
  }
}

/**
 * Run paper trading validation tests
 */
async function runPaperTradingTests(): Promise<void> {
  console.log('🚀 STARTING PAPER TRADING VALIDATION SYSTEM TESTS...');
  
  try {
    // Create exchange manager
    const exchangeManager = new ExchangeManager();
    
    // Create paper trading system
    const paperTrading = new PaperTradingValidationSystem(exchangeManager, {
      initialBalance: 100000,
      updateIntervalMs: 1000, // 1 second for testing
      priceUpdateIntervalMs: 500, // 0.5 seconds for testing
      globalRiskLimits: {
        maxPositionSize: 5,
        maxDailyLoss: 3,
        maxDrawdown: 10,
        maxOpenPositions: 10,
        maxConcurrentStrategies: 5
      }
    });
    
    // Create test strategy
    const strategy = new MockTrendFollowingStrategy();
    
    // Start paper trading system
    await paperTrading.start();
    
    // Add strategy
    await paperTrading.addStrategy(strategy);
    
    console.log('📊 Running paper trading simulation for 30 seconds...');
    
    // Let it run for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Get results
    const accounts = paperTrading.getAllAccounts();
    const strategyPerformance = paperTrading.getAllStrategyPerformance();
    
    console.log('\n📊 PAPER TRADING RESULTS:');
    console.log('=' .repeat(50));
    
    // Display account performance
    for (const [accountId, account] of accounts.entries()) {
      console.log(`\n💰 Account: ${account.name}`);
      console.log(`Initial Balance: $${account.initialBalance.toLocaleString()}`);
      console.log(`Current Balance: $${account.currentBalance.toLocaleString()}`);
      console.log(`Total PnL: $${account.totalPnl.toLocaleString()} (${account.totalPnlPercentage.toFixed(2)}%)`);
      console.log(`Open Positions: ${account.positions.length}`);
      console.log(`Total Trades: ${account.trades.length}`);
      console.log(`Status: ${account.isActive ? 'Active' : 'Inactive'}`);
    }
    
    // Display strategy performance
    for (const [strategyId, performance] of strategyPerformance.entries()) {
      console.log(`\n📈 Strategy: ${performance.strategyName}`);
      console.log(`Total Trades: ${performance.totalTrades}`);
      console.log(`Win Rate: ${performance.winRate.toFixed(1)}%`);
      console.log(`Total PnL: $${performance.totalPnl.toLocaleString()} (${performance.totalPnlPercentage.toFixed(2)}%)`);
      console.log(`Realized PnL: $${performance.realizedPnl.toLocaleString()}`);
      console.log(`Unrealized PnL: $${performance.unrealizedPnl.toLocaleString()}`);
      console.log(`Max Drawdown: ${performance.maxDrawdown.toFixed(2)}%`);
      console.log(`Avg Execution Delay: ${performance.averageExecutionDelay.toFixed(0)}ms`);
      console.log(`Avg Slippage: ${performance.averageSlippage.toFixed(3)}%`);
    }
    
    // Generate and display report
    console.log('\n📋 DETAILED REPORT:');
    console.log(paperTrading.generatePerformanceReport());
    
    // Export results
    const exportData = paperTrading.exportResults();
    console.log('\n💾 Results exported to JSON format');
    
    // Stop system
    paperTrading.stop();
    
    console.log('\n✅ PAPER TRADING VALIDATION SYSTEM TESTS COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ PAPER TRADING TEST ERROR:', error);
    throw error;
  }
}

// Export for use in other tests
export {
  MockTrendFollowingStrategy,
  runPaperTradingTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runPaperTradingTests().catch(console.error);
}
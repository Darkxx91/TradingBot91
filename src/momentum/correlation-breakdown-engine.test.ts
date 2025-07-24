// ULTIMATE TRADING EMPIRE - CORRELATION BREAKDOWN ENGINE TESTS
// Exploit correlation breakdowns for 5-10 profitable trades per month

import BitcoinMovementDetector from './bitcoin-movement-detector';
import CorrelationBreakdownEngine, {
  CorrelationBreakdownEvent,
  CorrelationBreakdownTrade,
  CorrelationDataPoint
} from './correlation-breakdown-engine';
import ExchangeManager from '../exchanges/exchange-manager';
import { EventEmitter } from 'events';

/**
 * Mock Bitcoin Movement Detector
 */
class MockBitcoinMovementDetector extends EventEmitter {
  // No functionality needed for this test
}

/**
 * Mock Exchange Manager
 */
class MockExchangeManager extends EventEmitter {
  private prices: Map<string, number> = new Map();
  
  constructor() {
    super();
    // Initialize with some prices
    this.prices.set('ETH/BTC', 0.06);
    this.prices.set('SOL/BTC', 0.002);
    this.prices.set('BNB/BTC', 0.01);
    this.prices.set('XRP/BTC', 0.00002);
    this.prices.set('ADA/BTC', 0.00003);
  }
  
  updatePrice(symbol: string, price: number): void {
    this.prices.set(symbol, price);
    this.emit('priceUpdate', {
      symbol,
      price,
      exchange: 'binance',
      timestamp: new Date()
    });
  }
}/**

 * Test the Correlation Breakdown Engine
 */
async function testCorrelationBreakdownEngine() {
  console.log('⚡ TESTING CORRELATION BREAKDOWN ENGINE...');
  
  // Create mock Bitcoin movement detector
  const bitcoinDetector = new MockBitcoinMovementDetector();
  
  // Create mock exchange manager
  const exchangeManager = new MockExchangeManager();
  
  // Create correlation breakdown engine
  const engine = new CorrelationBreakdownEngine(
    exchangeManager as unknown as ExchangeManager,
    bitcoinDetector as unknown as BitcoinMovementDetector,
    {
      defaultBreakdownThreshold: 0.2,
      defaultNormalCorrelationMin: 0.5,
      defaultNormalCorrelationMax: 0.9,
      minConfidence: 0.7,
      minDataPoints: 30,
      defaultLookbackPeriodMs: 30 * 24 * 60 * 60 * 1000,
      correlationCalculationIntervalMs: 1000, // 1 second for testing
      maxActiveTrades: 5,
      riskPerTrade: 0.02,
      defaultStopLoss: 0.05,
      defaultTakeProfit: 0.1
    }
  );
  
  // Set up event listeners
  engine.on('breakdownDetected', (event: CorrelationBreakdownEvent) => {
    console.log(`🔍 BREAKDOWN DETECTED: ${event.pair} correlation: ${event.currentCorrelation.toFixed(2)}`);
  });
  
  engine.on('tradeCreated', (trade: CorrelationBreakdownTrade) => {
    console.log(`💰 TRADE CREATED: ${trade.entrySignal.side.toUpperCase()} ${trade.entrySignal.asset}`);
  });
  
  engine.on('entryExecuted', (trade: CorrelationBreakdownTrade) => {
    console.log(`✅ ENTRY EXECUTED: ${trade.entrySignal.side.toUpperCase()} ${trade.entrySignal.asset} @ ${trade.entryPrice.toFixed(2)}`);
  });
  
  engine.on('exitExecuted', (trade: CorrelationBreakdownTrade) => {
    console.log(`✅ EXIT EXECUTED: ${trade.exitSignal.side.toUpperCase()} ${trade.exitSignal.asset} @ ${trade.exitPrice.toFixed(2)}`);
    console.log(`💰 P&L: ${trade.pnl.toFixed(2)} (${trade.pnlPercentage.toFixed(2)}%)`);
  });
  
  // Start the engine
  await engine.start(['ETH/BTC', 'SOL/BTC', 'BNB/BTC'], 'test-account', 10000);
  
  console.log('📊 ENGINE STARTED, WAITING FOR BREAKDOWNS...');
  
  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate correlation breakdowns by directly calling the private method
  // In a real scenario, this would happen through the correlation calculation
  console.log('\n🚀 SIMULATING CORRELATION BREAKDOWN...');
  
  // Use any to access private method for testing
  (engine as any).detectCorrelationBreakdown('ETH/BTC', 0.15, 100);
  
  // Wait for trade creation and execution
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get active breakdowns
  const breakdowns = engine.getActiveBreakdowns();
  console.log(`\n📊 ACTIVE BREAKDOWNS: ${breakdowns.length}`);
  
  breakdowns.forEach((breakdown, index) => {
    console.log(`${index + 1}. ${breakdown.pair} correlation: ${breakdown.currentCorrelation.toFixed(2)}`);
    console.log(`   Expected reversion to ${breakdown.expectedReversionTarget.toFixed(2)} in ${Math.round(breakdown.expectedReversionTimeMs / (24 * 60 * 60 * 1000))} days`);
    console.log(`   Confidence: ${(breakdown.confidence * 100).toFixed(1)}%`);
  });
  
  // Get active trades
  const trades = engine.getActiveTrades();
  console.log(`\n📊 ACTIVE TRADES: ${trades.length}`);
  
  trades.forEach((trade, index) => {
    console.log(`${index + 1}. ${trade.entrySignal.side.toUpperCase()} ${trade.entrySignal.asset} @ ${trade.entryPrice.toFixed(2)}`);
    console.log(`   Status: ${trade.status}`);
  });
  
  // Simulate fast exit for testing
  console.log('\n🚀 SIMULATING TRADE EXIT...');
  
  for (const trade of trades) {
    // Use any to access private method for testing
    await (engine as any).executeExit(trade);
  }
  
  // Get statistics
  const stats = engine.getStatistics();
  console.log('\n📊 ENGINE STATISTICS:');
  console.log(`Monitored Pairs: ${stats.monitoredPairs}`);
  console.log(`Active Breakdowns: ${stats.activeBreakdowns}`);
  console.log(`Active Trades: ${stats.activeTrades}`);
  console.log(`Completed Trades: ${stats.completedTrades}`);
  console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
  console.log(`Total P&L: ${stats.totalPnl.toFixed(2)}`);
  console.log(`Average P&L: ${stats.avgPnl.toFixed(2)} (${stats.avgPnlPercentage.toFixed(2)}%)`);
  
  // Stop the engine
  engine.stop();
  console.log('\n✅ CORRELATION BREAKDOWN ENGINE TEST COMPLETE');
}

// Run the test
testCorrelationBreakdownEngine().catch(error => {
  console.error('Error testing correlation breakdown engine:', error);
});
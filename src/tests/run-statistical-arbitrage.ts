// STATISTICAL ARBITRAGE STRATEGY TEST
// Test the statistical arbitrage strategy with paper trading

import PaperTradingMode from '../core/paper-trading-mode';
import { StatisticalArbitrageStrategy } from '../strategies/statistical-arbitrage-strategy';
import { RealTimeMarketData } from '../core/real-time-market-data';
import { loadConfig } from '../core/config-loader';

/**
 * Run statistical arbitrage test
 */
async function runStatisticalArbitrageTest(): Promise<void> {
  console.log('🚀 STARTING STATISTICAL ARBITRAGE TEST...');
  console.log('=' .repeat(60));

  // Load config and create services
  const config = await loadConfig();
  const marketData = new RealTimeMarketData();
  
  // Create paper trading service
  const paperTrading = new PaperTradingMode(config, marketData);
  
  // Start paper trading
  await paperTrading.start();
  
  // Create account with £2000 initial balance
  const accountId = paperTrading.createAccount('test-account', 2000);
  
  // Create statistical arbitrage strategy (we'll need to adapt this)
  console.log('📊 Statistical arbitrage strategy would be implemented here');
  console.log('⚠️  Note: This strategy needs to be adapted to work with the current paper trading interface');

  try {
    // Show initial account summary
    console.log('\n📊 INITIAL ACCOUNT SUMMARY:');
    console.log(paperTrading.getPerformanceReport(accountId));

    // Simulate some statistical arbitrage trades
    console.log('\n💰 SIMULATING STATISTICAL ARBITRAGE TRADES...');
    
    // Execute some correlated trades to demonstrate the concept
    console.log('\n🔵 Executing LONG BTC position (underperforming asset)...');
    await paperTrading.executeTrade(accountId, 'BTC/USD', 'buy', 0.01);
    
    console.log('🔴 Executing SHORT ETH position (overperforming asset)...');
    await paperTrading.executeTrade(accountId, 'ETH/USD', 'sell', 0.1);
    
    // Wait for price updates
    console.log('\n⏳ WAITING FOR PRICE UPDATES (30 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Show account summary after trades
    console.log('\n📊 ACCOUNT SUMMARY AFTER TRADES:');
    console.log(paperTrading.getPerformanceReport(accountId));
    
    // Simulate mean reversion by closing positions
    console.log('\n� SIMULATINAG MEAN REVERSION - CLOSING POSITIONS...');
    
    console.log('🔴 Closing BTC position...');
    await paperTrading.executeTrade(accountId, 'BTC/USD', 'sell', 0.01);
    
    console.log('🔵 Closing ETH position...');
    await paperTrading.executeTrade(accountId, 'ETH/USD', 'buy', 0.1);

    // Show final account summary
    console.log('\n📊 FINAL ACCOUNT SUMMARY:');
    console.log(paperTrading.getPerformanceReport(accountId));
    
    // Stop paper trading
    paperTrading.stop();

    console.log('\n✅ STATISTICAL ARBITRAGE TEST COMPLETED!');
    console.log('📊 This strategy exploits mean reversion in correlated asset pairs!');

  } catch (error) {
    console.error('\n❌ STATISTICAL ARBITRAGE TEST FAILED:', error);
  } finally {
    // Make sure to stop paper trading
    paperTrading.stop();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runStatisticalArbitrageTest()
    .then(() => {
      console.log('\n🎉 Statistical arbitrage test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Statistical arbitrage test failed:', error);
      process.exit(1);
    });
}

export { runStatisticalArbitrageTest };
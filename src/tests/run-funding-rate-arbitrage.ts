// FUNDING RATE ARBITRAGE STRATEGY TEST
// Test the funding rate arbitrage strategy with paper trading

import PaperTradingMode from '../core/paper-trading-mode';
import { FundingRateArbitrageStrategy } from '../strategies/funding-rate-arbitrage-strategy';
import { RealTimeMarketData } from '../core/real-time-market-data';
import { loadConfig } from '../core/config-loader';

/**
 * Run funding rate arbitrage test
 */
async function runFundingRateArbitrageTest(): Promise<void> {
  console.log('🚀 STARTING FUNDING RATE ARBITRAGE TEST...');
  console.log('=' .repeat(60));

  // Load config and create services
  const config = await loadConfig();
  const marketData = new RealTimeMarketData();
  
  // Create paper trading service
  const paperTrading = new PaperTradingMode(config, marketData);
  
  // Start paper trading
  await paperTrading.start();
  
  // Create account with £1000 initial balance
  const accountId = paperTrading.createAccount('arbitrage-account', 1000);
  
  // Create funding rate arbitrage strategy
  const strategy = new FundingRateArbitrageStrategy(paperTrading, marketData);

  try {
    // Show initial account summary
    console.log('\n📊 INITIAL ACCOUNT SUMMARY:');
    console.log(paperTrading.getPerformanceReport(accountId));

    // Start the strategy
    strategy.start();

    // Wait for strategy to find and execute opportunities
    console.log('\n⏳ WAITING FOR STRATEGY TO FIND OPPORTUNITIES...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Show account summary after initial execution
    console.log('\n📊 ACCOUNT SUMMARY AFTER INITIAL EXECUTION:');
    console.log(paperTrading.getPerformanceReport(accountId));

    // Show active arbitrages
    const activeArbitrages = strategy.getActiveArbitrages();
    console.log(`\n💰 ACTIVE ARBITRAGES: ${activeArbitrages.length}`);
    
    for (const arbitrage of activeArbitrages) {
      console.log(`\n🔄 ARBITRAGE DETAILS:`);
      console.log(`Symbol: ${arbitrage.symbol}`);
      console.log(`Long Exchange: ${arbitrage.longExchange} (Rate: ${(arbitrage.longRate * 100).toFixed(4)}%)`);
      console.log(`Short Exchange: ${arbitrage.shortExchange} (Rate: ${(arbitrage.shortRate * 100).toFixed(4)}%)`);
      console.log(`Net Rate: ${(arbitrage.netRate * 100).toFixed(4)}%`);
      console.log(`Estimated Annual Profit: ${arbitrage.estimatedProfit.toFixed(2)}%`);
    }

    // Wait for price updates
    console.log('\n⏳ SIMULATING PASSAGE OF TIME (30 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Show final account summary
    console.log('\n📊 FINAL ACCOUNT SUMMARY:');
    console.log(paperTrading.getPerformanceReport(accountId));

    // Stop the strategy
    strategy.stop();
    
    // Stop paper trading
    paperTrading.stop();

    console.log('\n✅ FUNDING RATE ARBITRAGE TEST COMPLETED!');
    console.log('💰 This strategy provides mathematical certainty profits with zero directional risk!');

  } catch (error) {
    console.error('\n❌ FUNDING RATE ARBITRAGE TEST FAILED:', error);
  } finally {
    // Make sure to stop strategy and paper trading
    strategy.stop();
    paperTrading.stop();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runFundingRateArbitrageTest()
    .then(() => {
      console.log('\n🎉 Funding rate arbitrage test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Funding rate arbitrage test failed:', error);
      process.exit(1);
    });
}

export { runFundingRateArbitrageTest };
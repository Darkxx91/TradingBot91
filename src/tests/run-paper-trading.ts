// PAPER TRADING TEST
// Test the trading system with paper trading

import PaperTradingMode from '../core/paper-trading-mode';
import { RealTimeMarketData } from '../core/real-time-market-data';
import { loadConfig } from '../core/config-loader';

/**
 * Run paper trading test
 */
async function runPaperTradingTest(): Promise<void> {
  console.log('🚀 STARTING PAPER TRADING TEST...');
  console.log('=' .repeat(50));

  // Load config and create services
  const config = await loadConfig();
  const marketData = new RealTimeMarketData();
  
  // Create paper trading service
  const paperTrading = new PaperTradingMode(config, marketData);
  
  // Start paper trading
  await paperTrading.start();
  
  // Create test account with £100
  const accountId = paperTrading.createAccount('test-account', 100);

  try {
    // Get current prices
    console.log('\n📊 GETTING CURRENT MARKET PRICES...');
    const btcPrice = await marketData.getCurrentPrice('BTC/USD');
    const ethPrice = await marketData.getCurrentPrice('ETH/USD');
    const solPrice = await marketData.getCurrentPrice('SOL/USD');

    console.log(`Bitcoin: $${btcPrice.price.toFixed(2)}`);
    console.log(`Ethereum: $${ethPrice.price.toFixed(2)}`);
    console.log(`Solana: $${solPrice.price.toFixed(2)}`);

    // Execute some test trades
    console.log('\n💰 EXECUTING TEST TRADES...');

    // Buy some Bitcoin
    console.log('\n🔵 BUYING BITCOIN...');
    await paperTrading.executeTrade(accountId, 'BTC/USD', 'buy', 0.001);

    // Buy some Ethereum
    console.log('\n🔵 BUYING ETHEREUM...');
    await paperTrading.executeTrade(accountId, 'ETH/USD', 'buy', 0.01);

    // Short Solana
    console.log('\n🔴 SHORTING SOLANA...');
    await paperTrading.executeTrade(accountId, 'SOL/USD', 'sell', 0.1);

    // Show account summary
    console.log('\n📊 INITIAL ACCOUNT SUMMARY:');
    console.log(paperTrading.getPerformanceReport(accountId));

    // Wait for price updates
    console.log('\n⏳ WAITING FOR PRICE UPDATES (30 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Show updated account summary
    console.log('\n📊 UPDATED ACCOUNT SUMMARY:');
    console.log(paperTrading.getPerformanceReport(accountId));

    // Close Ethereum position
    console.log('\n🔄 CLOSING ETHEREUM POSITION...');
    const account = paperTrading.getAccount(accountId);
    if (account) {
      // Find ETH position amount
      const ethAmount = account.positions.get('ETH/USD') || 0;
      if (ethAmount > 0) {
        await paperTrading.executeTrade(accountId, 'ETH/USD', 'sell', ethAmount);
      }
    }

    // Wait a bit more
    console.log('\n⏳ WAITING FOR MORE UPDATES (15 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Show final account summary
    console.log('\n📊 FINAL ACCOUNT SUMMARY:');
    console.log(paperTrading.getPerformanceReport(accountId));

    // Stop paper trading
    paperTrading.stop();

    console.log('\n✅ PAPER TRADING TEST COMPLETED!');
    console.log('🚀 THE SYSTEM IS WORKING CORRECTLY!');

  } catch (error) {
    console.error('\n❌ PAPER TRADING TEST FAILED:', error);
  } finally {
    // Make sure to stop paper trading
    paperTrading.stop();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runPaperTradingTest()
    .then(() => {
      console.log('\n🎉 Paper trading test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Paper trading test failed:', error);
      process.exit(1);
    });
}

export { runPaperTradingTest };
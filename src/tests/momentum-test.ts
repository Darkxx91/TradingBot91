// ULTIMATE TRADING EMPIRE - MOMENTUM SYSTEM TEST
// Test the Bitcoin Movement Detector and Correlation Analyzer

import ExchangeManager from '../exchanges/exchange-manager';
import { BitcoinMovementDetector, CorrelationAnalyzer } from '../momentum';
import { BitcoinMovement, MomentumTransferOpportunity } from '../momentum';

async function testMomentumSystem() {
  console.log('🚀 TESTING MOMENTUM TRANSFER SYSTEM...');
  
  // Initialize exchange manager
  const exchangeManager = new ExchangeManager();
  await exchangeManager.connectToAllExchanges();
  
  // Initialize Bitcoin movement detector
  const bitcoinDetector = new BitcoinMovementDetector(exchangeManager);
  
  // Initialize correlation analyzer
  const correlationAnalyzer = new CorrelationAnalyzer(exchangeManager, bitcoinDetector);
  
  // Set up event listeners
  bitcoinDetector.on('significantMovement', (movement: BitcoinMovement) => {
    console.log(`🚨 SIGNIFICANT BITCOIN MOVEMENT DETECTED: ${movement.direction.toUpperCase()} ${movement.magnitude.toFixed(2)}%`);
  });
  
  correlationAnalyzer.on('momentumTransferOpportunity', (opportunity: MomentumTransferOpportunity) => {
    console.log(`💰 MOMENTUM TRANSFER OPPORTUNITY: ${opportunity.altcoinSymbol}`);
    console.log(`📊 Expected ${opportunity.bitcoinMovement.direction} movement: ${opportunity.expectedMagnitude.toFixed(2)}%`);
    console.log(`⏱️ Optimal Entry: ${opportunity.optimalEntryTime.toLocaleTimeString()}, Exit: ${opportunity.optimalExitTime.toLocaleTimeString()}`);
  });
  
  // Start monitoring
  await bitcoinDetector.startMonitoring();
  await correlationAnalyzer.startMonitoring();
  
  console.log('✅ MOMENTUM TRANSFER SYSTEM ACTIVE!');
  
  // Keep the process running
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get stats after running for a while
      const btcStats = bitcoinDetector.getMovementStats();
      const corrStats = correlationAnalyzer.getCorrelationStats();
      
      console.log('📊 BITCOIN MOVEMENT STATS:', JSON.stringify(btcStats, null, 2));
      console.log('📊 CORRELATION STATS:', JSON.stringify(corrStats, null, 2));
      
      // Stop monitoring
      bitcoinDetector.stopMonitoring();
      correlationAnalyzer.stopMonitoring();
      
      console.log('✅ TEST COMPLETED');
      resolve(true);
    }, 60000); // Run for 1 minute
  });
}

// Run the test
testMomentumSystem().catch(console.error);
// ULTIMATE TRADING EMPIRE - MOMENTUM TRANSFER SYSTEM TEST
// Test the complete momentum transfer system

import ExchangeManager from '../exchanges/exchange-manager';
import { BitcoinMovementDetector, CorrelationAnalyzer, MomentumTransferEngine } from '../momentum';
import { BitcoinMovement, MomentumTransferOpportunity, MomentumTransferTrade } from '../momentum';
import { TradeSignal } from '../types/core';

async function testMomentumTransferSystem() {
  console.log('🚀 TESTING MOMENTUM TRANSFER SYSTEM...');
  
  // Initialize exchange manager
  const exchangeManager = new ExchangeManager();
  await exchangeManager.connectToAllExchanges();
  
  // Initialize Bitcoin movement detector
  const bitcoinDetector = new BitcoinMovementDetector(exchangeManager);
  
  // Initialize correlation analyzer
  const correlationAnalyzer = new CorrelationAnalyzer(exchangeManager, bitcoinDetector);
  
  // Initialize momentum transfer engine
  const momentumEngine = new MomentumTransferEngine(exchangeManager, bitcoinDetector, correlationAnalyzer);
  
  // Set up event listeners
  bitcoinDetector.on('significantMovement', (movement: BitcoinMovement) => {
    console.log(`🚨 SIGNIFICANT BITCOIN MOVEMENT DETECTED: ${movement.direction.toUpperCase()} ${movement.magnitude.toFixed(2)}%`);
  });
  
  correlationAnalyzer.on('momentumTransferOpportunity', (opportunity: MomentumTransferOpportunity) => {
    console.log(`💰 MOMENTUM TRANSFER OPPORTUNITY: ${opportunity.altcoinSymbol}`);
    console.log(`📊 Expected ${opportunity.bitcoinMovement.direction} movement: ${opportunity.expectedMagnitude.toFixed(2)}%`);
    console.log(`⏱️ Optimal Entry: ${opportunity.optimalEntryTime.toLocaleTimeString()}, Exit: ${opportunity.optimalExitTime.toLocaleTimeString()}`);
  });
  
  momentumEngine.on('tradeSignal', (signal: TradeSignal) => {
    console.log(`📊 TRADE SIGNAL: ${signal.side.toUpperCase()} ${signal.asset} @ ${signal.price}`);
  });
  
  momentumEngine.on('tradeCompleted', (trade: MomentumTransferTrade) => {
    console.log(`✅ TRADE COMPLETED: ${trade.opportunity.altcoinSymbol}`);
    console.log(`📊 P&L: ${trade.pnl!.toFixed(2)} (${trade.pnlPercentage!.toFixed(2)}%)`);
  });
  
  // Start the system
  await bitcoinDetector.startMonitoring();
  await correlationAnalyzer.startMonitoring();
  await momentumEngine.start('test-account', 10000); // $10,000 test account
  
  console.log('✅ MOMENTUM TRANSFER SYSTEM ACTIVE!');
  
  // Keep the process running
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get stats after running for a while
      const btcStats = bitcoinDetector.getMovementStats();
      const corrStats = correlationAnalyzer.getCorrelationStats();
      const tradeStats = momentumEngine.getTradeStats();
      
      console.log('📊 BITCOIN MOVEMENT STATS:', JSON.stringify(btcStats, null, 2));
      console.log('📊 CORRELATION STATS:', JSON.stringify(corrStats, null, 2));
      console.log('📊 TRADE STATS:', JSON.stringify(tradeStats, null, 2));
      
      // Stop the system
      bitcoinDetector.stopMonitoring();
      correlationAnalyzer.stopMonitoring();
      momentumEngine.stop();
      
      console.log('✅ TEST COMPLETED');
      resolve(true);
    }, 120000); // Run for 2 minutes
  });
}

// Run the test
testMomentumTransferSystem().catch(console.error);
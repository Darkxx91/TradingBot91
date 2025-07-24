// ULTIMATE TRADING EMPIRE - CORRELATION BREAKDOWN SYSTEM TEST
// Test the correlation breakdown alert and trading system

import ExchangeManager from '../exchanges/exchange-manager';
import { BitcoinMovementDetector, CorrelationAnalyzer, CorrelationBreakdownEngine } from '../momentum';
import { CorrelationBreakdown, TradeSignal } from '../types/core';
import { CorrelationBreakdownOpportunity, CorrelationBreakdownTrade } from '../momentum';

async function testCorrelationBreakdownSystem() {
  console.log('🚀 TESTING CORRELATION BREAKDOWN SYSTEM...');
  
  // Initialize exchange manager
  const exchangeManager = new ExchangeManager();
  await exchangeManager.connectToAllExchanges();
  
  // Initialize Bitcoin movement detector (needed for correlation analyzer)
  const bitcoinDetector = new BitcoinMovementDetector(exchangeManager);
  
  // Initialize correlation analyzer
  const correlationAnalyzer = new CorrelationAnalyzer(exchangeManager, bitcoinDetector);
  
  // Initialize correlation breakdown engine
  const breakdownEngine = new CorrelationBreakdownEngine(exchangeManager, correlationAnalyzer);
  
  // Set up event listeners
  correlationAnalyzer.on('correlationBreakdown', (breakdown: CorrelationBreakdown) => {
    console.log(`🚨 CORRELATION BREAKDOWN DETECTED: ${breakdown.asset1}-${breakdown.asset2}`);
    console.log(`📊 Historical: ${breakdown.normalCorrelation.toFixed(2)}, Current: ${breakdown.currentCorrelation.toFixed(2)}`);
    console.log(`📊 Breakdown Magnitude: ${breakdown.breakdownMagnitude.toFixed(2)}`);
  });
  
  breakdownEngine.on('opportunityDetected', (opportunity: CorrelationBreakdownOpportunity) => {
    console.log(`💰 CORRELATION BREAKDOWN OPPORTUNITY: ${opportunity.longAsset}-${opportunity.shortAsset}`);
    console.log(`📊 LONG ${opportunity.longAsset} @ ${opportunity.longEntryPrice.toFixed(2)}, SHORT ${opportunity.shortAsset} @ ${opportunity.shortEntryPrice.toFixed(2)}`);
    console.log(`⏱️ Expected Reversion: ${(opportunity.expectedReversionTime / 3600000).toFixed(1)} hours`);
  });
  
  breakdownEngine.on('tradeSignal', (signal: TradeSignal) => {
    console.log(`📊 TRADE SIGNAL: ${signal.side.toUpperCase()} ${signal.asset} @ ${signal.price?.toFixed(2) || 'market'}`);
  });
  
  breakdownEngine.on('tradeCompleted', (trade: CorrelationBreakdownTrade) => {
    console.log(`✅ CORRELATION BREAKDOWN TRADE COMPLETED:`);
    console.log(`📊 LONG ${trade.opportunity.longAsset}: ${((trade.actualLongExitPrice! - trade.actualLongEntryPrice!) / trade.actualLongEntryPrice! * 100).toFixed(2)}%`);
    console.log(`📊 SHORT ${trade.opportunity.shortAsset}: ${((trade.actualShortEntryPrice! - trade.actualShortExitPrice!) / trade.actualShortEntryPrice! * 100).toFixed(2)}%`);
    console.log(`📊 TOTAL P&L: ${trade.pnl?.toFixed(2) || 'N/A'} (${trade.pnlPercentage?.toFixed(2) || 'N/A'}%)`);
  });
  
  // Start the system
  await bitcoinDetector.startMonitoring();
  await correlationAnalyzer.startMonitoring();
  await breakdownEngine.start('test-account', 10000); // $10,000 test account
  
  console.log('✅ CORRELATION BREAKDOWN SYSTEM ACTIVE!');
  
  // Simulate a correlation breakdown for testing
  simulateCorrelationBreakdown(correlationAnalyzer);
  
  // Keep the process running
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get stats after running for a while
      const corrStats = correlationAnalyzer.getCorrelationStats();
      const breakdownStats = breakdownEngine.getTradeStats();
      
      console.log('📊 CORRELATION STATS:', JSON.stringify(corrStats, null, 2));
      console.log('📊 BREAKDOWN STATS:', JSON.stringify(breakdownStats, null, 2));
      
      // Stop the system
      bitcoinDetector.stopMonitoring();
      correlationAnalyzer.stopMonitoring();
      breakdownEngine.stop();
      
      console.log('✅ TEST COMPLETED');
      resolve(true);
    }, 120000); // Run for 2 minutes
  });
}

/**
 * Simulate a correlation breakdown for testing purposes
 */
function simulateCorrelationBreakdown(correlationAnalyzer: CorrelationAnalyzer) {
  setTimeout(() => {
    console.log('🔧 SIMULATING CORRELATION BREAKDOWN...');
    
    // Create a simulated breakdown
    const breakdown: CorrelationBreakdown = {
      id: 'simulated-breakdown-1',
      asset1: 'ETH/USDT',
      asset2: 'BTC/USDT',
      normalCorrelation: 0.85, // Historically highly correlated
      currentCorrelation: 0.25, // Suddenly correlation dropped
      breakdownMagnitude: 0.6, // Difference between normal and current
      expectedReversionTime: 7200000, // 2 hours
      tradingStrategy: 'long-short', // Long ETH, Short BTC
      confidence: 0.85,
      detectedAt: new Date()
    };
    
    // Emit the breakdown event
    correlationAnalyzer.emit('correlationBreakdown', breakdown);
    
  }, 10000); // Simulate after 10 seconds
}

// Run the test
testCorrelationBreakdownSystem().catch(console.error);
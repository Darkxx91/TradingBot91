// ULTIMATE TRADING EMPIRE - REGULATORY MONITORING SYSTEM TEST
// Test the regulatory monitoring, analysis, and trading system

import ExchangeManager from '../exchanges/exchange-manager';
import { 
  RegulatoryMonitor, 
  RegulatoryAnalyzer, 
  RegulatoryTradingEngine,
  RegulatoryEvent,
  RegulatoryAnalysis,
  RegulatoryTrade
} from '../regulatory';
import { TradeSignal } from '../types/core';

async function testRegulatorySystem() {
  console.log('🚀 TESTING REGULATORY MONITORING SYSTEM...');
  
  // Initialize exchange manager
  const exchangeManager = new ExchangeManager();
  await exchangeManager.connectToAllExchanges();
  
  // Initialize regulatory components
  const regulatoryMonitor = new RegulatoryMonitor();
  const regulatoryAnalyzer = new RegulatoryAnalyzer();
  const regulatoryTradingEngine = new RegulatoryTradingEngine(
    exchangeManager,
    regulatoryMonitor,
    regulatoryAnalyzer
  );
  
  // Set up event listeners
  regulatoryMonitor.on('regulatoryEvent', (event: RegulatoryEvent) => {
    console.log(`🚨 REGULATORY EVENT DETECTED: ${event.title}`);
    console.log(`📊 Source: ${event.source.toUpperCase()}, Impact: ${event.impact}, Confidence: ${event.confidence.toFixed(2)}`);
  });
  
  regulatoryAnalyzer.on('analysis', (analysis: RegulatoryAnalysis) => {
    console.log(`📊 REGULATORY ANALYSIS COMPLETE: ${analysis.analysisTimeMs}ms`);
    console.log(`📊 Sentiment: ${analysis.detailedSentiment.positive.toFixed(2)} positive, ${analysis.detailedSentiment.negative.toFixed(2)} negative`);
    console.log(`📊 Market Impact: Short-term ${analysis.marketImpact.shortTerm.toFixed(2)}, Medium-term ${analysis.marketImpact.mediumTerm.toFixed(2)}`);
  });
  
  regulatoryTradingEngine.on('tradeSignal', (signal: TradeSignal) => {
    console.log(`📊 REGULATORY TRADE SIGNAL: ${signal.side.toUpperCase()} ${signal.asset} @ ${signal.price?.toFixed(2) || 'market'}`);
    console.log(`💰 Quantity: ${signal.quantity.toFixed(2)}, Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
  });
  
  regulatoryTradingEngine.on('tradeClosed', (trade: RegulatoryTrade) => {
    console.log(`✅ REGULATORY TRADE CLOSED: ${trade.tradeSignal.asset}`);
    console.log(`📊 P&L: ${trade.pnl?.toFixed(2) || 'N/A'} (${trade.pnlPercentage?.toFixed(2) || 'N/A'}%)`);
    console.log(`📈 Entry: ${trade.entryPrice?.toFixed(2) || 'N/A'}, Exit: ${trade.exitPrice?.toFixed(2) || 'N/A'}`);
  });
  
  // Start the system
  await regulatoryMonitor.startMonitoring();
  regulatoryAnalyzer.start();
  await regulatoryTradingEngine.start('test-account', 10000); // $10,000 test account
  
  console.log('✅ REGULATORY MONITORING SYSTEM ACTIVE!');
  
  // Keep the process running
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get stats after running for a while
      const monitorStatus = regulatoryMonitor.getMonitoringStatus();
      const tradeStats = regulatoryTradingEngine.getTradeStats();
      
      console.log('📊 MONITOR STATUS:', JSON.stringify(monitorStatus, null, 2));
      console.log('📊 TRADE STATS:', JSON.stringify(tradeStats, null, 2));
      
      // Stop the system
      regulatoryMonitor.stopMonitoring();
      regulatoryAnalyzer.stop();
      regulatoryTradingEngine.stop();
      
      console.log('✅ TEST COMPLETED');
      resolve(true);
    }, 120000); // Run for 2 minutes
  });
}

// Run the test
testRegulatorySystem().catch(console.error);
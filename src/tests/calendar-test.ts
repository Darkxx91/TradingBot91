// ULTIMATE TRADING EMPIRE - REGULATORY CALENDAR SYSTEM TEST
// Test the regulatory calendar and earnings event trading system

import ExchangeManager from '../exchanges/exchange-manager';
import { 
  RegulatoryMonitor, 
  RegulatoryCalendarEngine,
  RegulatoryCalendarEvent,
  RegulatorySource,
  RegulatoryContentType,
  RegulatoryImpact
} from '../regulatory';
import { TradeSignal } from '../types/core';
import { CalendarTrade } from '../regulatory';
import { v4 as uuidv4 } from 'uuid';

async function testCalendarSystem() {
  console.log('🚀 TESTING REGULATORY CALENDAR SYSTEM...');
  
  // Initialize exchange manager
  const exchangeManager = new ExchangeManager();
  await exchangeManager.connectToAllExchanges();
  
  // Initialize regulatory components
  const regulatoryMonitor = new RegulatoryMonitor();
  const calendarEngine = new RegulatoryCalendarEngine(
    exchangeManager,
    regulatoryMonitor
  );
  
  // Set up event listeners
  regulatoryMonitor.on('calendarUpdate', (events: RegulatoryCalendarEvent[]) => {
    console.log(`📅 CALENDAR UPDATED: ${events.length} events`);
    events.forEach(event => {
      console.log(`📅 EVENT: ${event.title} - ${event.scheduledAt.toLocaleString()}`);
    });
  });
  
  calendarEngine.on('calendarTradeSignal', (signal: TradeSignal) => {
    console.log(`📊 CALENDAR TRADE SIGNAL: ${signal.side.toUpperCase()} ${signal.asset} @ ${signal.price?.toFixed(2) || 'market'}`);
    console.log(`💰 Quantity: ${signal.quantity.toFixed(2)}, Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
  });
  
  calendarEngine.on('preEventPosition', (trade: CalendarTrade) => {
    console.log(`✅ PRE-EVENT POSITION TAKEN: ${trade.preEventSignal.asset} @ ${trade.preEventPrice?.toFixed(2) || 'N/A'}`);
    console.log(`📅 Event: ${trade.calendarEvent.title} scheduled at ${trade.calendarEvent.scheduledAt.toLocaleString()}`);
  });
  
  calendarEngine.on('tradeCompleted', (trade: CalendarTrade) => {
    console.log(`✅ CALENDAR TRADE COMPLETED: ${trade.preEventSignal.asset}`);
    console.log(`📊 P&L: ${trade.pnl?.toFixed(2) || 'N/A'} (${trade.pnlPercentage?.toFixed(2) || 'N/A'}%)`);
    console.log(`📈 Pre-Event: ${trade.preEventPrice?.toFixed(2) || 'N/A'}, Post-Event: ${trade.postEventPrice?.toFixed(2) || 'N/A'}`);
  });
  
  // Start the system
  await regulatoryMonitor.startMonitoring();
  await calendarEngine.start('test-account', 10000); // $10,000 test account
  
  console.log('✅ REGULATORY CALENDAR SYSTEM ACTIVE!');
  
  // Simulate calendar events for testing
  simulateCalendarEvents(regulatoryMonitor);
  
  // Keep the process running
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get stats after running for a while
      const calendarStats = calendarEngine.getTradeStats();
      
      console.log('📊 CALENDAR STATS:', JSON.stringify(calendarStats, null, 2));
      
      // Stop the system
      regulatoryMonitor.stopMonitoring();
      calendarEngine.stop();
      
      console.log('✅ TEST COMPLETED');
      resolve(true);
    }, 120000); // Run for 2 minutes
  });
}

/**
 * Simulate calendar events for testing purposes
 */
function simulateCalendarEvents(regulatoryMonitor: RegulatoryMonitor) {
  setTimeout(() => {
    console.log('🔧 SIMULATING CALENDAR EVENTS...');
    
    // Create simulated events
    const events: RegulatoryCalendarEvent[] = [];
    
    // Add FOMC meeting in 5 minutes
    const fomcDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    events.push({
      id: uuidv4(),
      source: RegulatorySource.FED,
      title: 'FOMC Interest Rate Decision',
      description: 'Federal Open Market Committee announces interest rate decision and monetary policy statement',
      eventType: RegulatoryContentType.RATE_DECISION,
      scheduledAt: fomcDate,
      importance: 0.9, // Very important
      affectedAssets: ['BTC/USDT', 'ETH/USDT', 'XAU/USD', 'EUR/USD', 'USD/JPY'],
      expectedImpact: RegulatoryImpact.NEUTRAL, // Unknown until the announcement
      confidence: 1.0, // 100% confidence the event will happen
      url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add SEC meeting in 3 minutes
    const secDate = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
    
    events.push({
      id: uuidv4(),
      source: RegulatorySource.SEC,
      title: 'SEC Open Meeting on Crypto Asset Regulation',
      description: 'Securities and Exchange Commission open meeting to discuss proposed rules for cryptocurrency exchanges and assets',
      eventType: RegulatoryContentType.RULE_CHANGE,
      scheduledAt: secDate,
      importance: 0.8, // Important
      affectedAssets: ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT'],
      expectedImpact: RegulatoryImpact.NEGATIVE,
      confidence: 0.9, // 90% confidence
      url: 'https://www.sec.gov/news/upcoming-events',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Emit calendar update event
    regulatoryMonitor.emit('calendarUpdate', events);
    
  }, 10000); // Simulate after 10 seconds
}

// Run the test
testCalendarSystem().catch(console.error);
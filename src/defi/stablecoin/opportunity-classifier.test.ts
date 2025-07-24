// STABLECOIN DEPEG EXPLOITATION SYSTEM - OPPORTUNITY CLASSIFIER TESTS
// Revolutionary mathematical certainty profits with guaranteed mean reversion

import OpportunityClassifier, { OpportunityClassification, OpportunityClassifierConfig } from './opportunity-classifier';
import { DepegEvent, DepegSeverity, DepegDirection, ExchangePrice } from './types';

/**
 * Test the Opportunity Classifier
 */
async function testOpportunityClassifier() {
  console.log('🎯 TESTING OPPORTUNITY CLASSIFIER...');
  
  // Create configuration
  const config: Partial<OpportunityClassifierConfig> = {
    minProfitThreshold: 0.001, // 0.1%
    minLiquidity: 50000, // $50k for testing
    maxPositionSizePercentage: 0.15, // 15% of liquidity
    baseLeverage: {
      low: 8, // 8x leverage for low risk
      medium: 5, // 5x leverage for medium risk
      high: 3, // 3x leverage for high risk
      extreme: 2 // 2x leverage for extreme risk
    },
    scoringWeights: {
      profitPotential: 0.35, // 35% weight on profit
      liquidityScore: 0.25, // 25% weight on liquidity
      historicalSuccess: 0.2, // 20% weight on history
      reversionSpeed: 0.1, // 10% weight on speed
      marketConditions: 0.1 // 10% weight on market
    },
    useHistoricalData: false, // Disable for testing
    maxHistoricalDataAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  
  // Create opportunity classifier
  const classifier = new OpportunityClassifier(config);
  
  // Set up event listeners
  classifier.on('opportunityClassified', (classification: OpportunityClassification) => {
    console.log(`✅ CLASSIFIED: ${classification.depegEvent.stablecoin} - Score: ${classification.opportunityScore.toFixed(1)}, Risk: ${classification.riskLevel}, Priority: ${classification.priority}`);
    console.log(`💰 Expected profit: ${classification.expectedProfitPercentage.toFixed(4)}% ($${classification.expectedProfitUsd.toFixed(2)})`);
    console.log(`📊 Position: $${classification.recommendedPositionSize.toLocaleString()} @ ${classification.recommendedLeverage}x leverage`);
    console.log(`⏱️ Reversion time: ${Math.round(classification.estimatedReversionTimeMs / (60 * 1000))} minutes`);
    console.log(`🎯 Success probability: ${(classification.successProbability * 100).toFixed(1)}%`);
  });
  
  classifier.on('opportunitiesRanked', (classifications: OpportunityClassification[]) => {
    console.log(`🏆 RANKED ${classifications.length} OPPORTUNITIES:`);
    classifications.forEach((c, index) => {
      console.log(`${index + 1}. ${c.depegEvent.stablecoin} - Score: ${c.riskAdjustedScore.toFixed(1)} (${c.priority})`);
    });
  });
  
  // Create test depeg events
  const testEvents = createTestDepegEvents();
  
  console.log(`📊 Testing with ${testEvents.length} depeg events...`);
  
  // Test individual classification
  console.log('\\n🎯 TESTING INDIVIDUAL CLASSIFICATION...');
  const firstEvent = testEvents[0];\n  const classification = await classifier.classifyOpportunity(firstEvent);
  
  console.log('\\n📋 CLASSIFICATION DETAILS:');
  console.log(`Opportunity Score: ${classification.opportunityScore.toFixed(2)}`);
  console.log(`Risk-Adjusted Score: ${classification.riskAdjustedScore.toFixed(2)}`);
  console.log(`Expected Profit: ${classification.expectedProfitPercentage.toFixed(4)}% ($${classification.expectedProfitUsd.toFixed(2)})`);
  console.log(`Risk Level: ${classification.riskLevel}`);
  console.log(`Priority: ${classification.priority}`);
  console.log(`Recommended Position: $${classification.recommendedPositionSize.toLocaleString()}`);
  console.log(`Recommended Leverage: ${classification.recommendedLeverage}x`);
  console.log(`Success Probability: ${(classification.successProbability * 100).toFixed(1)}%`);
  console.log(`Confidence Level: ${(classification.confidenceLevel * 100).toFixed(1)}%`);
  
  // Test batch classification and ranking
  console.log('\\n🏆 TESTING BATCH CLASSIFICATION AND RANKING...');
  const rankedOpportunities = await classifier.classifyAndRankOpportunities(testEvents);
  
  console.log('\\n📊 TOP 3 OPPORTUNITIES:');
  rankedOpportunities.slice(0, 3).forEach((opp, index) => {
    console.log(`${index + 1}. ${opp.depegEvent.stablecoin}:`);
    console.log(`   Score: ${opp.riskAdjustedScore.toFixed(1)} | Risk: ${opp.riskLevel} | Priority: ${opp.priority}`);
    console.log(`   Profit: ${opp.expectedProfitPercentage.toFixed(4)}% ($${opp.expectedProfitUsd.toFixed(2)})`);
    console.log(`   Best Entry: ${opp.bestEntryExchanges[0]?.exchange} @ ${opp.bestEntryExchanges[0]?.price.toFixed(6)}`);
  });
  
  // Get classification statistics
  const stats = classifier.getClassificationStats();
  console.log('\\n📈 CLASSIFICATION STATISTICS:');
  console.log(`Total Classifications: ${stats.totalClassifications}`);
  console.log(`Average Opportunity Score: ${stats.averageOpportunityScore.toFixed(2)}`);
  console.log(`Successful Classifications: ${stats.successfulClassifications}`);
  console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
  
  console.log('\\n✅ OPPORTUNITY CLASSIFIER TEST COMPLETE');
  
  // REVOLUTIONARY INSIGHT: By classifying opportunities with mathematical precision,
  // we can focus our capital on the highest probability, highest return opportunities!
}

/**
 * Create test depeg events for classification
 * @returns Array of test depeg events
 */
function createTestDepegEvents(): DepegEvent[] {
  const events: DepegEvent[] = [];
  
  // Test Event 1: Minor USDT discount
  events.push({
    id: 'test-usdt-minor',
    stablecoin: 'USDT',
    exchanges: [
      { exchange: 'binance', price: 0.9992, volume24h: 50000000, liquidity: 2000000, timestamp: new Date() },
      { exchange: 'coinbase', price: 0.9994, volume24h: 30000000, liquidity: 1500000, timestamp: new Date() },
      { exchange: 'kraken', price: 0.9993, volume24h: 20000000, liquidity: 1000000, timestamp: new Date() }
    ],
    startTime: new Date(),
    magnitude: 0.0007, // 0.07%
    direction: 'discount' as DepegDirection,
    severity: DepegSeverity.MINOR,
    averagePrice: 0.9993,
    pegValue: 1.0,
    liquidityScore: 0.45,
    estimatedReversionTime: 30 * 60 * 1000, // 30 minutes
    status: 'active',
    profitPotential: 0.07,
    tradingVolume: 100000000,
    maxDeviation: 0.0008,
    reversionPattern: 'quick-snap-back',
    marketConditions: {
      overallVolatility: 0.3,
      marketDirection: 'sideways'
    }
  });
  
  // Test Event 2: Moderate USDC premium
  events.push({
    id: 'test-usdc-moderate',
    stablecoin: 'USDC',
    exchanges: [
      { exchange: 'binance', price: 1.0025, volume24h: 40000000, liquidity: 1800000, timestamp: new Date() },
      { exchange: 'coinbase', price: 1.0028, volume24h: 35000000, liquidity: 1600000, timestamp: new Date() },
      { exchange: 'huobi', price: 1.0026, volume24h: 25000000, liquidity: 1200000, timestamp: new Date() }
    ],
    startTime: new Date(),
    magnitude: 0.0026, // 0.26%
    direction: 'premium' as DepegDirection,
    severity: DepegSeverity.MODERATE,
    averagePrice: 1.0026,
    pegValue: 1.0,
    liquidityScore: 0.46,
    estimatedReversionTime: 2 * 60 * 60 * 1000, // 2 hours
    status: 'active',
    profitPotential: 0.26,
    tradingVolume: 100000000,
    maxDeviation: 0.003,
    reversionPattern: 'gradual-reversion',
    marketConditions: {
      overallVolatility: 0.5,
      marketDirection: 'bullish'
    }
  });
  
  // Test Event 3: Severe DAI discount
  events.push({
    id: 'test-dai-severe',
    stablecoin: 'DAI',
    exchanges: [
      { exchange: 'uniswap', price: 0.985, volume24h: 15000000, liquidity: 800000, timestamp: new Date() },
      { exchange: 'sushiswap', price: 0.987, volume24h: 12000000, liquidity: 600000, timestamp: new Date() },
      { exchange: 'balancer', price: 0.986, volume24h: 8000000, liquidity: 400000, timestamp: new Date() }
    ],
    startTime: new Date(),
    magnitude: 0.014, // 1.4%
    direction: 'discount' as DepegDirection,
    severity: DepegSeverity.SEVERE,
    averagePrice: 0.986,
    pegValue: 1.0,
    liquidityScore: 0.18,
    estimatedReversionTime: 12 * 60 * 60 * 1000, // 12 hours
    status: 'active',
    profitPotential: 1.4,
    tradingVolume: 35000000,
    maxDeviation: 0.015,
    reversionPattern: 'volatile-oscillation',
    marketConditions: {
      overallVolatility: 0.8,
      marketDirection: 'bearish'
    }
  });
  
  // Test Event 4: Extreme BUSD discount
  events.push({
    id: 'test-busd-extreme',
    stablecoin: 'BUSD',
    exchanges: [
      { exchange: 'binance', price: 0.92, volume24h: 8000000, liquidity: 500000, timestamp: new Date() },
      { exchange: 'pancakeswap', price: 0.925, volume24h: 5000000, liquidity: 300000, timestamp: new Date() }
    ],
    startTime: new Date(),
    magnitude: 0.075, // 7.5%
    direction: 'discount' as DepegDirection,
    severity: DepegSeverity.EXTREME,
    averagePrice: 0.9225,
    pegValue: 1.0,
    liquidityScore: 0.08,
    estimatedReversionTime: 48 * 60 * 60 * 1000, // 48 hours
    status: 'active',
    profitPotential: 7.5,
    tradingVolume: 13000000,
    maxDeviation: 0.08,
    reversionPattern: 'volatile-oscillation',
    marketConditions: {
      overallVolatility: 0.9,
      marketDirection: 'bearish'
    }
  });
  
  // Test Event 5: Minor USDT premium (high liquidity)
  events.push({
    id: 'test-usdt-premium-high-liq',
    stablecoin: 'USDT',
    exchanges: [
      { exchange: 'binance', price: 1.0008, volume24h: 80000000, liquidity: 5000000, timestamp: new Date() },
      { exchange: 'coinbase', price: 1.0006, volume24h: 60000000, liquidity: 4000000, timestamp: new Date() },
      { exchange: 'kraken', price: 1.0007, volume24h: 40000000, liquidity: 3000000, timestamp: new Date() },
      { exchange: 'huobi', price: 1.0009, volume24h: 35000000, liquidity: 2500000, timestamp: new Date() }
    ],
    startTime: new Date(),
    magnitude: 0.0007, // 0.07%
    direction: 'premium' as DepegDirection,
    severity: DepegSeverity.MINOR,
    averagePrice: 1.0007,
    pegValue: 1.0,
    liquidityScore: 1.0, // Maximum liquidity score
    estimatedReversionTime: 15 * 60 * 1000, // 15 minutes
    status: 'active',
    profitPotential: 0.07,
    tradingVolume: 215000000,
    maxDeviation: 0.001,
    reversionPattern: 'quick-snap-back',
    marketConditions: {
      overallVolatility: 0.2,
      marketDirection: 'bullish'
    }
  });
  
  return events;
}

// Run the test
testOpportunityClassifier().catch(error => {
  console.error('Error testing opportunity classifier:', error);
});
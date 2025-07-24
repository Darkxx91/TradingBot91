// STABLECOIN DEPEG EXPLOITATION SYSTEM - POSITION SIZING CALCULATOR TESTS
// Revolutionary mathematical certainty profits with guaranteed mean reversion

import PositionSizingCalculator, { 
  PositionSizingRecommendation, 
  PortfolioContext, 
  PositionSizingConfig 
} from './position-sizing-calculator';
import { OpportunityClassification } from './opportunity-classifier';
import { DepegEvent, DepegSeverity, DepegDirection } from './types';

/**
 * Test the Position Sizing Calculator
 */
async function testPositionSizingCalculator() {
  console.log('📊 TESTING POSITION SIZING CALCULATOR...');
  
  // Create configuration
  const config: Partial<PositionSizingConfig> = {
    defaultRiskPerTrade: 0.025, // 2.5% risk per trade
    maxRiskPerTrade: 0.05, // 5% maximum risk
    maxLeverage: 8, // 8x maximum leverage
    kellyFraction: 0.3, // 30% of Kelly optimal
    minPositionSize: 500, // $500 minimum
    maxPositionSize: 500000, // $500k maximum
    stopLossPercentage: 0.015, // 1.5% stop loss
    takeProfitPercentage: 0.04, // 4% take profit
    riskToleranceMultipliers: {
      conservative: 0.6,
      moderate: 1.0,
      aggressive: 1.4,
      extreme: 1.8
    },
    liquidityUtilization: 0.12, // Use 12% of liquidity
    correlationAdjustment: 0.85
  };
  
  // Create position sizing calculator
  const calculator = new PositionSizingCalculator(config);
  
  // Set up event listeners
  calculator.on('positionSized', (recommendation: PositionSizingRecommendation) => {
    console.log(`✅ POSITION SIZED: ${recommendation.opportunity.depegEvent.stablecoin}`);
    console.log(`💰 Size: $${recommendation.recommendedPositionSize.toLocaleString()} @ ${recommendation.recommendedLeverage}x leverage`);
    console.log(`📊 Risk: ${(recommendation.riskPercentage * 100).toFixed(2)}% | R/R: ${recommendation.riskRewardRatio.toFixed(2)}`);
    console.log(`🎯 Methodology: ${recommendation.sizingMethodology}`);
  });
  
  calculator.on('multiplePositionsSized', (recommendations: PositionSizingRecommendation[]) => {
    console.log(`📊 MULTIPLE POSITIONS SIZED: ${recommendations.length} opportunities`);
    const totalSize = recommendations.reduce((sum, rec) => sum + rec.recommendedPositionSize, 0);
    console.log(`💰 Total allocation: $${totalSize.toLocaleString()}`);
  });
  
  calculator.on('capitalAllocationOptimized', (recommendations: PositionSizingRecommendation[]) => {
    console.log(`🎯 CAPITAL ALLOCATION OPTIMIZED: ${recommendations.length} positions`);
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.opportunity.depegEvent.stablecoin}: $${rec.recommendedPositionSize.toLocaleString()}`);
    });
  });
  
  // Create test portfolio context
  const portfolioContext: PortfolioContext = {
    totalCapital: 100000, // $100k total capital
    allocatedCapital: 25000, // $25k already allocated
    availableCapital: 75000, // $75k available
    currentPortfolioValue: 105000, // $105k current value (5% gain)
    maxRiskPerTrade: 0.05, // 5% max risk per trade
    maxTotalRisk: 0.2, // 20% max total portfolio risk
    currentPortfolioRisk: 0.08, // 8% current risk
    activePositions: 3,
    maxPositions: 10,
    riskTolerance: 'moderate',
    targetReturn: 0.25 // 25% annual target
  };
  
  // Create test opportunities
  const testOpportunities = createTestOpportunities();
  
  console.log(`📊 Testing with ${testOpportunities.length} opportunities and $${portfolioContext.availableCapital.toLocaleString()} available capital...`);
  
  // Test individual position sizing
  console.log('\\n📊 TESTING INDIVIDUAL POSITION SIZING...');
  const firstOpportunity = testOpportunities[0];
  const sizing = await calculator.calculatePositionSize(firstOpportunity, portfolioContext);
  
  console.log('\\n📋 POSITION SIZING DETAILS:');
  console.log(`Recommended Size: $${sizing.recommendedPositionSize.toLocaleString()}`);
  console.log(`Recommended Leverage: ${sizing.recommendedLeverage}x`);
  console.log(`Total Exposure: $${sizing.totalExposure.toLocaleString()}`);
  console.log(`Risk Amount: $${sizing.riskAmount.toLocaleString()} (${(sizing.riskPercentage * 100).toFixed(2)}%)`);
  console.log(`Expected Return: $${sizing.expectedReturn.toLocaleString()} (${(sizing.expectedReturnPercentage * 100).toFixed(2)}%)`);
  console.log(`Risk-Reward Ratio: ${sizing.riskRewardRatio.toFixed(2)}`);
  console.log(`Stop Loss: ${sizing.stopLossPrice.toFixed(6)}`);
  console.log(`Take Profit: ${sizing.takeProfitPrice.toFixed(6)}`);
  console.log(`Position Confidence: ${sizing.positionConfidence.toFixed(1)}%`);
  console.log(`Sizing Methodology: ${sizing.sizingMethodology}`);
  
  if (sizing.riskWarnings.length > 0) {
    console.log('\\n⚠️ RISK WARNINGS:');
    sizing.riskWarnings.forEach(warning => console.log(`- ${warning}`));
  }
  
  console.log(`\\n📝 SIZING RATIONALE: ${sizing.sizingRationale}`);
  
  // Test multiple position sizing
  console.log('\\n📊 TESTING MULTIPLE POSITION SIZING...');
  const multipleSizings = await calculator.calculateMultiplePositionSizes(testOpportunities, portfolioContext);
  
  console.log('\\n📊 MULTIPLE POSITION RESULTS:');
  multipleSizings.forEach((sizing, index) => {
    console.log(`${index + 1}. ${sizing.opportunity.depegEvent.stablecoin}:`);
    console.log(`   Size: $${sizing.recommendedPositionSize.toLocaleString()} @ ${sizing.recommendedLeverage}x`);
    console.log(`   Risk: ${(sizing.riskPercentage * 100).toFixed(2)}% | Return: ${(sizing.expectedReturnPercentage * 100).toFixed(2)}% | R/R: ${sizing.riskRewardRatio.toFixed(2)}`);
  });
  
  // Test capital allocation optimization
  console.log('\\n🎯 TESTING CAPITAL ALLOCATION OPTIMIZATION...');
  const optimizedAllocations = await calculator.optimizeCapitalAllocation(testOpportunities, portfolioContext);
  
  console.log('\\n🏆 OPTIMIZED CAPITAL ALLOCATION:');
  let totalOptimizedSize = 0;
  let totalOptimizedRisk = 0;
  let totalExpectedReturn = 0;
  
  optimizedAllocations.forEach((allocation, index) => {
    console.log(`${index + 1}. ${allocation.opportunity.depegEvent.stablecoin}:`);
    console.log(`   Allocation: $${allocation.recommendedPositionSize.toLocaleString()} (${((allocation.recommendedPositionSize / portfolioContext.availableCapital) * 100).toFixed(1)}%)`);
    console.log(`   Leverage: ${allocation.recommendedLeverage}x | Exposure: $${allocation.totalExposure.toLocaleString()}`);
    console.log(`   Risk: $${allocation.riskAmount.toLocaleString()} (${(allocation.riskPercentage * 100).toFixed(2)}%)`);
    console.log(`   Expected Return: $${allocation.expectedReturn.toLocaleString()} (${(allocation.expectedReturnPercentage * 100).toFixed(2)}%)`);
    console.log(`   R/R Ratio: ${allocation.riskRewardRatio.toFixed(2)}`);
    
    totalOptimizedSize += allocation.recommendedPositionSize;
    totalOptimizedRisk += allocation.riskAmount;
    totalExpectedReturn += allocation.expectedReturn;
  });
  
  console.log('\\n📈 PORTFOLIO OPTIMIZATION SUMMARY:');
  console.log(`Total Allocated: $${totalOptimizedSize.toLocaleString()} (${((totalOptimizedSize / portfolioContext.availableCapital) * 100).toFixed(1)}% of available)`);
  console.log(`Total Risk: $${totalOptimizedRisk.toLocaleString()} (${((totalOptimizedRisk / portfolioContext.totalCapital) * 100).toFixed(2)}% of capital)`);
  console.log(`Total Expected Return: $${totalExpectedReturn.toLocaleString()} (${((totalExpectedReturn / totalOptimizedSize) * 100).toFixed(2)}% return on allocated)`);
  console.log(`Portfolio R/R Ratio: ${(totalExpectedReturn / totalOptimizedRisk).toFixed(2)}`);
  
  // Test different risk tolerance levels
  console.log('\\n🎚️ TESTING DIFFERENT RISK TOLERANCE LEVELS...');
  const riskTolerances: Array<PortfolioContext['riskTolerance']> = ['conservative', 'moderate', 'aggressive', 'extreme'];
  
  for (const riskTolerance of riskTolerances) {
    const testPortfolio = { ...portfolioContext, riskTolerance };
    const testSizing = await calculator.calculatePositionSize(testOpportunities[0], testPortfolio);
    
    console.log(`${riskTolerance.toUpperCase()}: $${testSizing.recommendedPositionSize.toLocaleString()} @ ${testSizing.recommendedLeverage}x (Risk: ${(testSizing.riskPercentage * 100).toFixed(2)}%)`);
  }
  
  // Get calculator statistics
  const stats = calculator.getSizingStats();
  console.log('\\n📈 POSITION SIZING STATISTICS:');
  console.log(`Total Sizings: ${stats.totalSizings}`);
  console.log(`Average Recommended Size: $${stats.averageRecommendedSize.toLocaleString()}`);
  console.log(`Successful Sizings: ${stats.successfulSizings}`);
  console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
  
  console.log('\\n✅ POSITION SIZING CALCULATOR TEST COMPLETE');
  
  // REVOLUTIONARY INSIGHT: By using multiple sizing methodologies and taking the most
  // conservative approach, we ensure optimal risk management while maximizing profit potential!
}

/**
 * Create test opportunities for position sizing
 * @returns Array of test opportunity classifications
 */
function createTestOpportunities(): OpportunityClassification[] {
  const opportunities: OpportunityClassification[] = [];
  
  // High-quality USDT opportunity
  opportunities.push({
    id: 'test-usdt-high-quality',
    depegEvent: {
      id: 'usdt-minor-discount',
      stablecoin: 'USDT',
      exchanges: [
        { exchange: 'binance', price: 0.9995, volume24h: 100000000, liquidity: 5000000, timestamp: new Date() },
        { exchange: 'coinbase', price: 0.9996, volume24h: 80000000, liquidity: 4000000, timestamp: new Date() }
      ],
      startTime: new Date(),
      magnitude: 0.0005,
      direction: 'discount' as DepegDirection,
      severity: DepegSeverity.MINOR,
      averagePrice: 0.9995,
      pegValue: 1.0,
      liquidityScore: 0.9,
      estimatedReversionTime: 20 * 60 * 1000,
      status: 'active',
      profitPotential: 0.05,
      tradingVolume: 180000000,
      maxDeviation: 0.0006,
      reversionPattern: 'quick-snap-back',
      marketConditions: {
        overallVolatility: 0.2,
        marketDirection: 'sideways'
      }
    },
    opportunityScore: 85,
    riskAdjustedScore: 82,
    expectedProfitPercentage: 0.0005,
    expectedProfitUsd: 2250,
    estimatedReversionTimeMs: 20 * 60 * 1000,
    successProbability: 0.95,
    confidenceLevel: 0.9,
    recommendedPositionSize: 0,
    recommendedLeverage: 0,
    optimalEntryPrice: 0.9995,
    optimalExitPrice: 0.999,
    riskLevel: 'low',
    priority: 'high',
    bestEntryExchanges: [
      { exchange: 'binance', price: 0.9995, liquidity: 5000000, score: 95 }
    ],
    bestExitExchanges: [
      { exchange: 'coinbase', price: 0.9996, liquidity: 4000000, score: 90 }
    ],
    historicalComparison: {
      similarEvents: 25,
      averageReversionTime: 18 * 60 * 1000,
      averageProfit: 0.0004,
      successRate: 0.96
    },
    marketContext: {
      volatilityFactor: 0.2,
      liquidityFactor: 0.9,
      volumeFactor: 0.8,
      correlationFactor: 0.7
    },
    classifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 40 * 60 * 1000)
  });
  
  // Medium-risk USDC opportunity
  opportunities.push({
    id: 'test-usdc-medium-risk',
    depegEvent: {
      id: 'usdc-moderate-premium',
      stablecoin: 'USDC',
      exchanges: [
        { exchange: 'coinbase', price: 1.003, volume24h: 60000000, liquidity: 2000000, timestamp: new Date() },
        { exchange: 'kraken', price: 1.0025, volume24h: 40000000, liquidity: 1500000, timestamp: new Date() }
      ],
      startTime: new Date(),
      magnitude: 0.0027,
      direction: 'premium' as DepegDirection,
      severity: DepegSeverity.MODERATE,
      averagePrice: 1.0027,
      pegValue: 1.0,
      liquidityScore: 0.35,
      estimatedReversionTime: 2 * 60 * 60 * 1000,
      status: 'active',
      profitPotential: 0.27,
      tradingVolume: 100000000,
      maxDeviation: 0.003,
      reversionPattern: 'gradual-reversion',
      marketConditions: {
        overallVolatility: 0.5,
        marketDirection: 'bullish'
      }
    },
    opportunityScore: 72,
    riskAdjustedScore: 68,
    expectedProfitPercentage: 0.0027,
    expectedProfitUsd: 945,
    estimatedReversionTimeMs: 2 * 60 * 60 * 1000,
    successProbability: 0.85,
    confidenceLevel: 0.7,
    recommendedPositionSize: 0,
    recommendedLeverage: 0,
    optimalEntryPrice: 1.003,
    optimalExitPrice: 1.001,
    riskLevel: 'medium',
    priority: 'medium',
    bestEntryExchanges: [
      { exchange: 'coinbase', price: 1.003, liquidity: 2000000, score: 85 }
    ],
    bestExitExchanges: [
      { exchange: 'kraken', price: 1.0025, liquidity: 1500000, score: 80 }
    ],
    historicalComparison: {
      similarEvents: 15,
      averageReversionTime: 90 * 60 * 1000,
      averageProfit: 0.0025,
      successRate: 0.87
    },
    marketContext: {
      volatilityFactor: 0.5,
      liquidityFactor: 0.35,
      volumeFactor: 0.6,
      correlationFactor: 0.8
    },
    classifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
  });
  
  // High-risk DAI opportunity
  opportunities.push({
    id: 'test-dai-high-risk',
    depegEvent: {
      id: 'dai-severe-discount',
      stablecoin: 'DAI',
      exchanges: [
        { exchange: 'uniswap', price: 0.988, volume24h: 20000000, liquidity: 800000, timestamp: new Date() },
        { exchange: 'sushiswap', price: 0.99, volume24h: 15000000, liquidity: 600000, timestamp: new Date() }
      ],
      startTime: new Date(),
      magnitude: 0.011,
      direction: 'discount' as DepegDirection,
      severity: DepegSeverity.SEVERE,
      averagePrice: 0.989,
      pegValue: 1.0,
      liquidityScore: 0.14,
      estimatedReversionTime: 8 * 60 * 60 * 1000,
      status: 'active',
      profitPotential: 1.1,
      tradingVolume: 35000000,
      maxDeviation: 0.012,
      reversionPattern: 'volatile-oscillation',
      marketConditions: {
        overallVolatility: 0.8,
        marketDirection: 'bearish'
      }
    },
    opportunityScore: 65,
    riskAdjustedScore: 52,
    expectedProfitPercentage: 0.011,
    expectedProfitUsd: 1540,
    estimatedReversionTimeMs: 8 * 60 * 60 * 1000,
    successProbability: 0.75,
    confidenceLevel: 0.6,
    recommendedPositionSize: 0,
    recommendedLeverage: 0,
    optimalEntryPrice: 0.988,
    optimalExitPrice: 0.999,
    riskLevel: 'high',
    priority: 'medium',
    bestEntryExchanges: [
      { exchange: 'uniswap', price: 0.988, liquidity: 800000, score: 75 }
    ],
    bestExitExchanges: [
      { exchange: 'sushiswap', price: 0.99, liquidity: 600000, score: 70 }
    ],
    historicalComparison: {
      similarEvents: 8,
      averageReversionTime: 6 * 60 * 60 * 1000,
      averageProfit: 0.009,
      successRate: 0.75
    },
    marketContext: {
      volatilityFactor: 0.8,
      liquidityFactor: 0.14,
      volumeFactor: 0.35,
      correlationFactor: 0.4
    },
    classifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000)
  });
  
  return opportunities;
}

// Run the test
testPositionSizingCalculator().catch(error => {
  console.error('Error testing position sizing calculator:', error);
});
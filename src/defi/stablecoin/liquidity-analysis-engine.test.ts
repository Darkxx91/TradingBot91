// STABLECOIN DEPEG EXPLOITATION SYSTEM - LIQUIDITY ANALYSIS ENGINE TESTS
// Revolutionary mathematical certainty profits with guaranteed mean reversion

import LiquidityAnalysisEngine, { 
  LiquidityScore, 
  SlippageAnalysis, 
  OptimalExecutionStrategy,
  OrderBook,
  LiquidityAnalysisConfig 
} from './liquidity-analysis-engine';
import { OpportunityClassification } from './opportunity-classifier';
import { DepegEvent, DepegSeverity, DepegDirection } from './types';

/**
 * Test the Liquidity Analysis Engine
 */
async function testLiquidityAnalysisEngine() {
  console.log('🌊 TESTING LIQUIDITY ANALYSIS ENGINE...');
  
  // Create configuration
  const config: Partial<LiquidityAnalysisConfig> = {
    minLiquidityThreshold: 50000, // $50k minimum for testing
    maxSlippagePercentage: 0.008, // 0.8% maximum slippage
    orderBookDepth: 15, // Analyze top 15 levels
    historicalLookback: 12 * 60 * 60 * 1000, // 12 hours
    updateFrequency: 3000, // 3 seconds
    slippageMethod: 'square-root',
    minSpreadThreshold: 0.00005, // 0.005%
    maxSpreadThreshold: 0.015, // 1.5%
    recoveryTimeWindow: 3 * 60 * 1000 // 3 minutes
  };
  
  // Create liquidity analysis engine
  const engine = new LiquidityAnalysisEngine(config);
  
  // Set up event listeners
  engine.on('liquidityAnalyzed', ({ depegEvent, liquidityScores }) => {
    console.log(`✅ LIQUIDITY ANALYZED: ${depegEvent.stablecoin} across ${liquidityScores.size} exchanges`);
    liquidityScores.forEach((score, exchange) => {
      console.log(`📊 ${exchange}: Score ${score.overallScore.toFixed(1)} (Depth: ${score.depthScore.toFixed(1)}, Spread: ${score.spreadScore.toFixed(1)})`);
    });
  });
  
  engine.on('slippageAnalyzed', (analysis: SlippageAnalysis) => {
    console.log(`📊 SLIPPAGE ANALYZED: ${analysis.direction} $${analysis.tradeSize.toLocaleString()}`);
    console.log(`💧 Slippage: ${(analysis.slippagePercentage * 100).toFixed(4)}%, Price Impact: ${(analysis.priceImpact * 100).toFixed(4)}%`);
  });
  
  engine.on('executionStrategyGenerated', (strategy: OptimalExecutionStrategy) => {
    console.log(`🎯 EXECUTION STRATEGY: ${strategy.executionMethod} with ${strategy.executionSteps.length} steps`);
    console.log(`📊 Expected slippage: ${(strategy.totalExpectedSlippage * 100).toFixed(4)}%, Time: ${(strategy.totalExecutionTime / 1000).toFixed(1)}s`);
  });
  
  engine.on('orderBookUpdated', ({ orderBook, liquidityScore }) => {
    console.log(`📈 ORDER BOOK UPDATED: ${orderBook.exchange}-${orderBook.pair} (Score: ${liquidityScore.overallScore.toFixed(1)})`);
  });
  
  // Create test depeg event
  const testDepegEvent = createTestDepegEvent();
  
  console.log(`📊 Testing with ${testDepegEvent.stablecoin} depeg event across ${testDepegEvent.exchanges.length} exchanges...`);
  
  // Test liquidity analysis
  console.log('\\n🌊 TESTING LIQUIDITY ANALYSIS...');
  const liquidityScores = await engine.analyzeExchangeLiquidity(testDepegEvent);
  
  console.log('\\n📊 LIQUIDITY ANALYSIS RESULTS:');
  liquidityScores.forEach((score, exchange) => {
    console.log(`\\n${exchange.toUpperCase()}:`);
    console.log(`  Overall Score: ${score.overallScore.toFixed(2)}`);
    console.log(`  Depth Score: ${score.depthScore.toFixed(2)} (Liquidity: $${score.breakdown.totalLiquidity.toLocaleString()})`);
    console.log(`  Spread Score: ${score.spreadScore.toFixed(2)} (Spread: ${(score.breakdown.averageSpread * 100).toFixed(4)}%)`);
    console.log(`  Volume Score: ${score.volumeScore.toFixed(2)} (Volume: $${score.breakdown.volume24h.toLocaleString()})`);
    console.log(`  Stability Score: ${score.stabilityScore.toFixed(2)}`);
    console.log(`  Recovery Score: ${score.recoveryScore.toFixed(2)} (Recovery: ${(score.breakdown.recoveryTime / 1000).toFixed(1)}s)`);
  });
  
  // Test slippage estimation
  console.log('\\n📊 TESTING SLIPPAGE ESTIMATION...');
  const testTradeSizes = [10000, 50000, 100000, 500000]; // $10k, $50k, $100k, $500k
  
  for (const tradeSize of testTradeSizes) {
    console.log(`\\n💧 SLIPPAGE ANALYSIS FOR $${tradeSize.toLocaleString()} TRADE:`);
    
    for (const exchange of testDepegEvent.exchanges) {
      const buySlippage = await engine.estimateSlippage(
        exchange.exchange,
        testDepegEvent.stablecoin,
        tradeSize,
        'buy'
      );
      
      const sellSlippage = await engine.estimateSlippage(
        exchange.exchange,
        testDepegEvent.stablecoin,
        tradeSize,
        'sell'
      );
      
      console.log(`  ${exchange.exchange}:`);
      console.log(`    Buy:  ${(buySlippage.slippagePercentage * 100).toFixed(4)}% slippage, ${(buySlippage.priceImpact * 100).toFixed(4)}% impact`);
      console.log(`    Sell: ${(sellSlippage.slippagePercentage * 100).toFixed(4)}% slippage, ${(sellSlippage.priceImpact * 100).toFixed(4)}% impact`);
    }
  }
  
  // Test liquidity trends
  console.log('\\n📈 TESTING LIQUIDITY TRENDS...');
  
  // Simulate some order book updates to create history
  for (let i = 0; i < 10; i++) {
    for (const exchange of testDepegEvent.exchanges) {
      const orderBook = createTestOrderBook(exchange.exchange, testDepegEvent.stablecoin);
      engine.updateOrderBook(orderBook);
    }
    
    // Wait a bit between updates
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Analyze trends
  for (const exchange of testDepegEvent.exchanges) {
    const trend = await engine.analyzeLiquidityTrends(exchange.exchange, testDepegEvent.stablecoin);
    
    console.log(`\\n📈 ${exchange.exchange.toUpperCase()} LIQUIDITY TREND:`);
    console.log(`  Direction: ${trend.direction} (Strength: ${(trend.strength * 100).toFixed(1)}%)`);
    console.log(`  Duration: ${(trend.duration / (60 * 1000)).toFixed(1)} minutes`);
    console.log(`  Predicted Liquidity: $${trend.predictedLiquidity.toLocaleString()}`);
    console.log(`  Confidence: ${(trend.confidence * 100).toFixed(1)}%`);
  }
  
  // Test optimal execution strategy
  console.log('\\n🎯 TESTING OPTIMAL EXECUTION STRATEGY...');
  const testOpportunity = createTestOpportunity(testDepegEvent);
  const executionSizes = [25000, 100000, 500000]; // $25k, $100k, $500k
  
  for (const executionSize of executionSizes) {
    console.log(`\\n🎯 EXECUTION STRATEGY FOR $${executionSize.toLocaleString()}:`);
    
    const strategy = await engine.generateOptimalExecutionStrategy(testOpportunity, executionSize);
    
    console.log(`  Method: ${strategy.executionMethod}`);
    console.log(`  Steps: ${strategy.executionSteps.length}`);
    console.log(`  Expected Slippage: ${(strategy.totalExpectedSlippage * 100).toFixed(4)}%`);
    console.log(`  Execution Time: ${(strategy.totalExecutionTime / 1000).toFixed(1)} seconds`);
    console.log(`  Confidence: ${(strategy.confidence * 100).toFixed(1)}%`);
    
    if (strategy.riskFactors.length > 0) {
      console.log(`  Risk Factors:`);
      strategy.riskFactors.forEach(factor => console.log(`    - ${factor}`));
    }
    
    console.log(`  Execution Steps:`);
    strategy.executionSteps.forEach(step => {
      console.log(`    ${step.step}. ${step.exchange}: $${step.size.toLocaleString()} @ ${step.price.toFixed(6)} (${(step.expectedSlippage * 100).toFixed(4)}% slippage)`);
    });
  }
  
  // Test different slippage methods
  console.log('\\n🧮 TESTING DIFFERENT SLIPPAGE METHODS...');
  const slippageMethods: Array<LiquidityAnalysisConfig['slippageMethod']> = ['linear', 'square-root', 'logarithmic'];
  
  for (const method of slippageMethods) {
    engine.updateConfig({ slippageMethod: method });
    
    const slippage = await engine.estimateSlippage(
      testDepegEvent.exchanges[0].exchange,
      testDepegEvent.stablecoin,
      100000, // $100k trade
      'buy'
    );
    
    console.log(`${method.toUpperCase()}: ${(slippage.slippagePercentage * 100).toFixed(4)}% slippage, ${(slippage.priceImpact * 100).toFixed(4)}% impact`);
  }
  
  // Get engine statistics
  const stats = engine.getAnalysisStats();
  console.log('\\n📈 LIQUIDITY ANALYSIS STATISTICS:');
  console.log(`Total Analyses: ${stats.totalAnalyses}`);
  console.log(`Successful Analyses: ${stats.successfulAnalyses}`);
  console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
  console.log(`Average Slippage: ${(stats.averageSlippage * 100).toFixed(4)}%`);
  console.log(`Tracked Order Books: ${stats.trackedOrderBooks}`);
  
  console.log('\\n✅ LIQUIDITY ANALYSIS ENGINE TEST COMPLETE');
  
  // REVOLUTIONARY INSIGHT: By analyzing liquidity with mathematical precision,
  // we can execute trades with minimal slippage and maximum profit capture!
}

/**
 * Create test depeg event
 * @returns Test depeg event
 */
function createTestDepegEvent(): DepegEvent {
  return {
    id: 'test-usdt-liquidity',
    stablecoin: 'USDT',
    exchanges: [
      { exchange: 'binance', price: 0.9994, volume24h: 150000000, liquidity: 8000000, timestamp: new Date() },
      { exchange: 'coinbase', price: 0.9996, volume24h: 120000000, liquidity: 6000000, timestamp: new Date() },
      { exchange: 'kraken', price: 0.9995, volume24h: 80000000, liquidity: 4000000, timestamp: new Date() },
      { exchange: 'huobi', price: 0.9993, volume24h: 60000000, liquidity: 3000000, timestamp: new Date() }
    ],
    startTime: new Date(),
    magnitude: 0.0005,
    direction: 'discount' as DepegDirection,
    severity: DepegSeverity.MINOR,
    averagePrice: 0.9995,
    pegValue: 1.0,
    liquidityScore: 0.8,
    estimatedReversionTime: 25 * 60 * 1000,
    status: 'active',
    profitPotential: 0.05,
    tradingVolume: 410000000,
    maxDeviation: 0.0007,
    reversionPattern: 'quick-snap-back',
    marketConditions: {
      overallVolatility: 0.25,
      marketDirection: 'sideways'
    }
  };
}

/**
 * Create test opportunity classification
 * @param depegEvent The depeg event
 * @returns Test opportunity classification
 */
function createTestOpportunity(depegEvent: DepegEvent): OpportunityClassification {
  return {
    id: 'test-opportunity-liquidity',
    depegEvent,
    opportunityScore: 88,
    riskAdjustedScore: 85,
    expectedProfitPercentage: 0.0005,
    expectedProfitUsd: 2500,
    estimatedReversionTimeMs: 25 * 60 * 1000,
    successProbability: 0.94,
    confidenceLevel: 0.88,
    recommendedPositionSize: 500000,
    recommendedLeverage: 6,
    optimalEntryPrice: 0.9994,
    optimalExitPrice: 0.999,
    riskLevel: 'low',
    priority: 'high',
    bestEntryExchanges: [
      { exchange: 'huobi', price: 0.9993, liquidity: 3000000, score: 92 },
      { exchange: 'binance', price: 0.9994, liquidity: 8000000, score: 90 }
    ],
    bestExitExchanges: [
      { exchange: 'coinbase', price: 0.9996, liquidity: 6000000, score: 88 },
      { exchange: 'kraken', price: 0.9995, liquidity: 4000000, score: 85 }
    ],
    historicalComparison: {
      similarEvents: 30,
      averageReversionTime: 22 * 60 * 1000,
      averageProfit: 0.0004,
      successRate: 0.95
    },
    marketContext: {
      volatilityFactor: 0.25,
      liquidityFactor: 0.8,
      volumeFactor: 0.85,
      correlationFactor: 0.75
    },
    classifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 50 * 60 * 1000)
  };
}

/**
 * Create test order book
 * @param exchange Exchange name
 * @param pair Trading pair
 * @returns Test order book
 */
function createTestOrderBook(exchange: string, pair: string): OrderBook {
  const basePrice = 1.0;
  const spread = 0.0001 + Math.random() * 0.0005; // 0.01-0.06% spread
  
  const bestBid = basePrice - (spread / 2);
  const bestAsk = basePrice + (spread / 2);
  
  // Generate realistic bid levels
  const bids = [];
  let cumulativeBidQty = 0;
  let cumulativeBidVal = 0;
  
  for (let i = 0; i < 15; i++) {
    const price = bestBid - (i * 0.0001);
    const quantity = 2000 + Math.random() * 8000; // $2k-$10k per level
    const value = quantity * price;
    
    cumulativeBidQty += quantity;
    cumulativeBidVal += value;
    
    bids.push({
      price,
      quantity,
      value,
      cumulativeQuantity: cumulativeBidQty,
      cumulativeValue: cumulativeBidVal
    });
  }
  
  // Generate realistic ask levels
  const asks = [];
  let cumulativeAskQty = 0;
  let cumulativeAskVal = 0;
  
  for (let i = 0; i < 15; i++) {
    const price = bestAsk + (i * 0.0001);
    const quantity = 2000 + Math.random() * 8000; // $2k-$10k per level
    const value = quantity * price;
    
    cumulativeAskQty += quantity;
    cumulativeAskVal += value;
    
    asks.push({
      price,
      quantity,
      value,
      cumulativeQuantity: cumulativeAskQty,
      cumulativeValue: cumulativeAskVal
    });
  }
  
  return {
    exchange,
    pair,
    bids,
    asks,
    bestBid,
    bestAsk,
    spread: bestAsk - bestBid,
    spreadPercentage: (bestAsk - bestBid) / basePrice,
    totalBidLiquidity: cumulativeBidVal,
    totalAskLiquidity: cumulativeAskVal,
    timestamp: new Date()
  };
}

// Run the test
testLiquidityAnalysisEngine().catch(error => {
  console.error('Error testing liquidity analysis engine:', error);
});
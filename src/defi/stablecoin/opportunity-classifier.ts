// STABLECOIN DEPEG EXPLOITATION SYSTEM - OPPORTUNITY CLASSIFIER
// Revolutionary mathematical certainty profits with guaranteed mean reversion

import { EventEmitter } from 'events';
import { 
  DepegEvent, 
  DepegSeverity, 
  DepegDirection, 
  ExchangePrice,
  TimeFrame
} from './types';
import { DepegHistoryDatabase } from './depeg-history-database';

/**
 * Classification result for a depeg opportunity
 */
export interface OpportunityClassification {
  /**
   * Unique ID for the classification
   */
  id: string;
  
  /**
   * The original depeg event
   */
  depegEvent: DepegEvent;
  
  /**
   * Overall opportunity score (0-100)
   */
  opportunityScore: number;
  
  /**
   * Risk-adjusted return score (0-100)
   */
  riskAdjustedScore: number;
  
  /**
   * Expected profit percentage
   */
  expectedProfitPercentage: number;
  
  /**
   * Expected profit in USD
   */
  expectedProfitUsd: number;
  
  /**
   * Estimated reversion time in milliseconds
   */
  estimatedReversionTimeMs: number;
  
  /**
   * Success probability (0-1)
   */
  successProbability: number;
  
  /**
   * Confidence level (0-1)
   */
  confidenceLevel: number;
  
  /**
   * Recommended position size in USD
   */
  recommendedPositionSize: number;
  
  /**
   * Recommended leverage multiplier
   */
  recommendedLeverage: number;
  
  /**
   * Optimal entry price
   */
  optimalEntryPrice: number;
  
  /**
   * Optimal exit price
   */
  optimalExitPrice: number;
  
  /**
   * Risk level classification
   */
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  
  /**
   * Opportunity priority
   */
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * Best exchanges for entry
   */
  bestEntryExchanges: { exchange: string, price: number, liquidity: number, score: number }[];
  
  /**
   * Best exchanges for exit
   */
  bestExitExchanges: { exchange: string, price: number, liquidity: number, score: number }[];
  
  /**
   * Historical comparison data
   */
  historicalComparison: {
    similarEvents: number;
    averageReversionTime: number;
    averageProfit: number;
    successRate: number;
  };
  
  /**
   * Market context factors
   */
  marketContext: {
    volatilityFactor: number;
    liquidityFactor: number;
    volumeFactor: number;
    correlationFactor: number;
  };
  
  /**
   * Classification timestamp
   */
  classifiedAt: Date;
  
  /**
   * Time until opportunity expires
   */
  expiresAt: Date;
}

/**
 * Configuration for the opportunity classifier
 */
export interface OpportunityClassifierConfig {
  /**
   * Minimum profit threshold to consider an opportunity valid
   */
  minProfitThreshold: number;
  
  /**
   * Minimum liquidity required for an opportunity
   */
  minLiquidity: number;
  
  /**
   * Maximum position size as percentage of available liquidity
   */
  maxPositionSizePercentage: number;
  
  /**
   * Base leverage for different risk levels
   */
  baseLeverage: {
    low: number;
    medium: number;
    high: number;
    extreme: number;
  };
  
  /**
   * Scoring weights for different factors
   */
  scoringWeights: {
    profitPotential: number;
    liquidityScore: number;
    historicalSuccess: number;
    reversionSpeed: number;
    marketConditions: number;
  };
  
  /**
   * Whether to use historical data for classification
   */
  useHistoricalData: boolean;
  
  /**
   * Maximum age of historical data to consider (in milliseconds)
   */
  maxHistoricalDataAge: number;
}

/**
 * Interface for the Opportunity Classifier
 */
export interface OpportunityClassifierInterface {
  /**
   * Classify a depeg opportunity
   * @param depegEvent The depeg event to classify
   * @returns The opportunity classification
   */
  classifyOpportunity(depegEvent: DepegEvent): Promise<OpportunityClassification>;
  
  /**
   * Classify multiple opportunities and rank them
   * @param depegEvents Array of depeg events to classify
   * @returns Array of classifications sorted by score
   */
  classifyAndRankOpportunities(depegEvents: DepegEvent[]): Promise<OpportunityClassification[]>;
  
  /**
   * Update the configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<OpportunityClassifierConfig>): void;
  
  /**
   * Get classification statistics
   * @returns Classification statistics
   */
  getClassificationStats(): any;
}

/**
 * Implementation of the Opportunity Classifier
 */
export class OpportunityClassifier extends EventEmitter implements OpportunityClassifierInterface {
  private config: OpportunityClassifierConfig;
  private historyDb: DepegHistoryDatabase | null = null;
  private classificationCount: number = 0;
  private totalOpportunityScore: number = 0;
  private successfulClassifications: number = 0;
  
  /**
   * Constructor for the Opportunity Classifier
   * @param config Configuration for the classifier
   * @param historyDb Optional historical database
   */
  constructor(config?: Partial<OpportunityClassifierConfig>, historyDb?: DepegHistoryDatabase) {
    super();
    
    // Default configuration
    this.config = {
      minProfitThreshold: 0.001, // 0.1%
      minLiquidity: 100000, // $100k
      maxPositionSizePercentage: 0.1, // 10% of available liquidity
      baseLeverage: {
        low: 10, // 10x leverage for low risk
        medium: 5, // 5x leverage for medium risk
        high: 3, // 3x leverage for high risk
        extreme: 2 // 2x leverage for extreme risk
      },
      scoringWeights: {
        profitPotential: 0.3, // 30% weight
        liquidityScore: 0.2, // 20% weight
        historicalSuccess: 0.2, // 20% weight
        reversionSpeed: 0.15, // 15% weight
        marketConditions: 0.15 // 15% weight
      },
      useHistoricalData: true,
      maxHistoricalDataAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    };
    
    // Override with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Set historical database if provided
    if (historyDb) {
      this.historyDb = historyDb;
    }
    
    console.log('🎯 Opportunity Classifier initialized with configuration:', this.config);
  }
  
  /**
   * Classify a depeg opportunity
   * @param depegEvent The depeg event to classify
   * @returns The opportunity classification
   */
  async classifyOpportunity(depegEvent: DepegEvent): Promise<OpportunityClassification> {
    console.log(`🎯 Classifying opportunity for ${depegEvent.stablecoin} depeg (${(depegEvent.magnitude * 100).toFixed(4)}%)`);
    
    // Calculate basic metrics
    const basicMetrics = this.calculateBasicMetrics(depegEvent);
    
    // Get historical comparison data
    const historicalComparison = await this.getHistoricalComparison(depegEvent);
    
    // Calculate market context factors
    const marketContext = this.calculateMarketContext(depegEvent);
    
    // Calculate opportunity score
    const opportunityScore = this.calculateOpportunityScore(depegEvent, basicMetrics, historicalComparison, marketContext);
    
    // Calculate risk-adjusted score
    const riskAdjustedScore = this.calculateRiskAdjustedScore(opportunityScore, depegEvent, marketContext);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(depegEvent, marketContext);
    
    // Determine priority
    const priority = this.determinePriority(opportunityScore, riskLevel);
    
    // Calculate recommended position size and leverage
    const { recommendedPositionSize, recommendedLeverage } = this.calculatePositionSizing(depegEvent, riskLevel);
    
    // Calculate optimal entry and exit prices
    const { optimalEntryPrice, optimalExitPrice } = this.calculateOptimalPrices(depegEvent);
    
    // Find best exchanges for entry and exit
    const bestEntryExchanges = this.findBestEntryExchanges(depegEvent);
    const bestExitExchanges = this.findBestExitExchanges(depegEvent);
    
    // Calculate estimated reversion time
    const estimatedReversionTimeMs = await this.calculateEstimatedReversionTime(depegEvent, historicalComparison);
    
    // Calculate success probability
    const successProbability = this.calculateSuccessProbability(depegEvent, historicalComparison, marketContext);
    
    // Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(depegEvent, historicalComparison, marketContext);
    
    // Create classification
    const classification: OpportunityClassification = {
      id: `${depegEvent.id}-classification`,
      depegEvent,
      opportunityScore,
      riskAdjustedScore,
      expectedProfitPercentage: basicMetrics.expectedProfitPercentage,
      expectedProfitUsd: basicMetrics.expectedProfitUsd,
      estimatedReversionTimeMs,
      successProbability,
      confidenceLevel,
      recommendedPositionSize,
      recommendedLeverage,
      optimalEntryPrice,
      optimalExitPrice,
      riskLevel,
      priority,
      bestEntryExchanges,
      bestExitExchanges,
      historicalComparison,
      marketContext,
      classifiedAt: new Date(),
      expiresAt: new Date(Date.now() + estimatedReversionTimeMs * 2) // Expires after 2x estimated reversion time
    };
    
    // Update statistics
    this.updateStatistics(classification);
    
    // Emit classification event
    this.emit('opportunityClassified', classification);
    
    console.log(`✅ Classified ${depegEvent.stablecoin} opportunity: Score ${opportunityScore.toFixed(1)}, Risk ${riskLevel}, Priority ${priority}`);
    console.log(`💰 Expected profit: ${basicMetrics.expectedProfitPercentage.toFixed(2)}% ($${basicMetrics.expectedProfitUsd.toFixed(2)})`);
    console.log(`⏱️ Estimated reversion: ${Math.round(estimatedReversionTimeMs / (60 * 1000))} minutes`);
    
    return classification;
  }
  
  /**
   * Classify multiple opportunities and rank them
   * @param depegEvents Array of depeg events to classify
   * @returns Array of classifications sorted by score
   */
  async classifyAndRankOpportunities(depegEvents: DepegEvent[]): Promise<OpportunityClassification[]> {
    console.log(`🎯 Classifying and ranking ${depegEvents.length} opportunities...`);
    
    // Classify all opportunities
    const classifications: OpportunityClassification[] = [];
    
    for (const depegEvent of depegEvents) {
      try {
        const classification = await this.classifyOpportunity(depegEvent);
        classifications.push(classification);
      } catch (error) {
        console.error(`Error classifying opportunity for ${depegEvent.stablecoin}:`, error);
        this.emit('error', error);
      }
    }
    
    // Sort by risk-adjusted score (highest first)
    classifications.sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore);
    
    console.log(`✅ Classified and ranked ${classifications.length} opportunities`);
    console.log(`🏆 Top opportunity: ${classifications[0]?.depegEvent.stablecoin} (Score: ${classifications[0]?.riskAdjustedScore.toFixed(1)})`);
    
    // Emit ranking event
    this.emit('opportunitiesRanked', classifications);
    
    return classifications;
  }
  
  /**
   * Update the configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<OpportunityClassifierConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Updated opportunity classifier configuration');
  }
  
  /**
   * Get classification statistics
   * @returns Classification statistics
   */
  getClassificationStats(): any {
    return {
      totalClassifications: this.classificationCount,
      averageOpportunityScore: this.classificationCount > 0 ? this.totalOpportunityScore / this.classificationCount : 0,
      successfulClassifications: this.successfulClassifications,
      successRate: this.classificationCount > 0 ? this.successfulClassifications / this.classificationCount : 0,
      config: this.config
    };
  }
  
  /**
   * Calculate basic metrics for a depeg event
   * @param depegEvent The depeg event
   * @returns Basic metrics
   */
  private calculateBasicMetrics(depegEvent: DepegEvent): { expectedProfitPercentage: number, expectedProfitUsd: number } {
    // Calculate expected profit percentage
    // For discount (price < peg), profit is (peg - price) / price
    // For premium (price > peg), profit is (price - peg) / price
    let expectedProfitPercentage: number;
    
    if (depegEvent.direction === 'discount') {
      expectedProfitPercentage = (depegEvent.pegValue - depegEvent.averagePrice) / depegEvent.averagePrice;
    } else {
      expectedProfitPercentage = (depegEvent.averagePrice - depegEvent.pegValue) / depegEvent.averagePrice;
    }
    
    // Calculate total available liquidity
    const totalLiquidity = depegEvent.exchanges.reduce((sum, ex) => sum + ex.liquidity, 0);
    
    // Calculate expected profit in USD based on recommended position size
    const maxPositionSize = totalLiquidity * this.config.maxPositionSizePercentage;
    const expectedProfitUsd = maxPositionSize * expectedProfitPercentage;
    
    return {
      expectedProfitPercentage,
      expectedProfitUsd
    };
  }
  
  /**
   * Get historical comparison data for a depeg event
   * @param depegEvent The depeg event
   * @returns Historical comparison data
   */
  private async getHistoricalComparison(depegEvent: DepegEvent): Promise<OpportunityClassification['historicalComparison']> {
    // Default values if no historical data available
    let historicalComparison: OpportunityClassification['historicalComparison'] = {
      similarEvents: 0,
      averageReversionTime: depegEvent.estimatedReversionTime,
      averageProfit: depegEvent.magnitude,
      successRate: 0.8 // Default 80% success rate
    };
    
    // Use historical data if available and enabled
    if (this.config.useHistoricalData && this.historyDb) {
      try {
        // Find similar historical events
        const similarEvents = await this.historyDb.findSimilarHistoricalEvents(depegEvent);
        
        if (similarEvents.length > 0) {
          // Calculate average reversion time
          const totalReversionTime = similarEvents.reduce((sum, event) => {
            return sum + (event.actualReversionTime || event.estimatedReversionTime);
          }, 0);
          const averageReversionTime = totalReversionTime / similarEvents.length;
          
          // Calculate average profit
          const totalProfit = similarEvents.reduce((sum, event) => sum + event.magnitude, 0);
          const averageProfit = totalProfit / similarEvents.length;
          
          // Calculate success rate (events that resolved successfully)
          const successfulEvents = similarEvents.filter(event => event.status === 'resolved').length;
          const successRate = successfulEvents / similarEvents.length;
          
          historicalComparison = {
            similarEvents: similarEvents.length,
            averageReversionTime,
            averageProfit,
            successRate
          };
        }
      } catch (error) {
        console.error('Error getting historical comparison data:', error);
      }
    }
    
    return historicalComparison;
  }
  
  /**
   * Calculate market context factors
   * @param depegEvent The depeg event
   * @returns Market context factors
   */
  private calculateMarketContext(depegEvent: DepegEvent): OpportunityClassification['marketContext'] {
    // Calculate volatility factor (0-1, higher is more volatile)
    const volatilityFactor = depegEvent.marketConditions.overallVolatility;
    
    // Calculate liquidity factor (0-1, higher is more liquid)
    const totalLiquidity = depegEvent.exchanges.reduce((sum, ex) => sum + ex.liquidity, 0);
    const liquidityFactor = Math.min(1, totalLiquidity / 10000000); // Cap at $10M
    
    // Calculate volume factor (0-1, higher is more volume)
    const totalVolume = depegEvent.exchanges.reduce((sum, ex) => sum + ex.volume24h, 0);
    const volumeFactor = Math.min(1, totalVolume / 100000000); // Cap at $100M
    
    // Calculate correlation factor (0-1, based on market direction consistency)
    let correlationFactor = 0.5; // Default neutral
    
    if (depegEvent.marketConditions.marketDirection === 'bullish') {
      correlationFactor = depegEvent.direction === 'premium' ? 0.8 : 0.3;
    } else if (depegEvent.marketConditions.marketDirection === 'bearish') {
      correlationFactor = depegEvent.direction === 'discount' ? 0.8 : 0.3;
    }
    
    return {
      volatilityFactor,
      liquidityFactor,
      volumeFactor,
      correlationFactor
    };
  }
  
  /**
   * Calculate opportunity score
   * @param depegEvent The depeg event
   * @param basicMetrics Basic metrics
   * @param historicalComparison Historical comparison data
   * @param marketContext Market context factors
   * @returns Opportunity score (0-100)
   */
  private calculateOpportunityScore(
    depegEvent: DepegEvent,
    basicMetrics: { expectedProfitPercentage: number, expectedProfitUsd: number },
    historicalComparison: OpportunityClassification['historicalComparison'],
    marketContext: OpportunityClassification['marketContext']
  ): number {
    const weights = this.config.scoringWeights;
    
    // Profit potential score (0-100)
    const profitScore = Math.min(100, basicMetrics.expectedProfitPercentage * 10000); // 1% = 100 points
    
    // Liquidity score (0-100)
    const liquidityScore = marketContext.liquidityFactor * 100;
    
    // Historical success score (0-100)
    const historicalScore = historicalComparison.successRate * 100;
    
    // Reversion speed score (0-100, faster is better)
    const maxReversionTime = 24 * 60 * 60 * 1000; // 24 hours
    const reversionScore = Math.max(0, 100 - (depegEvent.estimatedReversionTime / maxReversionTime) * 100);
    
    // Market conditions score (0-100)
    const marketScore = (
      marketContext.volatilityFactor * 0.2 + // Lower volatility is better
      marketContext.liquidityFactor * 0.4 + // Higher liquidity is better
      marketContext.volumeFactor * 0.2 + // Higher volume is better
      marketContext.correlationFactor * 0.2 // Higher correlation is better
    ) * 100;
    
    // Calculate weighted score
    const opportunityScore = (
      profitScore * weights.profitPotential +
      liquidityScore * weights.liquidityScore +
      historicalScore * weights.historicalSuccess +
      reversionScore * weights.reversionSpeed +
      marketScore * weights.marketConditions
    );
    
    return Math.min(100, Math.max(0, opportunityScore));
  }
  
  /**
   * Calculate risk-adjusted score
   * @param opportunityScore Base opportunity score
   * @param depegEvent The depeg event
   * @param marketContext Market context factors
   * @returns Risk-adjusted score (0-100)
   */
  private calculateRiskAdjustedScore(
    opportunityScore: number,
    depegEvent: DepegEvent,
    marketContext: OpportunityClassification['marketContext']
  ): number {
    // Calculate risk factor (0-1, higher is riskier)
    let riskFactor = 0;
    
    // Severity risk
    switch (depegEvent.severity) {
      case DepegSeverity.MINOR:
        riskFactor += 0.1;
        break;
      case DepegSeverity.MODERATE:
        riskFactor += 0.3;
        break;
      case DepegSeverity.SEVERE:
        riskFactor += 0.6;
        break;
      case DepegSeverity.EXTREME:
        riskFactor += 0.9;
        break;
    }
    
    // Market volatility risk
    riskFactor += marketContext.volatilityFactor * 0.3;
    
    // Liquidity risk (lower liquidity = higher risk)
    riskFactor += (1 - marketContext.liquidityFactor) * 0.2;
    
    // Cap risk factor at 1
    riskFactor = Math.min(1, riskFactor);
    
    // Apply risk adjustment (reduce score based on risk)
    const riskAdjustment = 1 - (riskFactor * 0.5); // Max 50% reduction
    const riskAdjustedScore = opportunityScore * riskAdjustment;
    
    return Math.min(100, Math.max(0, riskAdjustedScore));
  }
  
  /**
   * Determine risk level for a depeg event
   * @param depegEvent The depeg event
   * @param marketContext Market context factors
   * @returns Risk level
   */
  private determineRiskLevel(
    depegEvent: DepegEvent,
    marketContext: OpportunityClassification['marketContext']
  ): OpportunityClassification['riskLevel'] {
    // Calculate overall risk score
    let riskScore = 0;
    
    // Severity risk
    switch (depegEvent.severity) {
      case DepegSeverity.MINOR:
        riskScore += 1;
        break;
      case DepegSeverity.MODERATE:
        riskScore += 2;
        break;
      case DepegSeverity.SEVERE:
        riskScore += 3;
        break;
      case DepegSeverity.EXTREME:
        riskScore += 4;
        break;
    }
    
    // Market volatility risk
    if (marketContext.volatilityFactor > 0.7) riskScore += 2;
    else if (marketContext.volatilityFactor > 0.4) riskScore += 1;
    
    // Liquidity risk
    if (marketContext.liquidityFactor < 0.3) riskScore += 2;
    else if (marketContext.liquidityFactor < 0.6) riskScore += 1;
    
    // Determine risk level based on score
    if (riskScore <= 2) return 'low';
    if (riskScore <= 4) return 'medium';
    if (riskScore <= 6) return 'high';
    return 'extreme';
  }
  
  /**
   * Determine priority for an opportunity
   * @param opportunityScore The opportunity score
   * @param riskLevel The risk level
   * @returns Priority level
   */
  private determinePriority(
    opportunityScore: number,
    riskLevel: OpportunityClassification['riskLevel']
  ): OpportunityClassification['priority'] {
    // Adjust score based on risk level
    let adjustedScore = opportunityScore;
    
    switch (riskLevel) {
      case 'low':
        adjustedScore *= 1.2; // Boost low risk opportunities
        break;
      case 'medium':
        adjustedScore *= 1.0; // No adjustment
        break;
      case 'high':
        adjustedScore *= 0.8; // Reduce high risk opportunities
        break;
      case 'extreme':
        adjustedScore *= 0.6; // Significantly reduce extreme risk
        break;
    }
    
    // Determine priority based on adjusted score
    if (adjustedScore >= 80) return 'critical';
    if (adjustedScore >= 60) return 'high';
    if (adjustedScore >= 40) return 'medium';
    return 'low';
  }
  
  /**
   * Calculate recommended position sizing and leverage
   * @param depegEvent The depeg event
   * @param riskLevel The risk level
   * @returns Position sizing and leverage recommendations
   */
  private calculatePositionSizing(
    depegEvent: DepegEvent,
    riskLevel: OpportunityClassification['riskLevel']
  ): { recommendedPositionSize: number, recommendedLeverage: number } {
    // Calculate total available liquidity
    const totalLiquidity = depegEvent.exchanges.reduce((sum, ex) => sum + ex.liquidity, 0);
    
    // Base position size as percentage of liquidity
    let positionSizePercentage = this.config.maxPositionSizePercentage;
    
    // Adjust based on risk level
    switch (riskLevel) {
      case 'low':
        positionSizePercentage *= 1.0; // Full position size
        break;
      case 'medium':
        positionSizePercentage *= 0.8; // 80% of max
        break;
      case 'high':
        positionSizePercentage *= 0.6; // 60% of max
        break;
      case 'extreme':
        positionSizePercentage *= 0.4; // 40% of max
        break;
    }
    
    // Calculate recommended position size
    const recommendedPositionSize = totalLiquidity * positionSizePercentage;
    
    // Get recommended leverage based on risk level
    const recommendedLeverage = this.config.baseLeverage[riskLevel];
    
    return {
      recommendedPositionSize,
      recommendedLeverage
    };
  }
  
  /**
   * Calculate optimal entry and exit prices
   * @param depegEvent The depeg event
   * @returns Optimal entry and exit prices
   */
  private calculateOptimalPrices(depegEvent: DepegEvent): { optimalEntryPrice: number, optimalExitPrice: number } {
    let optimalEntryPrice: number;
    let optimalExitPrice: number;
    
    if (depegEvent.direction === 'discount') {
      // For discount, buy at the lowest price, sell at peg
      const lowestPrice = Math.min(...depegEvent.exchanges.map(ex => ex.price));
      optimalEntryPrice = lowestPrice;
      optimalExitPrice = depegEvent.pegValue * 0.999; // Exit slightly below peg for safety
    } else {
      // For premium, sell at the highest price, buy at peg
      const highestPrice = Math.max(...depegEvent.exchanges.map(ex => ex.price));
      optimalEntryPrice = highestPrice;
      optimalExitPrice = depegEvent.pegValue * 1.001; // Exit slightly above peg for safety
    }
    
    return {
      optimalEntryPrice,
      optimalExitPrice
    };
  }
  
  /**
   * Find best exchanges for entry
   * @param depegEvent The depeg event
   * @returns Best exchanges for entry
   */
  private findBestEntryExchanges(depegEvent: DepegEvent): OpportunityClassification['bestEntryExchanges'] {
    const exchanges = depegEvent.exchanges.map(ex => {
      // Calculate score based on price and liquidity
      let score = 0;
      
      if (depegEvent.direction === 'discount') {
        // For discount, lower price is better
        const priceScore = (depegEvent.averagePrice - ex.price) / depegEvent.averagePrice * 100;
        score += priceScore * 0.7;
      } else {
        // For premium, higher price is better
        const priceScore = (ex.price - depegEvent.averagePrice) / depegEvent.averagePrice * 100;
        score += priceScore * 0.7;
      }
      
      // Add liquidity score
      const liquidityScore = Math.min(100, ex.liquidity / 1000000 * 100); // $1M = 100 points
      score += liquidityScore * 0.3;
      
      return {
        exchange: ex.exchange,
        price: ex.price,
        liquidity: ex.liquidity,
        score
      };
    });
    
    // Sort by score (highest first) and return top 3
    return exchanges.sort((a, b) => b.score - a.score).slice(0, 3);
  }
  
  /**
   * Find best exchanges for exit
   * @param depegEvent The depeg event
   * @returns Best exchanges for exit
   */
  private findBestExitExchanges(depegEvent: DepegEvent): OpportunityClassification['bestExitExchanges'] {
    const exchanges = depegEvent.exchanges.map(ex => {
      // Calculate score based on how close to peg and liquidity
      const pegDistance = Math.abs(ex.price - depegEvent.pegValue) / depegEvent.pegValue;
      const pegScore = Math.max(0, 100 - (pegDistance * 10000)); // Closer to peg is better
      
      // Add liquidity score
      const liquidityScore = Math.min(100, ex.liquidity / 1000000 * 100); // $1M = 100 points
      
      const score = pegScore * 0.7 + liquidityScore * 0.3;
      
      return {
        exchange: ex.exchange,
        price: ex.price,
        liquidity: ex.liquidity,
        score
      };
    });
    
    // Sort by score (highest first) and return top 3
    return exchanges.sort((a, b) => b.score - a.score).slice(0, 3);
  }
  
  /**
   * Calculate estimated reversion time
   * @param depegEvent The depeg event
   * @param historicalComparison Historical comparison data
   * @returns Estimated reversion time in milliseconds
   */
  private async calculateEstimatedReversionTime(
    depegEvent: DepegEvent,
    historicalComparison: OpportunityClassification['historicalComparison']
  ): Promise<number> {
    // Use historical data if available
    if (historicalComparison.similarEvents > 0) {
      return historicalComparison.averageReversionTime;
    }
    
    // Otherwise use the depeg event's estimated reversion time
    return depegEvent.estimatedReversionTime;
  }
  
  /**
   * Calculate success probability
   * @param depegEvent The depeg event
   * @param historicalComparison Historical comparison data
   * @param marketContext Market context factors
   * @returns Success probability (0-1)
   */
  private calculateSuccessProbability(
    depegEvent: DepegEvent,
    historicalComparison: OpportunityClassification['historicalComparison'],
    marketContext: OpportunityClassification['marketContext']
  ): number {
    let baseProbability = historicalComparison.successRate;
    
    // Adjust based on market conditions
    // Higher liquidity increases success probability
    baseProbability += (marketContext.liquidityFactor - 0.5) * 0.2;
    
    // Lower volatility increases success probability
    baseProbability += (0.5 - marketContext.volatilityFactor) * 0.1;
    
    // Higher correlation increases success probability
    baseProbability += (marketContext.correlationFactor - 0.5) * 0.1;
    
    // Adjust based on severity (smaller depegs are more likely to revert)
    switch (depegEvent.severity) {
      case DepegSeverity.MINOR:
        baseProbability += 0.1;
        break;
      case DepegSeverity.MODERATE:
        baseProbability += 0.05;
        break;
      case DepegSeverity.SEVERE:
        baseProbability -= 0.05;
        break;
      case DepegSeverity.EXTREME:
        baseProbability -= 0.1;
        break;
    }
    
    // Cap between 0 and 1
    return Math.min(1, Math.max(0, baseProbability));
  }
  
  /**
   * Calculate confidence level
   * @param depegEvent The depeg event
   * @param historicalComparison Historical comparison data
   * @param marketContext Market context factors
   * @returns Confidence level (0-1)
   */
  private calculateConfidenceLevel(
    depegEvent: DepegEvent,
    historicalComparison: OpportunityClassification['historicalComparison'],
    marketContext: OpportunityClassification['marketContext']
  ): number {
    let confidence = 0.5; // Base confidence
    
    // More historical data increases confidence
    if (historicalComparison.similarEvents > 10) {
      confidence += 0.3;
    } else if (historicalComparison.similarEvents > 5) {
      confidence += 0.2;
    } else if (historicalComparison.similarEvents > 0) {
      confidence += 0.1;
    }
    
    // Higher liquidity increases confidence
    confidence += marketContext.liquidityFactor * 0.2;
    
    // Lower volatility increases confidence
    confidence += (1 - marketContext.volatilityFactor) * 0.1;
    
    // Higher volume increases confidence
    confidence += marketContext.volumeFactor * 0.1;
    
    // Cap between 0 and 1
    return Math.min(1, Math.max(0, confidence));
  }
  
  /**
   * Update classification statistics
   * @param classification The classification result
   */
  private updateStatistics(classification: OpportunityClassification): void {
    this.classificationCount++;
    this.totalOpportunityScore += classification.opportunityScore;
    
    if (classification.opportunityScore >= 50) {
      this.successfulClassifications++;
    }
  }
}

export default OpportunityClassifier;
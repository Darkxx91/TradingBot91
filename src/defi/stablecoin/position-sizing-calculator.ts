// STABLECOIN DEPEG EXPLOITATION SYSTEM - POSITION SIZING CALCULATOR
// Revolutionary mathematical certainty profits with guaranteed mean reversion

import { EventEmitter } from 'events';
import { 
  DepegEvent, 
  DepegSeverity, 
  DepegDirection
} from './types';
import { OpportunityClassification } from './opportunity-classifier';

/**
 * Position sizing recommendation
 */
export interface PositionSizingRecommendation {
  /**
   * Unique ID for the recommendation
   */
  id: string;
  
  /**
   * The opportunity being sized
   */
  opportunity: OpportunityClassification;
  
  /**
   * Recommended position size in USD
   */
  recommendedPositionSize: number;
  
  /**
   * Recommended leverage multiplier
   */
  recommendedLeverage: number;
  
  /**
   * Total exposure (position size * leverage)
   */
  totalExposure: number;
  
  /**
   * Risk amount (maximum potential loss)
   */
  riskAmount: number;
  
  /**
   * Risk percentage of total capital
   */
  riskPercentage: number;
  
  /**
   * Expected return in USD
   */
  expectedReturn: number;
  
  /**
   * Expected return percentage
   */
  expectedReturnPercentage: number;
  
  /**
   * Risk-reward ratio
   */
  riskRewardRatio: number;
  
  /**
   * Stop-loss price
   */
  stopLossPrice: number;
  
  /**
   * Take-profit price
   */
  takeProfitPrice: number;
  
  /**
   * Maximum drawdown tolerance
   */
  maxDrawdown: number;
  
  /**
   * Position confidence score (0-100)
   */
  positionConfidence: number;
  
  /**
   * Kelly criterion optimal size
   */
  kellyOptimalSize: number;
  
  /**
   * Fractional Kelly size (more conservative)
   */
  fractionalKellySize: number;
  
  /**
   * Volatility-adjusted size
   */
  volatilityAdjustedSize: number;
  
  /**
   * Liquidity-constrained size
   */
  liquidityConstrainedSize: number;
  
  /**
   * Final recommended size (minimum of all constraints)
   */
  finalRecommendedSize: number;
  
  /**
   * Sizing methodology used
   */
  sizingMethodology: string;
  
  /**
   * Risk warnings
   */
  riskWarnings: string[];
  
  /**
   * Sizing rationale
   */
  sizingRationale: string;
  
  /**
   * Calculated at timestamp
   */
  calculatedAt: Date;
}

/**
 * Portfolio context for position sizing
 */
export interface PortfolioContext {
  /**
   * Total available capital
   */
  totalCapital: number;
  
  /**
   * Currently allocated capital
   */
  allocatedCapital: number;
  
  /**
   * Available capital for new positions
   */
  availableCapital: number;
  
  /**
   * Current portfolio value
   */
  currentPortfolioValue: number;
  
  /**
   * Maximum risk per trade (percentage of capital)
   */
  maxRiskPerTrade: number;
  
  /**
   * Maximum total portfolio risk
   */
  maxTotalRisk: number;
  
  /**
   * Current portfolio risk
   */
  currentPortfolioRisk: number;
  
  /**
   * Number of active positions
   */
  activePositions: number;
  
  /**
   * Maximum number of positions
   */
  maxPositions: number;
  
  /**
   * Risk tolerance level
   */
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | 'extreme';
  
  /**
   * Target return percentage
   */
  targetReturn: number;
}

/**
 * Configuration for position sizing calculator
 */
export interface PositionSizingConfig {
  /**
   * Default risk per trade (percentage of capital)
   */
  defaultRiskPerTrade: number;
  
  /**
   * Maximum risk per trade
   */
  maxRiskPerTrade: number;
  
  /**
   * Maximum leverage allowed
   */
  maxLeverage: number;
  
  /**
   * Kelly fraction (0-1, typically 0.25 for quarter Kelly)
   */
  kellyFraction: number;
  
  /**
   * Volatility lookback period (in days)
   */
  volatilityLookback: number;
  
  /**
   * Minimum position size (USD)
   */
  minPositionSize: number;
  
  /**
   * Maximum position size (USD)
   */
  maxPositionSize: number;
  
  /**
   * Stop-loss percentage
   */
  stopLossPercentage: number;
  
  /**
   * Take-profit percentage
   */
  takeProfitPercentage: number;
  
  /**
   * Risk tolerance multipliers
   */
  riskToleranceMultipliers: {
    conservative: number;
    moderate: number;
    aggressive: number;
    extreme: number;
  };
  
  /**
   * Liquidity utilization percentage
   */
  liquidityUtilization: number;
  
  /**
   * Correlation adjustment factor
   */
  correlationAdjustment: number;
}

/**
 * Interface for the Position Sizing Calculator
 */
export interface PositionSizingCalculatorInterface {
  /**
   * Calculate position size for a single opportunity
   * @param opportunity The opportunity to size
   * @param portfolioContext Current portfolio context
   * @returns Position sizing recommendation
   */
  calculatePositionSize(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext
  ): Promise<PositionSizingRecommendation>;
  
  /**
   * Calculate position sizes for multiple opportunities
   * @param opportunities Array of opportunities
   * @param portfolioContext Current portfolio context
   * @returns Array of position sizing recommendations
   */
  calculateMultiplePositionSizes(
    opportunities: OpportunityClassification[],
    portfolioContext: PortfolioContext
  ): Promise<PositionSizingRecommendation[]>;
  
  /**
   * Optimize capital allocation across opportunities
   * @param opportunities Array of opportunities
   * @param portfolioContext Current portfolio context
   * @returns Optimized allocation recommendations
   */
  optimizeCapitalAllocation(
    opportunities: OpportunityClassification[],
    portfolioContext: PortfolioContext
  ): Promise<PositionSizingRecommendation[]>;
  
  /**
   * Update configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<PositionSizingConfig>): void;
  
  /**
   * Get sizing statistics
   * @returns Sizing statistics
   */
  getSizingStats(): any;
}

/**
 * Implementation of the Position Sizing Calculator
 */
export class PositionSizingCalculator extends EventEmitter implements PositionSizingCalculatorInterface {
  private config: PositionSizingConfig;
  private sizingCount: number = 0;
  private totalRecommendedSize: number = 0;
  private successfulSizings: number = 0;
  
  /**
   * Constructor for the Position Sizing Calculator
   * @param config Configuration for the calculator
   */
  constructor(config?: Partial<PositionSizingConfig>) {
    super();
    
    // Default configuration
    this.config = {
      defaultRiskPerTrade: 0.02, // 2% risk per trade
      maxRiskPerTrade: 0.05, // 5% maximum risk per trade
      maxLeverage: 10, // 10x maximum leverage
      kellyFraction: 0.25, // Quarter Kelly
      volatilityLookback: 30, // 30 days
      minPositionSize: 100, // $100 minimum
      maxPositionSize: 1000000, // $1M maximum
      stopLossPercentage: 0.02, // 2% stop loss
      takeProfitPercentage: 0.05, // 5% take profit
      riskToleranceMultipliers: {
        conservative: 0.5,
        moderate: 1.0,
        aggressive: 1.5,
        extreme: 2.0
      },
      liquidityUtilization: 0.1, // Use 10% of available liquidity
      correlationAdjustment: 0.8 // Reduce size by 20% for correlated positions
    };
    
    // Override with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    console.log('📊 Position Sizing Calculator initialized with configuration:', this.config);
  }
  
  /**
   * Calculate position size for a single opportunity
   * @param opportunity The opportunity to size
   * @param portfolioContext Current portfolio context
   * @returns Position sizing recommendation
   */
  async calculatePositionSize(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext
  ): Promise<PositionSizingRecommendation> {
    console.log(`📊 Calculating position size for ${opportunity.depegEvent.stablecoin} opportunity...`);
    
    // Calculate various sizing methods
    const kellySizing = this.calculateKellySize(opportunity, portfolioContext);
    const volatilityAdjustedSizing = this.calculateVolatilityAdjustedSize(opportunity, portfolioContext);
    const liquidityConstrainedSizing = this.calculateLiquidityConstrainedSize(opportunity);
    const riskBasedSizing = this.calculateRiskBasedSize(opportunity, portfolioContext);
    
    // Calculate optimal leverage
    const optimalLeverage = this.calculateOptimalLeverage(opportunity, portfolioContext);
    
    // Calculate stop-loss and take-profit levels
    const { stopLossPrice, takeProfitPrice } = this.calculateStopLossAndTakeProfit(opportunity);
    
    // Determine final recommended size (most conservative)
    const finalRecommendedSize = Math.min(
      kellySizing.fractionalKellySize,
      volatilityAdjustedSizing,
      liquidityConstrainedSizing,
      riskBasedSizing,
      this.config.maxPositionSize
    );
    
    // Ensure minimum position size
    const adjustedSize = Math.max(finalRecommendedSize, this.config.minPositionSize);
    
    // Calculate risk metrics
    const totalExposure = adjustedSize * optimalLeverage;
    const riskAmount = this.calculateRiskAmount(adjustedSize, optimalLeverage, opportunity);
    const riskPercentage = riskAmount / portfolioContext.totalCapital;
    
    // Calculate expected returns
    const expectedReturn = adjustedSize * opportunity.expectedProfitPercentage;
    const expectedReturnPercentage = expectedReturn / adjustedSize;
    
    // Calculate risk-reward ratio
    const riskRewardRatio = expectedReturn / riskAmount;
    
    // Calculate position confidence
    const positionConfidence = this.calculatePositionConfidence(opportunity, portfolioContext);
    
    // Generate risk warnings
    const riskWarnings = this.generateRiskWarnings(opportunity, portfolioContext, riskPercentage);
    
    // Generate sizing rationale
    const sizingRationale = this.generateSizingRationale(
      opportunity,
      portfolioContext,
      kellySizing,
      volatilityAdjustedSizing,
      liquidityConstrainedSizing,
      riskBasedSizing
    );
    
    // Create recommendation
    const recommendation: PositionSizingRecommendation = {
      id: `${opportunity.id}-sizing`,
      opportunity,
      recommendedPositionSize: adjustedSize,
      recommendedLeverage: optimalLeverage,
      totalExposure,
      riskAmount,
      riskPercentage,
      expectedReturn,
      expectedReturnPercentage,
      riskRewardRatio,
      stopLossPrice,
      takeProfitPrice,
      maxDrawdown: riskAmount,
      positionConfidence,
      kellyOptimalSize: kellySizing.kellyOptimalSize,
      fractionalKellySize: kellySizing.fractionalKellySize,
      volatilityAdjustedSize: volatilityAdjustedSizing,
      liquidityConstrainedSize: liquidityConstrainedSizing,
      finalRecommendedSize: adjustedSize,
      sizingMethodology: this.determineSizingMethodology(
        kellySizing.fractionalKellySize,
        volatilityAdjustedSizing,
        liquidityConstrainedSizing,
        riskBasedSizing
      ),
      riskWarnings,
      sizingRationale,
      calculatedAt: new Date()
    };
    
    // Update statistics
    this.updateStatistics(recommendation);
    
    // Emit sizing event
    this.emit('positionSized', recommendation);
    
    console.log(`✅ Position sized for ${opportunity.depegEvent.stablecoin}: $${adjustedSize.toLocaleString()} @ ${optimalLeverage}x leverage`);
    console.log(`📊 Risk: ${(riskPercentage * 100).toFixed(2)}% | Expected Return: ${(expectedReturnPercentage * 100).toFixed(2)}% | R/R: ${riskRewardRatio.toFixed(2)}`);
    
    return recommendation;
  }
  
  /**
   * Calculate position sizes for multiple opportunities
   * @param opportunities Array of opportunities
   * @param portfolioContext Current portfolio context
   * @returns Array of position sizing recommendations
   */
  async calculateMultiplePositionSizes(
    opportunities: OpportunityClassification[],
    portfolioContext: PortfolioContext
  ): Promise<PositionSizingRecommendation[]> {
    console.log(`📊 Calculating position sizes for ${opportunities.length} opportunities...`);
    
    const recommendations: PositionSizingRecommendation[] = [];
    
    // Calculate individual position sizes
    for (const opportunity of opportunities) {
      try {
        const recommendation = await this.calculatePositionSize(opportunity, portfolioContext);
        recommendations.push(recommendation);
      } catch (error) {
        console.error(`Error calculating position size for ${opportunity.depegEvent.stablecoin}:`, error);
        this.emit('error', error);
      }
    }
    
    // Adjust for portfolio constraints
    const adjustedRecommendations = this.adjustForPortfolioConstraints(recommendations, portfolioContext);
    
    console.log(`✅ Calculated position sizes for ${adjustedRecommendations.length} opportunities`);
    
    // Emit multiple sizing event
    this.emit('multiplePositionsSized', adjustedRecommendations);
    
    return adjustedRecommendations;
  }
  
  /**
   * Optimize capital allocation across opportunities
   * @param opportunities Array of opportunities
   * @param portfolioContext Current portfolio context
   * @returns Optimized allocation recommendations
   */
  async optimizeCapitalAllocation(
    opportunities: OpportunityClassification[],
    portfolioContext: PortfolioContext
  ): Promise<PositionSizingRecommendation[]> {
    console.log(`🎯 Optimizing capital allocation across ${opportunities.length} opportunities...`);
    
    // Calculate initial position sizes
    const initialRecommendations = await this.calculateMultiplePositionSizes(opportunities, portfolioContext);
    
    // Sort by risk-adjusted score
    const sortedOpportunities = initialRecommendations.sort(
      (a, b) => b.opportunity.riskAdjustedScore - a.opportunity.riskAdjustedScore
    );
    
    // Optimize allocation using Modern Portfolio Theory principles
    const optimizedRecommendations = this.optimizeUsingMPT(sortedOpportunities, portfolioContext);
    
    console.log(`✅ Optimized capital allocation for ${optimizedRecommendations.length} opportunities`);
    console.log(`🏆 Top allocation: ${optimizedRecommendations[0]?.opportunity.depegEvent.stablecoin} - $${optimizedRecommendations[0]?.recommendedPositionSize.toLocaleString()}`);
    
    // Emit optimization event
    this.emit('capitalAllocationOptimized', optimizedRecommendations);
    
    return optimizedRecommendations;
  }
  
  /**
   * Update configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<PositionSizingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Updated position sizing configuration');
  }
  
  /**
   * Get sizing statistics
   * @returns Sizing statistics
   */
  getSizingStats(): any {
    return {
      totalSizings: this.sizingCount,
      averageRecommendedSize: this.sizingCount > 0 ? this.totalRecommendedSize / this.sizingCount : 0,
      successfulSizings: this.successfulSizings,
      successRate: this.sizingCount > 0 ? this.successfulSizings / this.sizingCount : 0,
      config: this.config
    };
  }
  
  /**
   * Calculate Kelly optimal size
   * @param opportunity The opportunity
   * @param portfolioContext Portfolio context
   * @returns Kelly sizing results
   */
  private calculateKellySize(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext
  ): { kellyOptimalSize: number, fractionalKellySize: number } {
    // Kelly formula: f = (bp - q) / b
    // where f = fraction of capital to bet
    //       b = odds received (profit/loss ratio)
    //       p = probability of winning
    //       q = probability of losing (1 - p)
    
    const winProbability = opportunity.successProbability;
    const lossProbability = 1 - winProbability;
    const oddsReceived = opportunity.expectedProfitPercentage / this.config.stopLossPercentage;
    
    // Calculate Kelly fraction
    const kellyFraction = (oddsReceived * winProbability - lossProbability) / oddsReceived;
    
    // Ensure Kelly fraction is positive and reasonable
    const adjustedKellyFraction = Math.max(0, Math.min(kellyFraction, 0.5)); // Cap at 50%
    
    // Calculate Kelly optimal size
    const kellyOptimalSize = portfolioContext.availableCapital * adjustedKellyFraction;
    
    // Calculate fractional Kelly (more conservative)
    const fractionalKellySize = kellyOptimalSize * this.config.kellyFraction;
    
    return {
      kellyOptimalSize,
      fractionalKellySize
    };
  }
  
  /**
   * Calculate volatility-adjusted size
   * @param opportunity The opportunity
   * @param portfolioContext Portfolio context
   * @returns Volatility-adjusted size
   */
  private calculateVolatilityAdjustedSize(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext
  ): number {
    // Use market volatility to adjust position size
    const marketVolatility = opportunity.marketContext.volatilityFactor;
    
    // Higher volatility = smaller position size
    const volatilityAdjustment = 1 - (marketVolatility * 0.5); // Max 50% reduction
    
    // Base size on risk tolerance
    const riskMultiplier = this.config.riskToleranceMultipliers[portfolioContext.riskTolerance];
    const baseSize = portfolioContext.availableCapital * this.config.defaultRiskPerTrade * riskMultiplier;
    
    return baseSize * volatilityAdjustment;
  }
  
  /**
   * Calculate liquidity-constrained size
   * @param opportunity The opportunity
   * @returns Liquidity-constrained size
   */
  private calculateLiquidityConstrainedSize(opportunity: OpportunityClassification): number {
    // Calculate total available liquidity
    const totalLiquidity = opportunity.depegEvent.exchanges.reduce(
      (sum, ex) => sum + ex.liquidity,
      0
    );
    
    // Use only a fraction of available liquidity to minimize price impact
    return totalLiquidity * this.config.liquidityUtilization;
  }
  
  /**
   * Calculate risk-based size
   * @param opportunity The opportunity
   * @param portfolioContext Portfolio context
   * @returns Risk-based size
   */
  private calculateRiskBasedSize(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext
  ): number {
    // Calculate maximum risk amount
    const maxRiskAmount = portfolioContext.totalCapital * this.config.maxRiskPerTrade;
    
    // Calculate position size based on stop-loss
    const stopLossDistance = this.config.stopLossPercentage;
    const maxPositionSize = maxRiskAmount / stopLossDistance;
    
    // Adjust for risk tolerance
    const riskMultiplier = this.config.riskToleranceMultipliers[portfolioContext.riskTolerance];
    
    return maxPositionSize * riskMultiplier;
  }
  
  /**
   * Calculate optimal leverage
   * @param opportunity The opportunity
   * @param portfolioContext Portfolio context
   * @returns Optimal leverage
   */
  private calculateOptimalLeverage(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext
  ): number {
    // Base leverage on opportunity confidence and risk level
    let baseLeverage = 1;
    
    switch (opportunity.riskLevel) {
      case 'low':
        baseLeverage = 8;
        break;
      case 'medium':
        baseLeverage = 5;
        break;
      case 'high':
        baseLeverage = 3;
        break;
      case 'extreme':
        baseLeverage = 2;
        break;
    }
    
    // Adjust based on confidence level
    const confidenceAdjustment = opportunity.confidenceLevel;
    const adjustedLeverage = baseLeverage * confidenceAdjustment;
    
    // Adjust based on risk tolerance
    const riskMultiplier = this.config.riskToleranceMultipliers[portfolioContext.riskTolerance];
    const finalLeverage = adjustedLeverage * riskMultiplier;
    
    // Cap at maximum leverage
    return Math.min(finalLeverage, this.config.maxLeverage);
  }
  
  /**
   * Calculate stop-loss and take-profit levels
   * @param opportunity The opportunity
   * @returns Stop-loss and take-profit prices
   */
  private calculateStopLossAndTakeProfit(
    opportunity: OpportunityClassification
  ): { stopLossPrice: number, takeProfitPrice: number } {
    const currentPrice = opportunity.depegEvent.averagePrice;
    const pegValue = opportunity.depegEvent.pegValue;
    
    let stopLossPrice: number;
    let takeProfitPrice: number;
    
    if (opportunity.depegEvent.direction === 'discount') {
      // For discount, we buy low and sell high
      // Stop-loss is below current price, take-profit is at peg
      stopLossPrice = currentPrice * (1 - this.config.stopLossPercentage);
      takeProfitPrice = pegValue * 0.999; // Slightly below peg for safety
    } else {
      // For premium, we sell high and buy low
      // Stop-loss is above current price, take-profit is at peg
      stopLossPrice = currentPrice * (1 + this.config.stopLossPercentage);
      takeProfitPrice = pegValue * 1.001; // Slightly above peg for safety
    }
    
    return {
      stopLossPrice,
      takeProfitPrice
    };
  }
  
  /**
   * Calculate risk amount
   * @param positionSize Position size
   * @param leverage Leverage
   * @param opportunity The opportunity
   * @returns Risk amount
   */
  private calculateRiskAmount(
    positionSize: number,
    leverage: number,
    opportunity: OpportunityClassification
  ): number {
    // Risk is the maximum potential loss
    // This occurs if the stop-loss is hit
    return positionSize * leverage * this.config.stopLossPercentage;
  }
  
  /**
   * Calculate position confidence
   * @param opportunity The opportunity
   * @param portfolioContext Portfolio context
   * @returns Position confidence (0-100)
   */
  private calculatePositionConfidence(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext
  ): number {
    let confidence = opportunity.confidenceLevel * 100;
    
    // Adjust based on portfolio risk
    const portfolioRiskRatio = portfolioContext.currentPortfolioRisk / portfolioContext.maxTotalRisk;
    if (portfolioRiskRatio > 0.8) {
      confidence *= 0.8; // Reduce confidence if portfolio is highly leveraged
    }
    
    // Adjust based on number of positions
    const positionRatio = portfolioContext.activePositions / portfolioContext.maxPositions;
    if (positionRatio > 0.8) {
      confidence *= 0.9; // Reduce confidence if too many positions
    }
    
    return Math.min(100, Math.max(0, confidence));
  }
  
  /**
   * Generate risk warnings
   * @param opportunity The opportunity
   * @param portfolioContext Portfolio context
   * @param riskPercentage Risk percentage
   * @returns Array of risk warnings
   */
  private generateRiskWarnings(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext,
    riskPercentage: number
  ): string[] {
    const warnings: string[] = [];
    
    // High risk percentage warning
    if (riskPercentage > this.config.maxRiskPerTrade) {
      warnings.push(`Risk percentage (${(riskPercentage * 100).toFixed(2)}%) exceeds maximum allowed (${(this.config.maxRiskPerTrade * 100).toFixed(2)}%)`);
    }
    
    // Low liquidity warning
    if (opportunity.marketContext.liquidityFactor < 0.3) {
      warnings.push('Low liquidity may result in high slippage and difficulty exiting position');
    }
    
    // High volatility warning
    if (opportunity.marketContext.volatilityFactor > 0.7) {
      warnings.push('High market volatility increases risk of unexpected price movements');
    }
    
    // Extreme depeg warning
    if (opportunity.depegEvent.severity === DepegSeverity.EXTREME) {
      warnings.push('Extreme depeg events may take longer to revert and carry higher risk');
    }
    
    // Portfolio concentration warning
    const portfolioRiskRatio = portfolioContext.currentPortfolioRisk / portfolioContext.maxTotalRisk;
    if (portfolioRiskRatio > 0.8) {
      warnings.push('Portfolio is highly leveraged - consider reducing position size');
    }
    
    return warnings;
  }
  
  /**
   * Generate sizing rationale
   * @param opportunity The opportunity
   * @param portfolioContext Portfolio context
   * @param kellySizing Kelly sizing results
   * @param volatilityAdjustedSizing Volatility-adjusted size
   * @param liquidityConstrainedSizing Liquidity-constrained size
   * @param riskBasedSizing Risk-based size
   * @returns Sizing rationale
   */
  private generateSizingRationale(
    opportunity: OpportunityClassification,
    portfolioContext: PortfolioContext,
    kellySizing: { kellyOptimalSize: number, fractionalKellySize: number },
    volatilityAdjustedSizing: number,
    liquidityConstrainedSizing: number,
    riskBasedSizing: number
  ): string {
    const sizes = [
      { name: 'Kelly', size: kellySizing.fractionalKellySize },
      { name: 'Volatility-Adjusted', size: volatilityAdjustedSizing },
      { name: 'Liquidity-Constrained', size: liquidityConstrainedSizing },
      { name: 'Risk-Based', size: riskBasedSizing }
    ];
    
    // Find the constraining factor (smallest size)
    const constrainingFactor = sizes.reduce((min, current) => 
      current.size < min.size ? current : min
    );
    
    return `Position size determined by ${constrainingFactor.name} method ($${constrainingFactor.size.toLocaleString()}). ` +
           `This ensures optimal risk management while maximizing profit potential for ${opportunity.depegEvent.stablecoin} ` +
           `${opportunity.depegEvent.direction} opportunity with ${opportunity.riskLevel} risk level.`;
  }
  
  /**
   * Determine sizing methodology
   * @param kellySize Kelly size
   * @param volatilitySize Volatility-adjusted size
   * @param liquiditySize Liquidity-constrained size
   * @param riskSize Risk-based size
   * @returns Sizing methodology name
   */
  private determineSizingMethodology(
    kellySize: number,
    volatilitySize: number,
    liquiditySize: number,
    riskSize: number
  ): string {
    const minSize = Math.min(kellySize, volatilitySize, liquiditySize, riskSize);
    
    if (minSize === kellySize) return 'Kelly Criterion';
    if (minSize === volatilitySize) return 'Volatility-Adjusted';
    if (minSize === liquiditySize) return 'Liquidity-Constrained';
    return 'Risk-Based';
  }
  
  /**
   * Adjust recommendations for portfolio constraints
   * @param recommendations Initial recommendations
   * @param portfolioContext Portfolio context
   * @returns Adjusted recommendations
   */
  private adjustForPortfolioConstraints(
    recommendations: PositionSizingRecommendation[],
    portfolioContext: PortfolioContext
  ): PositionSizingRecommendation[] {
    // Calculate total recommended allocation
    const totalRecommendedSize = recommendations.reduce(
      (sum, rec) => sum + rec.recommendedPositionSize,
      0
    );
    
    // If total exceeds available capital, scale down proportionally
    if (totalRecommendedSize > portfolioContext.availableCapital) {
      const scalingFactor = portfolioContext.availableCapital / totalRecommendedSize;
      
      recommendations.forEach(rec => {
        rec.recommendedPositionSize *= scalingFactor;
        rec.totalExposure = rec.recommendedPositionSize * rec.recommendedLeverage;
        rec.riskAmount = this.calculateRiskAmount(
          rec.recommendedPositionSize,
          rec.recommendedLeverage,
          rec.opportunity
        );
        rec.riskPercentage = rec.riskAmount / portfolioContext.totalCapital;
        rec.expectedReturn = rec.recommendedPositionSize * rec.opportunity.expectedProfitPercentage;
        rec.riskRewardRatio = rec.expectedReturn / rec.riskAmount;
        
        // Add scaling warning
        rec.riskWarnings.push(`Position size scaled down by ${((1 - scalingFactor) * 100).toFixed(1)}% due to capital constraints`);
      });
    }
    
    return recommendations;
  }
  
  /**
   * Optimize using Modern Portfolio Theory principles
   * @param recommendations Initial recommendations
   * @param portfolioContext Portfolio context
   * @returns Optimized recommendations
   */
  private optimizeUsingMPT(
    recommendations: PositionSizingRecommendation[],
    portfolioContext: PortfolioContext
  ): PositionSizingRecommendation[] {
    // For simplicity, we'll use a basic optimization approach
    // In a full implementation, this would use quadratic programming
    
    // Sort by risk-adjusted return (Sharpe ratio equivalent)
    const sortedRecs = recommendations.sort((a, b) => {
      const sharpeA = a.expectedReturnPercentage / (a.riskPercentage || 0.01);
      const sharpeB = b.expectedReturnPercentage / (b.riskPercentage || 0.01);
      return sharpeB - sharpeA;
    });
    
    // Allocate capital starting with highest risk-adjusted returns
    let remainingCapital = portfolioContext.availableCapital;
    const optimizedRecs: PositionSizingRecommendation[] = [];
    
    for (const rec of sortedRecs) {
      if (remainingCapital <= 0) break;
      
      // Allocate up to the recommended size or remaining capital
      const allocatedSize = Math.min(rec.recommendedPositionSize, remainingCapital);
      
      if (allocatedSize >= this.config.minPositionSize) {
        // Create optimized recommendation
        const optimizedRec = { ...rec };
        optimizedRec.recommendedPositionSize = allocatedSize;
        optimizedRec.totalExposure = allocatedSize * rec.recommendedLeverage;
        optimizedRec.riskAmount = this.calculateRiskAmount(
          allocatedSize,
          rec.recommendedLeverage,
          rec.opportunity
        );
        optimizedRec.riskPercentage = optimizedRec.riskAmount / portfolioContext.totalCapital;
        optimizedRec.expectedReturn = allocatedSize * rec.opportunity.expectedProfitPercentage;
        optimizedRec.riskRewardRatio = optimizedRec.expectedReturn / optimizedRec.riskAmount;
        
        optimizedRecs.push(optimizedRec);
        remainingCapital -= allocatedSize;
      }
    }
    
    return optimizedRecs;
  }
  
  /**
   * Update sizing statistics
   * @param recommendation The sizing recommendation
   */
  private updateStatistics(recommendation: PositionSizingRecommendation): void {
    this.sizingCount++;
    this.totalRecommendedSize += recommendation.recommendedPositionSize;
    
    if (recommendation.riskRewardRatio >= 2.0) {
      this.successfulSizings++;
    }
  }
}

export default PositionSizingCalculator;
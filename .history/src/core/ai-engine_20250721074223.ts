// ULTIMATE TRADING EMPIRE - AI ENGINE
// REVOLUTIONARY: AI that creates new strategies and evolves existing ones

import OpenAI from 'openai';
import { AIStrategy, MarketRegime, TradeSignal, StrategyType } from '../types/core';
import { AIStrategyModel, MarketRegimeModel } from '../database/models';
import { v4 as uuidv4 } from 'uuid';

export class AITradingEngine {
  private openai: OpenAI;
  private currentMarketRegime: MarketRegime | null = null;
  private strategyEvolutionRate = 0.1;
  private maxActiveStrategies = 50;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  // REVOLUTIONARY: AI creates entirely new trading strategies
  async generateNewStrategy(marketConditions: any, performanceHistory: any[]): Promise<AIStrategy> {
    const prompt = `
    You are an elite quantitative trading strategist. Based on current market conditions and performance history, create a NEW trading strategy.

    Market Conditions:
    ${JSON.stringify(marketConditions, null, 2)}

    Recent Performance History:
    ${JSON.stringify(performanceHistory.slice(-10), null, 2)}

    Create a trading strategy that:
    1. Exploits current market inefficiencies
    2. Has measurable edge and clear entry/exit rules
    3. Includes risk management parameters
    4. Can work with small capital (£3-100)
    5. Has realistic profit expectations

    Return a JSON object with:
    {
      "name": "Strategy name",
      "description": "Detailed description",
      "entryConditions": ["condition1", "condition2"],
      "exitConditions": ["condition1", "condition2"],
      "riskManagement": {
        "maxPositionSize": 0.05,
        "stopLoss": 0.02,
        "takeProfit": 0.06
      },
      "expectedWinRate": 0.65,
      "expectedReturn": 0.08,
      "timeframe": "5m",
      "assets": ["BTC", "ETH"],
      "code": "// TypeScript implementation code"
    }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const strategyData = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      const aiStrategy: AIStrategy = {
        id: uuidv4(),
        name: strategyData.name,
        description: strategyData.description,
        code: strategyData.code,
        backtestResults: {
          winRate: strategyData.expectedWinRate,
          avgReturn: strategyData.expectedReturn,
          maxDrawdown: 0.1, // Will be updated after backtesting
          sharpeRatio: 1.5 // Will be updated after backtesting
        },
        confidence: 0.6, // Initial confidence
        createdAt: new Date(),
        lastOptimizedAt: new Date(),
        isActive: false // Needs backtesting first
      };

      // Save to database
      await new AIStrategyModel(aiStrategy).save();
      
      return aiStrategy;
    } catch (error) {
      console.error('Error generating AI strategy:', error);
      throw error;
    }
  }

  // EVOLUTION: Optimize existing strategies based on performance
  async optimizeStrategy(strategyId: string, recentPerformance: any[]): Promise<AIStrategy> {
    const strategy = await AIStrategyModel.findOne({ id: strategyId });
    if (!strategy) throw new Error('Strategy not found');

    const prompt = `
    Optimize this trading strategy based on recent performance data:

    Current Strategy:
    ${JSON.stringify(strategy, null, 2)}

    Recent Performance:
    ${JSON.stringify(recentPerformance, null, 2)}

    Analyze the performance and suggest optimizations:
    1. Parameter adjustments
    2. Entry/exit condition improvements
    3. Risk management enhancements
    4. Market regime adaptations

    Return optimized strategy with same JSON structure but improved parameters.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      });

      const optimizedData = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      // Update strategy with optimizations
      strategy.code = optimizedData.code;
      strategy.description = optimizedData.description;
      strategy.lastOptimizedAt = new Date();
      strategy.confidence = Math.min(strategy.confidence + 0.1, 1.0);

      await strategy.save();
      return strategy.toObject();
    } catch (error) {
      console.error('Error optimizing strategy:', error);
      throw error;
    }
  }

  // REVOLUTIONARY: Detect market regime changes using AI
  async detectMarketRegime(marketData: any[]): Promise<MarketRegime> {
    const prompt = `
    Analyze this market data and determine the current market regime:

    Market Data (last 100 data points):
    ${JSON.stringify(marketData.slice(-100), null, 2)}

    Determine:
    1. Market regime type: bull, bear, sideways, volatile, low-vol
    2. Confidence level (0-1)
    3. Expected duration in hours
    4. Optimal strategies for this regime
    5. Risk and leverage multipliers

    Return JSON:
    {
      "type": "bull|bear|sideways|volatile|low-vol",
      "confidence": 0.85,
      "duration": 24,
      "optimalStrategies": ["whale-tracking", "momentum-transfer"],
      "riskMultiplier": 1.2,
      "leverageMultiplier": 1.5,
      "reasoning": "Explanation of analysis"
    }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      });

      const regimeData = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      const marketRegime: MarketRegime = {
        id: uuidv4(),
        type: regimeData.type,
        confidence: regimeData.confidence,
        duration: regimeData.duration,
        optimalStrategies: regimeData.optimalStrategies,
        riskMultiplier: regimeData.riskMultiplier,
        leverageMultiplier: regimeData.leverageMultiplier,
        detectedAt: new Date(),
        estimatedEndAt: new Date(Date.now() + regimeData.duration * 60 * 60 * 1000)
      };

      // Save current regime
      this.currentMarketRegime = marketRegime;
      await new MarketRegimeModel(marketRegime).save();
      
      return marketRegime;
    } catch (error) {
      console.error('Error detecting market regime:', error);
      throw error;
    }
  }

  // EVOLUTION: AI-enhanced signal analysis
  async enhanceTradeSignal(signal: TradeSignal, marketContext: any): Promise<TradeSignal> {
    const prompt = `
    Analyze and enhance this trade signal:

    Signal:
    ${JSON.stringify(signal, null, 2)}

    Market Context:
    ${JSON.stringify(marketContext, null, 2)}

    Current Market Regime:
    ${JSON.stringify(this.currentMarketRegime, null, 2)}

    Provide enhancements:
    1. Confidence adjustment based on market conditions
    2. Position size optimization
    3. Entry/exit timing improvements
    4. Risk assessment

    Return enhanced signal with same structure but optimized values.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      const enhancedData = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      // Apply AI enhancements
      const enhancedSignal = {
        ...signal,
        confidence: Math.min(signal.confidence * enhancedData.confidenceMultiplier || 1, 1),
        quantity: signal.quantity * (enhancedData.sizeMultiplier || 1),
        urgency: enhancedData.urgency || signal.urgency
      };

      return enhancedSignal;
    } catch (error) {
      console.error('Error enhancing trade signal:', error);
      return signal; // Return original if enhancement fails
    }
  }

  // REVOLUTIONARY: Cross-strategy synergy detection
  async detectStrategySynergies(activeSignals: TradeSignal[]): Promise<TradeSignal[]> {
    if (activeSignals.length < 2) return activeSignals;

    const prompt = `
    Analyze these active trading signals for synergies and conflicts:

    Active Signals:
    ${JSON.stringify(activeSignals, null, 2)}

    Identify:
    1. Signals that reinforce each other (increase confidence)
    2. Signals that conflict (reduce confidence or cancel)
    3. Combination opportunities (new synthetic signals)
    4. Risk concentration issues

    Return optimized signal list with adjusted confidence levels.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1500
      });

      const synergyData = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      // Apply synergy adjustments
      return synergyData.optimizedSignals || activeSignals;
    } catch (error) {
      console.error('Error detecting synergies:', error);
      return activeSignals;
    }
  }

  // EVOLUTION: Natural language trading commands
  async processNaturalLanguageCommand(command: string, accountContext: any): Promise<any> {
    const prompt = `
    Process this natural language trading command:

    Command: "${command}"
    
    Account Context:
    ${JSON.stringify(accountContext, null, 2)}

    Convert to structured trading action:
    {
      "action": "buy|sell|close|modify|analyze",
      "asset": "BTC",
      "quantity": 0.1,
      "orderType": "market|limit",
      "price": 45000,
      "reasoning": "Why this action makes sense"
    }

    If command is unclear or risky, return error with explanation.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Error processing natural language command:', error);
      throw error;
    }
  }

  // EVOLUTION: Strategy evolution through genetic algorithms
  async evolveStrategies(): Promise<void> {
    const strategies = await AIStrategyModel.find({ isActive: true }).limit(this.maxActiveStrategies);
    
    // Select top performers for evolution
    const topPerformers = strategies
      .sort((a, b) => (b.backtestResults.sharpeRatio || 0) - (a.backtestResults.sharpeRatio || 0))
      .slice(0, Math.floor(strategies.length * 0.3));

    // Create mutations of top performers
    for (const strategy of topPerformers) {
      if (Math.random() < this.strategyEvolutionRate) {
        await this.mutateStrategy(strategy);
      }
    }

    // Remove worst performers
    const worstPerformers = strategies
      .sort((a, b) => (a.backtestResults.sharpeRatio || 0) - (b.backtestResults.sharpeRatio || 0))
      .slice(0, Math.floor(strategies.length * 0.1));

    for (const strategy of worstPerformers) {
      await AIStrategyModel.deleteOne({ id: strategy.id });
    }
  }

  private async mutateStrategy(parentStrategy: any): Promise<void> {
    const prompt = `
    Create a mutation of this trading strategy:

    Parent Strategy:
    ${JSON.stringify(parentStrategy, null, 2)}

    Create a similar but slightly modified version:
    1. Adjust parameters by 5-20%
    2. Modify entry/exit conditions slightly
    3. Keep core logic but add variations
    4. Maintain risk management principles

    Return mutated strategy with new ID and incremented generation.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 1500
      });

      const mutatedData = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      const mutatedStrategy = {
        ...mutatedData,
        id: uuidv4(),
        parentStrategyId: parentStrategy.id,
        evolutionGeneration: (parentStrategy.evolutionGeneration || 1) + 1,
        createdAt: new Date(),
        isActive: false // Needs backtesting
      };

      await new AIStrategyModel(mutatedStrategy).save();
    } catch (error) {
      console.error('Error mutating strategy:', error);
    }
  }

  // Get current market regime
  getCurrentMarketRegime(): MarketRegime | null {
    return this.currentMarketRegime;
  }

  // Update strategy evolution rate
  setEvolutionRate(rate: number): void {
    this.strategyEvolutionRate = Math.max(0, Math.min(1, rate));
  }
}
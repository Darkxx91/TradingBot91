// ULTIMATE TRADING EMPIRE - REGULATORY ANALYZER
// Analyze regulatory news for sentiment and trading impact

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  RegulatoryEvent, 
  RegulatorySource, 
  RegulatoryContentType, 
  RegulatoryImpact 
} from './regulatory-monitor';

export interface RegulatoryAnalysis {
  id: string;
  regulatoryEvent: RegulatoryEvent;
  detailedSentiment: {
    positive: number; // 0-1 scale
    negative: number; // 0-1 scale
    neutral: number; // 0-1 scale
  };
  marketImpact: {
    shortTerm: number; // -1 to 1 scale
    mediumTerm: number; // -1 to 1 scale
    longTerm: number; // -1 to 1 scale
  };
  assetImpacts: {
    asset: string;
    impact: number; // -1 to 1 scale
    confidence: number; // 0-1 scale
  }[];
  tradingSignals: {
    asset: string;
    direction: 'buy' | 'sell' | 'neutral';
    timeframe: 'immediate' | 'short' | 'medium' | 'long';
    strength: number; // 0-1 scale
    confidence: number; // 0-1 scale
  }[];
  keywords: string[];
  entities: string[];
  analysisTimeMs: number;
  createdAt: Date;
}

// Define event types for TypeScript
declare interface RegulatoryAnalyzer {
  on(event: 'analysis', listener: (analysis: RegulatoryAnalysis) => void): this;
  on(event: 'tradingSignal', listener: (signal: any) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  emit(event: 'analysis', analysis: RegulatoryAnalysis): boolean;
  emit(event: 'tradingSignal', signal: any): boolean;
  emit(event: 'error', error: Error): boolean;
}

export class RegulatoryAnalyzer extends EventEmitter {
  private isRunning: boolean = false;
  private keywordDictionary: Map<string, number> = new Map(); // keyword -> sentiment score
  private assetKeywords: Map<string, string[]> = new Map(); // asset -> relevant keywords
  
  constructor() {
    super();
    this.initializeKeywordDictionary();
    this.initializeAssetKeywords();
  }

  /**
   * 🏗️ INITIALIZE KEYWORD DICTIONARY
   */
  private initializeKeywordDictionary(): void {
    // Positive keywords
    const positiveKeywords = [
      'approve', 'approval', 'positive', 'bullish', 'support', 'innovation',
      'growth', 'opportunity', 'clarity', 'framework', 'guidance', 'adopt',
      'adoption', 'legal', 'legitimate', 'endorse', 'partnership', 'collaborate',
      'progress', 'advance', 'benefit', 'advantage', 'favorable', 'encourage'
    ];
    
    // Negative keywords
    const negativeKeywords = [
      'ban', 'restrict', 'prohibit', 'illegal', 'violation', 'penalty',
      'fine', 'enforcement', 'action', 'against', 'concern', 'risk',
      'warning', 'fraud', 'scam', 'investigation', 'scrutiny', 'suspend',
      'halt', 'cease', 'desist', 'terminate', 'bearish', 'negative',
      'crackdown', 'compliance', 'failure', 'sanction', 'punitive'
    ];
    
    // Add positive keywords with scores
    positiveKeywords.forEach(keyword => {
      this.keywordDictionary.set(keyword, 0.7); // Base positive score
    });
    
    // Add negative keywords with scores
    negativeKeywords.forEach(keyword => {
      this.keywordDictionary.set(keyword, -0.7); // Base negative score
    });
    
    // Add specific high-impact keywords
    this.keywordDictionary.set('ban', -0.9);
    this.keywordDictionary.set('illegal', -0.9);
    this.keywordDictionary.set('approve', 0.9);
    this.keywordDictionary.set('endorse', 0.9);
  }

  /**
   * 🏗️ INITIALIZE ASSET KEYWORDS
   */
  private initializeAssetKeywords(): void {
    // Bitcoin related keywords
    this.assetKeywords.set('BTC/USDT', [
      'bitcoin', 'btc', 'crypto', 'cryptocurrency', 'digital asset',
      'digital currency', 'mining', 'proof of work', 'satoshi'
    ]);
    
    // Ethereum related keywords
    this.assetKeywords.set('ETH/USDT', [
      'ethereum', 'eth', 'smart contract', 'defi', 'decentralized finance',
      'dapp', 'erc20', 'erc721', 'nft', 'gas fee', 'proof of stake'
    ]);
    
    // XRP related keywords
    this.assetKeywords.set('XRP/USDT', [
      'xrp', 'ripple', 'cross-border', 'payment', 'remittance',
      'international transfer', 'banking'
    ]);
    
    // Stablecoin related keywords
    this.assetKeywords.set('USDT/USD', [
      'tether', 'usdt', 'stablecoin', 'peg', 'dollar-backed',
      'reserve', 'audit'
    ]);
    
    this.assetKeywords.set('USDC/USD', [
      'usdc', 'circle', 'stablecoin', 'peg', 'dollar-backed',
      'reserve', 'audit', 'regulated'
    ]);
    
    // General crypto market keywords
    const generalCryptoKeywords = [
      'cryptocurrency', 'crypto', 'digital asset', 'token', 'blockchain',
      'distributed ledger', 'decentralized', 'exchange', 'trading',
      'regulation', 'compliance', 'kyc', 'aml'
    ];
    
    // Add general keywords to all crypto assets
    ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'BNB/USDT'].forEach(asset => {
      const existingKeywords = this.assetKeywords.get(asset) || [];
      this.assetKeywords.set(asset, [...existingKeywords, ...generalCryptoKeywords]);
    });
  }

  /**
   * 🚀 START ANALYZER
   */
  start(): void {
    if (this.isRunning) {
      console.log('📊 Regulatory analyzer already running');
      return;
    }

    console.log('🚀 STARTING REGULATORY ANALYZER...');
    this.isRunning = true;
    console.log('📊 REGULATORY ANALYZER ACTIVE!');
  }

  /**
   * 📊 ANALYZE REGULATORY EVENT
   */
  async analyzeRegulatoryEvent(event: RegulatoryEvent): Promise<RegulatoryAnalysis> {
    console.log(`📊 ANALYZING REGULATORY EVENT: ${event.title}`);
    
    const startTime = Date.now();
    
    try {
      // Extract keywords from title and content
      const extractedKeywords = this.extractKeywords(event.title + ' ' + event.content);
      
      // Calculate detailed sentiment
      const detailedSentiment = this.calculateDetailedSentiment(event, extractedKeywords);
      
      // Determine market impact
      const marketImpact = this.calculateMarketImpact(event, detailedSentiment);
      
      // Calculate impact on specific assets
      const assetImpacts = this.calculateAssetImpacts(event, extractedKeywords);
      
      // Generate trading signals
      const tradingSignals = this.generateTradingSignals(event, assetImpacts, marketImpact);
      
      // Extract entities (organizations, people, etc.)
      const entities = this.extractEntities(event.title + ' ' + event.content);
      
      const endTime = Date.now();
      const analysisTimeMs = endTime - startTime;
      
      // Create analysis object
      const analysis: RegulatoryAnalysis = {
        id: uuidv4(),
        regulatoryEvent: event,
        detailedSentiment,
        marketImpact,
        assetImpacts,
        tradingSignals,
        keywords: extractedKeywords,
        entities,
        analysisTimeMs,
        createdAt: new Date()
      };
      
      console.log(`📊 ANALYSIS COMPLETE: ${analysisTimeMs}ms`);
      console.log(`📊 Sentiment: ${detailedSentiment.positive.toFixed(2)} positive, ${detailedSentiment.negative.toFixed(2)} negative`);
      console.log(`📊 Market Impact: Short-term ${marketImpact.shortTerm.toFixed(2)}, Medium-term ${marketImpact.mediumTerm.toFixed(2)}`);
      
      // Emit analysis event
      this.emit('analysis', analysis);
      
      // Emit trading signals
      tradingSignals.forEach(signal => {
        this.emit('tradingSignal', signal);
      });
      
      return analysis;
      
    } catch (error) {
      console.error('Error analyzing regulatory event:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * 🔍 EXTRACT KEYWORDS
   */
  private extractKeywords(text: string): string[] {
    // In a real implementation, this would use NLP to extract meaningful keywords
    // For now, we'll use a simple approach
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 3); // Only words longer than 3 characters
    
    // Remove duplicates
    const uniqueWords = [...new Set(words)];
    
    // Filter to known keywords and common words
    return uniqueWords.filter(word => 
      this.keywordDictionary.has(word) || 
      ['regulation', 'crypto', 'bitcoin', 'ethereum', 'market', 'exchange', 'trading'].includes(word)
    );
  }

  /**
   * 📊 CALCULATE DETAILED SENTIMENT
   */
  private calculateDetailedSentiment(event: RegulatoryEvent, keywords: string[]): {
    positive: number;
    negative: number;
    neutral: number;
  } {
    // Start with base sentiment from the event
    let positive = event.sentiment > 0 ? event.sentiment : 0;
    let negative = event.sentiment < 0 ? -event.sentiment : 0;
    
    // Adjust based on keywords
    keywords.forEach(keyword => {
      const score = this.keywordDictionary.get(keyword) || 0;
      if (score > 0) {
        positive += score * 0.1; // Add 10% of keyword score to positive
      } else if (score < 0) {
        negative += -score * 0.1; // Add 10% of keyword score to negative
      }
    });
    
    // Adjust based on content type
    switch (event.contentType) {
      case RegulatoryContentType.ENFORCEMENT_ACTION:
        negative += 0.2; // Enforcement actions are generally negative
        break;
      case RegulatoryContentType.GUIDANCE:
        positive += 0.1; // Guidance is generally positive (clarity)
        break;
      case RegulatoryContentType.RULE_CHANGE:
        // Rule changes can be either positive or negative
        // Already captured in base sentiment
        break;
    }
    
    // Normalize to 0-1 range
    positive = Math.min(1, Math.max(0, positive));
    negative = Math.min(1, Math.max(0, negative));
    
    // Calculate neutral as the remainder
    const neutral = Math.max(0, 1 - positive - negative);
    
    return { positive, negative, neutral };
  }

  /**
   * 📊 CALCULATE MARKET IMPACT
   */
  private calculateMarketImpact(
    event: RegulatoryEvent,
    sentiment: { positive: number; negative: number; neutral: number }
  ): {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  } {
    // Calculate base impact from sentiment
    const sentimentImpact = sentiment.positive - sentiment.negative;
    
    // Short-term impact is more extreme than long-term
    let shortTerm = sentimentImpact * 1.5;
    let mediumTerm = sentimentImpact * 1.0;
    let longTerm = sentimentImpact * 0.5;
    
    // Adjust based on content type
    switch (event.contentType) {
      case RegulatoryContentType.ENFORCEMENT_ACTION:
        shortTerm *= 1.5; // Enforcement actions have stronger short-term impact
        longTerm *= 0.5; // But less long-term impact
        break;
      case RegulatoryContentType.RULE_CHANGE:
        shortTerm *= 1.2;
        mediumTerm *= 1.5; // Rule changes have stronger medium-term impact
        longTerm *= 1.2;
        break;
      case RegulatoryContentType.RATE_DECISION:
        shortTerm *= 2.0; // Rate decisions have very strong short-term impact
        mediumTerm *= 1.5;
        break;
    }
    
    // Adjust based on source
    switch (event.source) {
      case RegulatorySource.SEC:
      case RegulatorySource.CFTC:
        // SEC and CFTC have strong impact on crypto
        shortTerm *= 1.3;
        mediumTerm *= 1.2;
        break;
      case RegulatorySource.FED:
        // Fed has strong impact on all markets
        shortTerm *= 1.5;
        mediumTerm *= 1.3;
        longTerm *= 1.2;
        break;
    }
    
    // Clamp to -1 to 1 range
    shortTerm = Math.min(1, Math.max(-1, shortTerm));
    mediumTerm = Math.min(1, Math.max(-1, mediumTerm));
    longTerm = Math.min(1, Math.max(-1, longTerm));
    
    return { shortTerm, mediumTerm, longTerm };
  }

  /**
   * 📊 CALCULATE ASSET IMPACTS
   */
  private calculateAssetImpacts(event: RegulatoryEvent, keywords: string[]): {
    asset: string;
    impact: number;
    confidence: number;
  }[] {
    const impacts: { asset: string; impact: number; confidence: number }[] = [];
    
    // Start with affected assets from the event
    event.affectedAssets.forEach(asset => {
      // Base impact from event sentiment
      let impact = event.sentiment;
      let confidence = event.confidence;
      
      // Adjust based on keyword matches
      const assetKeywords = this.assetKeywords.get(asset) || [];
      const matchingKeywords = keywords.filter(keyword => 
        assetKeywords.includes(keyword)
      );
      
      // More keyword matches = higher confidence
      if (matchingKeywords.length > 0) {
        confidence = Math.min(1, confidence + 0.1 * matchingKeywords.length);
      }
      
      // Add to impacts
      impacts.push({ asset, impact, confidence });
    });
    
    // Check for other assets that might be affected based on keywords
    this.assetKeywords.forEach((assetKeywords, asset) => {
      // Skip if already included
      if (event.affectedAssets.includes(asset)) return;
      
      const matchingKeywords = keywords.filter(keyword => 
        assetKeywords.includes(keyword)
      );
      
      // If we have enough keyword matches, add this asset
      if (matchingKeywords.length >= 2) {
        const impact = event.sentiment * 0.7; // Reduced impact for indirectly affected assets
        const confidence = Math.min(0.7, 0.4 + 0.1 * matchingKeywords.length);
        
        impacts.push({ asset, impact, confidence });
      }
    });
    
    return impacts;
  }

  /**
   * 📊 GENERATE TRADING SIGNALS
   */
  private generateTradingSignals(
    event: RegulatoryEvent,
    assetImpacts: { asset: string; impact: number; confidence: number }[],
    marketImpact: { shortTerm: number; mediumTerm: number; longTerm: number }
  ): {
    asset: string;
    direction: 'buy' | 'sell' | 'neutral';
    timeframe: 'immediate' | 'short' | 'medium' | 'long';
    strength: number;
    confidence: number;
  }[] {
    const signals: {
      asset: string;
      direction: 'buy' | 'sell' | 'neutral';
      timeframe: 'immediate' | 'short' | 'medium' | 'long';
      strength: number;
      confidence: number;
    }[] = [];
    
    // Generate signals for each affected asset
    assetImpacts.forEach(assetImpact => {
      // Skip if impact or confidence is too low
      if (Math.abs(assetImpact.impact) < 0.2 || assetImpact.confidence < 0.5) return;
      
      // Determine direction
      const direction = assetImpact.impact > 0.1 ? 'buy' : 
                       assetImpact.impact < -0.1 ? 'sell' : 'neutral';
      
      // Skip neutral signals
      if (direction === 'neutral') return;
      
      // Determine timeframe based on content type
      let timeframe: 'immediate' | 'short' | 'medium' | 'long';
      
      switch (event.contentType) {
        case RegulatoryContentType.ENFORCEMENT_ACTION:
        case RegulatoryContentType.PRESS_RELEASE:
        case RegulatoryContentType.RATE_DECISION:
          timeframe = 'immediate'; // Immediate impact
          break;
        case RegulatoryContentType.RULE_CHANGE:
        case RegulatoryContentType.GUIDANCE:
          timeframe = 'short'; // Short-term impact
          break;
        default:
          timeframe = 'medium'; // Medium-term impact
      }
      
      // Calculate signal strength
      const strength = Math.abs(assetImpact.impact);
      
      // Add signal
      signals.push({
        asset: assetImpact.asset,
        direction,
        timeframe,
        strength,
        confidence: assetImpact.confidence
      });
    });
    
    return signals;
  }

  /**
   * 🔍 EXTRACT ENTITIES
   */
  private extractEntities(text: string): string[] {
    // In a real implementation, this would use NLP to extract named entities
    // For now, we'll return a simple list of common regulatory entities
    
    const commonEntities = [
      'SEC', 'CFTC', 'Federal Reserve', 'ECB', 'Bank of England',
      'Treasury', 'Congress', 'Parliament', 'White House', 'Binance',
      'Coinbase', 'Kraken', 'Bitcoin', 'Ethereum', 'Ripple'
    ];
    
    return commonEntities.filter(entity => 
      text.toLowerCase().includes(entity.toLowerCase())
    );
  }

  /**
   * 🛑 STOP ANALYZER
   */
  stop(): void {
    console.log('🛑 STOPPING REGULATORY ANALYZER...');
    this.isRunning = false;
    console.log('🛑 REGULATORY ANALYZER STOPPED');
  }
}

export default RegulatoryAnalyzer;
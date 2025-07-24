// STABLECOIN DEPEG EXPLOITATION SYSTEM - HISTORICAL DEPEG DATABASE
// Revolutionary mathematical certainty profits with guaranteed mean reversion

import { DepegEvent, DepegStatistics, DepegQueryParams, TimeFrame, Range } from './types';

/**
 * Interface for the Historical Depeg Database
 * 
 * REVOLUTIONARY INSIGHT: By storing and analyzing historical depeg events,
 * we can predict future reversion patterns with mathematical certainty,
 * giving us a massive edge over traders who treat each depeg as an isolated event!
 */
export interface DepegHistoryDatabase {
  /**
   * Record a new depeg event in the database
   * @param event The depeg event to record
   */
  recordDepegEvent(event: DepegEvent): Promise<void>;
  
  /**
   * Get historical depeg events for a specific stablecoin
   * @param stablecoin The stablecoin symbol (e.g., 'USDT', 'USDC', 'DAI')
   * @param timeframe The time frame to retrieve events for
   */
  getHistoricalDepegEvents(stablecoin: string, timeframe: TimeFrame): Promise<DepegEvent[]>;
  
  /**
   * Calculate the average reversion time for a specific magnitude of depeg
   * @param magnitude The magnitude of the depeg (percentage deviation from peg)
   * @param stablecoin The stablecoin symbol
   */
  calculateAverageReversionTime(magnitude: number, stablecoin: string): Promise<number>;
  
  /**
   * Find similar historical events to the current depeg event
   * @param currentEvent The current depeg event
   */
  findSimilarHistoricalEvents(currentEvent: DepegEvent): Promise<DepegEvent[]>;
  
  /**
   * Get the success rate for a specific stablecoin and magnitude range
   * @param stablecoin The stablecoin symbol
   * @param magnitude The magnitude range of the depeg
   */
  getSuccessRate(stablecoin: string, magnitude: Range): Promise<number>;
  
  /**
   * Get statistics for a specific stablecoin
   * @param stablecoin The stablecoin symbol
   * @param timeframe The time frame to calculate statistics for
   */
  getStablecoinStatistics(stablecoin: string, timeframe: TimeFrame): Promise<DepegStatistics>;
  
  /**
   * Query depeg events with various filters
   * @param params The query parameters
   */
  queryDepegEvents(params: DepegQueryParams): Promise<DepegEvent[]>;
  
  /**
   * Update an existing depeg event (e.g., when it resolves)
   * @param event The updated depeg event
   */
  updateDepegEvent(event: DepegEvent): Promise<void>;
  
  /**
   * Delete a depeg event (rarely used, mainly for data cleanup)
   * @param eventId The ID of the event to delete
   */
  deleteDepegEvent(eventId: string): Promise<void>;
  
  /**
   * Get the most profitable exchanges for a specific stablecoin
   * @param stablecoin The stablecoin symbol
   * @param timeframe The time frame to analyze
   */
  getMostProfitableExchanges(stablecoin: string, timeframe: TimeFrame): Promise<{exchange: string, profitFactor: number}[]>;
  
  /**
   * Analyze correlation between depeg events and market conditions
   * @param stablecoin The stablecoin symbol
   * @param timeframe The time frame to analyze
   */
  analyzeMarketCorrelations(stablecoin: string, timeframe: TimeFrame): Promise<{factor: string, correlation: number}[]>;
  
  /**
   * Predict the probability of a depeg event occurring in the near future
   * @param stablecoin The stablecoin symbol
   * @param marketConditions Current market conditions
   */
  predictDepegProbability(stablecoin: string, marketConditions: any): Promise<{probability: number, confidence: number}>;
  
  /**
   * Get the optimal entry and exit points for a specific depeg magnitude
   * @param stablecoin The stablecoin symbol
   * @param magnitude The magnitude of the depeg
   */
  getOptimalEntryExitPoints(stablecoin: string, magnitude: number): Promise<{entryThreshold: number, exitThreshold: number}>;
  
  /**
   * Backup the database to prevent data loss
   * @param destination The destination for the backup
   */
  backup(destination: string): Promise<void>;
  
  /**
   * Restore the database from a backup
   * @param source The source of the backup
   */
  restore(source: string): Promise<void>;
}
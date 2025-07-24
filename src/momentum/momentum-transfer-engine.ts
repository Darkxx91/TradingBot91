// ULTIMATE TRADING EMPIRE - MOMENTUM TRANSFER ENGINE
// Predict altcoin reactions to Bitcoin movements with 30s-15m precision

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import BitcoinMovementDetector, { BitcoinMovement } from './bitcoin-movement-detector';
import ExchangeManager from '../exchanges/exchange-manager';
import { TradeSignal } from '../types/core';

/**
 * Correlation data between Bitcoin and an altcoin
 */
export interface CoinCorrelation {
  altcoin: string;
  correlation: number; // -1 to 1
  avgDelayMs: number;
  minDelayMs: number;
  maxDelayMs: number;
  avgMagnitudeMultiplier: number;
  confidence: number; // 0-1
  dataPoints: number;
  updatedAt: Date;
}

/**
 * Momentum transfer opportunity
 */
export interface MomentumTransferOpportunity {
  id: string;
  bitcoinMovement: BitcoinMovement;
  altcoin: string;
  correlation: CoinCorrelation;
  expectedEntryTime: Date;
  expectedExitTime: Date;
  expectedMovement: number;
  expectedDirection: 'up' | 'down';
  confidence: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  detectedAt: Date;
  expiresAt: Date;
}

/**
 * Momentum transfer execution result
 */
export interface MomentumTransferResult {
  id: string;
  opportunityId: string;
  entrySignal: TradeSignal;
  exitSignal: TradeSignal;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercentage: number;
  status: 'pending' | 'entered' | 'exited' | 'failed';
  entryTime?: Date;
  exitTime?: Date;
  notes: string[];
}
// ULTIMATE TRADING EMPIRE - FLASH LOAN PROTOCOL FACTORY
// Factory for creating and managing flash loan protocol implementations

import { FlashLoanProvider } from '../flash-loan-protocol';
import AaveFlashLoan from './aave-flash-loan';
import DydxFlashLoan from './dydx-flash-loan';
import BalancerFlashLoan from './balancer-flash-loan';
import CompoundFlashLoan from './compound-flash-loan';

/**
 * Flash Loan Protocol Factory
 * 
 * Creates and manages protocol-specific implementations
 * Allows for easy addition of new protocols
 */
export class FlashLoanProtocolFactory {
  private protocols: Map<FlashLoanProvider, any> = new Map();
  
  constructor() {
    this.initializeProtocols();
  }
  
  /**
   * Initialize all supported flash loan protocols
   */
  private initializeProtocols(): void {
    this.protocols.set(FlashLoanProvider.AAVE, new AaveFlashLoan());
    this.protocols.set(FlashLoanProvider.DYDX, new DydxFlashLoan());
    this.protocols.set(FlashLoanProvider.BALANCER, new BalancerFlashLoan());
    this.protocols.set(FlashLoanProvider.COMPOUND, new CompoundFlashLoan());
    
    // Additional protocols can be added here as they're implemented
  }
  
  /**
   * Get a protocol implementation by provider
   */
  public getProtocol(provider: FlashLoanProvider): any {
    return this.protocols.get(provider);
  }
  
  /**
   * Check if a protocol is supported
   */
  public isProtocolSupported(provider: FlashLoanProvider): boolean {
    return this.protocols.has(provider);
  }
  
  /**
   * Get all supported protocols
   */
  public getSupportedProtocols(): FlashLoanProvider[] {
    return Array.from(this.protocols.keys());
  }
  
  /**
   * Find the best protocol for a specific asset based on fees and liquidity
   */
  public findBestProtocolForAsset(asset: string): FlashLoanProvider | null {
    let bestProvider: FlashLoanProvider | null = null;
    let lowestFee = Number.MAX_VALUE;
    
    for (const [provider, implementation] of this.protocols.entries()) {
      if (implementation.isAssetSupported && implementation.isAssetSupported(asset)) {
        const feePercentage = implementation.BALANCER_FEE_PERCENTAGE || 
                             implementation.AAVE_FEE_PERCENTAGE || 
                             implementation.DYDX_FEE_PERCENTAGE || 
                             implementation.COMPOUND_FEE_PERCENTAGE || 
                             1; // Default to 100% if not found
        
        if (feePercentage < lowestFee) {
          lowestFee = feePercentage;
          bestProvider = provider;
        }
      }
    }
    
    return bestProvider;
  }
}

export default FlashLoanProtocolFactory;
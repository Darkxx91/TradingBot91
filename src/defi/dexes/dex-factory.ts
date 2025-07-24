// ULTIMATE TRADING EMPIRE - DEX FACTORY
// Factory for creating and managing DEX implementations

import { DexInterface } from './dex-interface';
import UniswapV3 from './uniswap-v3';
import SushiSwap from './sushiswap';

/**
 * DEX Factory
 * 
 * Creates and manages DEX implementations
 * Allows for easy addition of new DEXes
 */
export class DexFactory {
  private dexes: Map<string, DexInterface> = new Map();
  
  constructor() {
    this.initializeDexes();
  }
  
  /**
   * Initialize all supported DEXes
   */
  private initializeDexes(): void {
    this.dexes.set('uniswap-v3', new UniswapV3());
    this.dexes.set('sushiswap', new SushiSwap());
    
    // Additional DEXes can be added here as they're implemented
  }
  
  /**
   * Get a DEX implementation by name
   */
  getDex(name: string): DexInterface | undefined {
    return this.dexes.get(name);
  }
  
  /**
   * Get all DEX implementations
   */
  getAllDexes(): DexInterface[] {
    return Array.from(this.dexes.values());
  }
  
  /**
   * Get all DEX names
   */
  getAllDexNames(): string[] {
    return Array.from(this.dexes.keys());
  }
  
  /**
   * Get DEXes that support a specific network
   */
  getDexesForNetwork(network: string): DexInterface[] {
    return this.getAllDexes().filter(dex => 
      dex.getSupportedNetworks().includes(network)
    );
  }
  
  /**
   * Get DEXes that support a specific token
   */
  getDexesForToken(token: string, network: string): DexInterface[] {
    return this.getAllDexes().filter(dex => 
      dex.getSupportedNetworks().includes(network) && 
      dex.isTokenSupported(token, network)
    );
  }
  
  /**
   * Add a new DEX implementation
   */
  addDex(name: string, dex: DexInterface): void {
    this.dexes.set(name, dex);
  }
}

export default DexFactory;
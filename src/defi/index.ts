// ULTIMATE TRADING EMPIRE - DEFI MODULE
// Export all DeFi-related components

export { 
  default as FlashLoanProtocol,
  FlashLoanProvider,
  FlashLoanParams,
  FlashLoanResult
} from './flash-loan-protocol';

export {
  default as FlashLoanArbitrage,
  ArbitrageRoute,
  FlashLoanArbitrageResult
} from './flash-loan-arbitrage';

export {
  default as DexArbitrageEngine,
  DexPrice,
  DexArbitrageOpportunity
} from './dex-arbitrage-engine';

// Export protocol implementations
export {
  AaveFlashLoan,
  DydxFlashLoan,
  BalancerFlashLoan,
  CompoundFlashLoan,
  FlashLoanProtocolFactory
} from './protocols';
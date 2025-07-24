// PAPER TRADING MODE
// Uses real market data but simulates trades without using real funds

import { Config } from "./config-loader";
import { RealTimeMarketData } from "./real-time-market-data";
import { EventEmitter } from "events";

/**
 * Paper trade
 */
interface PaperTrade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  value: number;
  timestamp: Date;
  fees: number;
  status: "open" | "closed";
  closePrice?: number;
  closeTimestamp?: Date;
  profit?: number;
  profitPercentage?: number;
}

/**
 * Paper trading account
 */
interface PaperAccount {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
  availableBalance: number;
  positions: Map<string, number>; // symbol -> amount
  trades: PaperTrade[];
  pnl: number;
  pnlPercentage: number;
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * Paper trading mode
 */
export class PaperTradingMode extends EventEmitter {
  private config: Config;
  private marketData: RealTimeMarketData;
  private accounts: Map<string, PaperAccount> = new Map();
  private isRunning: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private prices: Map<string, number> = new Map();

  /**
   * Constructor
   * @param config Configuration
   * @param marketData Market data
   */
  constructor(config: Config, marketData: RealTimeMarketData) {
    super();
    this.config = config;
    this.marketData = marketData;

    // Create default account
    this.createAccount("default", config.trading.initialCapital);
  }

  /**
   * Start paper trading
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("📝 Paper trading already running");
      return;
    }

    console.log("🚀 STARTING PAPER TRADING MODE...");
    console.log(`💰 Initial capital: £${this.config.trading.initialCapital}`);

    // Start price updates
    this.updateInterval = setInterval(() => {
      this.updatePrices();
    }, 5000); // Update every 5 seconds

    this.isRunning = true;
    console.log("📝 PAPER TRADING MODE ACTIVE!");
  }

  /**
   * Stop paper trading
   */
  stop(): void {
    if (!this.isRunning) {
      console.log("📝 Paper trading already stopped");
      return;
    }

    console.log("🛑 STOPPING PAPER TRADING MODE...");

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isRunning = false;
    console.log("📝 PAPER TRADING MODE STOPPED");
  }

  /**
   * Create account
   * @param name Account name
   * @param initialBalance Initial balance
   * @returns Account ID
   */
  createAccount(name: string, initialBalance: number): string {
    const id = `account_${Date.now()}`;

    const account: PaperAccount = {
      id,
      name,
      balance: initialBalance,
      initialBalance,
      availableBalance: initialBalance,
      positions: new Map(),
      trades: [],
      pnl: 0,
      pnlPercentage: 0,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    this.accounts.set(id, account);
    console.log(
      `📝 Created paper trading account: ${name} with £${initialBalance}`
    );

    return id;
  }

  /**
   * Execute trade
   * @param accountId Account ID
   * @param symbol Symbol
   * @param side Side
   * @param amount Amount
   * @returns Trade
   */
  async executeTrade(
    accountId: string,
    symbol: string,
    side: "buy" | "sell",
    amount: number
  ): Promise<PaperTrade | null> {
    const account = this.accounts.get(accountId);
    if (!account) {
      console.error(`❌ Account ${accountId} not found`);
      return null;
    }

    // Get current price
    let price = this.prices.get(symbol);
    if (!price) {
      try {
        const marketData = await this.marketData.getCurrentPrice(symbol);
        price = marketData.price;
        if (price) {
          this.prices.set(symbol, price);
        }
      } catch (error) {
        console.error(`❌ Failed to get price for ${symbol}:`, error);
        return null;
      }
    }

    // Ensure price is defined
    if (!price) {
      console.error(`❌ Price not available for ${symbol}`);
      return null;
    }

    // Calculate value
    const value = price * amount;

    // Calculate fees (0.1% for paper trading)
    const fees = value * 0.001;

    // Check if account has enough balance for buy
    if (side === "buy" && account.availableBalance < value + fees) {
      console.error(
        `❌ Insufficient balance for ${side} ${amount} ${symbol} at £${price}`
      );
      return null;
    }

    // Check if account has enough of the asset for sell
    if (side === "sell") {
      const position = account.positions.get(symbol) || 0;
      if (position < amount) {
        console.error(
          `❌ Insufficient ${symbol} for ${side} ${amount} at £${price}`
        );
        return null;
      }
    }

    // Create trade
    const trade: PaperTrade = {
      id: `trade_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      symbol,
      side,
      price,
      amount,
      value,
      timestamp: new Date(),
      fees,
      status: "open",
    };

    // Update account
    if (side === "buy") {
      // Deduct balance
      account.availableBalance -= value + fees;

      // Add to position
      const currentPosition = account.positions.get(symbol) || 0;
      account.positions.set(symbol, currentPosition + amount);
    } else {
      // Add to balance
      account.availableBalance += value - fees;

      // Deduct from position
      const currentPosition = account.positions.get(symbol) || 0;
      account.positions.set(symbol, currentPosition - amount);

      // Remove position if zero
      if (account.positions.get(symbol) === 0) {
        account.positions.delete(symbol);
      }

      // Close trade
      trade.status = "closed";
      trade.closePrice = price;
      trade.closeTimestamp = new Date();
      trade.profit = 0; // Will be calculated when we implement position tracking
      trade.profitPercentage = 0;
    }

    // Add trade to account
    account.trades.push(trade);

    // Update account
    account.lastUpdated = new Date();
    this.accounts.set(accountId, account);

    console.log(`📝 Executed ${side} ${amount} ${symbol} at £${price}`);
    this.emit("trade", trade);

    return trade;
  }

  /**
   * Update prices
   */
  private async updatePrices(): Promise<void> {
    try {
      // Update prices for all symbols in positions
      const symbols = new Set<string>();

      // Collect all symbols from all accounts
      for (const account of this.accounts.values()) {
        for (const symbol of account.positions.keys()) {
          symbols.add(symbol);
        }
      }

      // Update prices
      for (const symbol of symbols) {
        try {
          const marketData = await this.marketData.getCurrentPrice(symbol);
          this.prices.set(symbol, marketData.price);
        } catch (error) {
          console.error(`❌ Failed to update price for ${symbol}:`, error);
        }
      }

      // Update account balances
      this.updateAccountBalances();
    } catch (error) {
      console.error("❌ Failed to update prices:", error);
    }
  }

  /**
   * Update account balances
   */
  private updateAccountBalances(): void {
    for (const [accountId, account] of this.accounts.entries()) {
      let totalValue = account.availableBalance;

      // Add value of positions
      for (const [symbol, amount] of account.positions.entries()) {
        const price = this.prices.get(symbol);
        if (price) {
          totalValue += price * amount;
        }
      }

      // Update account
      account.balance = totalValue;
      account.pnl = totalValue - account.initialBalance;
      account.pnlPercentage = (account.pnl / account.initialBalance) * 100;
      account.lastUpdated = new Date();

      this.accounts.set(accountId, account);

      // Emit update event
      this.emit("accountUpdate", {
        accountId,
        balance: account.balance,
        pnl: account.pnl,
        pnlPercentage: account.pnlPercentage,
      });
    }
  }

  /**
   * Get account
   * @param accountId Account ID
   * @returns Account
   */
  getAccount(accountId: string): PaperAccount | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * Get all accounts
   * @returns All accounts
   */
  getAllAccounts(): PaperAccount[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get account summary
   * @param accountId Account ID
   * @returns Account summary
   */
  getAccountSummary(accountId: string): any {
    const account = this.accounts.get(accountId);
    if (!account) {
      return null;
    }

    return {
      id: account.id,
      name: account.name,
      balance: account.balance,
      initialBalance: account.initialBalance,
      availableBalance: account.availableBalance,
      pnl: account.pnl,
      pnlPercentage: account.pnlPercentage,
      positions: Array.from(account.positions.entries()).map(
        ([symbol, amount]) => ({
          symbol,
          amount,
          value: (this.prices.get(symbol) || 0) * amount,
        })
      ),
      tradeCount: account.trades.length,
      lastUpdated: account.lastUpdated,
    };
  }

  /**
   * Get account performance report
   * @param accountId Account ID
   * @returns Performance report
   */
  getPerformanceReport(accountId: string): string {
    const account = this.accounts.get(accountId);
    if (!account) {
      return "Account not found";
    }

    let report = "\n";
    report += "📊 PAPER TRADING PERFORMANCE REPORT\n";
    report += "=".repeat(50) + "\n\n";

    report += `Account: ${account.name} (${account.id})\n`;
    report += `Initial Balance: £${account.initialBalance.toFixed(2)}\n`;
    report += `Current Balance: £${account.balance.toFixed(2)}\n`;
    report += `Profit/Loss: £${account.pnl.toFixed(2)} (${account.pnlPercentage.toFixed(2)}%)\n\n`;

    report += "📈 POSITIONS:\n";
    if (account.positions.size === 0) {
      report += "No open positions\n";
    } else {
      for (const [symbol, amount] of account.positions.entries()) {
        const price = this.prices.get(symbol) || 0;
        const value = price * amount;
        report += `${symbol}: ${amount} (£${value.toFixed(2)})\n`;
      }
    }

    report += "\n📝 RECENT TRADES:\n";
    const recentTrades = account.trades.slice(-5).reverse();
    if (recentTrades.length === 0) {
      report += "No trades yet\n";
    } else {
      for (const trade of recentTrades) {
        report += `${trade.timestamp.toLocaleString()}: ${trade.side.toUpperCase()} ${trade.amount} ${trade.symbol} at £${trade.price.toFixed(2)}\n`;
      }
    }

    return report;
  }
}

export default PaperTradingMode;

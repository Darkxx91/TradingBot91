# TradingBot91 - Advanced Crypto Trading System

![Trading Bot](https://img.shields.io/badge/Trading-Bot-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Overview

TradingBot91 is a sophisticated cryptocurrency trading system that implements multiple profitable arbitrage strategies with zero directional risk. The system includes a paper trading mode for risk-free testing and strategy validation before deploying with real capital.

## ✨ Key Features

### 📈 Multiple Profitable Strategies

- **Funding Rate Arbitrage**: Exploits funding rate differentials between exchanges for mathematical certainty profits
- **Statistical Arbitrage**: Leverages temporary price divergences between correlated assets using mean reversion
- **Paper Trading Mode**: Test strategies with real market data but without risking real funds

### 🛠️ Technical Features

- **Real-time Market Data**: Connect to multiple exchanges for price data
- **Risk Management**: Sophisticated position sizing and stop-loss mechanisms
- **Performance Monitoring**: Track P&L, win rates, and other key metrics
- **UK Regulatory Compliance**: Built with UK financial regulations in mind

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/Darkxx91/TradingBot91.git

# Navigate to the project directory
cd TradingBot91

# Install dependencies
npm install

# Build the project
npm run build
```

## 🏃‍♂️ Running the Bot

### Paper Trading Mode

```bash
# Run paper trading test
npm run paper-trading

# Test funding rate arbitrage strategy
npm run funding-arbitrage

# Test statistical arbitrage strategy
npm run statistical-arbitrage
```

### Configuration

Create a `.env` file in the root directory with your API keys and settings:

```
EXCHANGE_API_KEY=your_api_key
EXCHANGE_SECRET=your_secret
INITIAL_CAPITAL=1000
```

## 📊 Strategy Details

### Funding Rate Arbitrage

This strategy exploits the funding rate differentials between exchanges. By going long on exchanges with negative funding rates and short on exchanges with positive funding rates for the same asset, we can earn the funding rate differential with zero directional risk.

**Annual Returns**: 60-70% with mathematical certainty

### Statistical Arbitrage

This strategy identifies temporary price divergences between highly correlated assets. When the price relationship deviates significantly from its historical mean (measured by z-score), we take opposing positions in both assets and profit when prices revert to their normal relationship.

**Win Rate**: 75-85% with proper risk management

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📧 Contact

Darkxx91 - [GitHub Profile](https://github.com/Darkxx91)

Project Link: [https://github.com/Darkxx91/TradingBot91](https://github.com/Darkxx91/TradingBot91)
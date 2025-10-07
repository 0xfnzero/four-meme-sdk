import { FourTrading, BuyParams, SellParams, FourTradingConfig } from '../src/fourTrading';

/**
 * Example: Buy and Sell tokens on FOUR launch platform (BSC)
 */

async function main() {
  // Configuration
  const config: FourTradingConfig = {
    rpcUrl: 'https://bsc-dataseed1.binance.org/', // BSC mainnet
    // rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/', // BSC testnet
    privateKey: process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY',
    contractAddress: '0x5c952063c7fc8610FFDB798152D69F0B9550762b',
  };

  const trading = new FourTrading(config);

  console.log('=== FOUR Trading Example ===');
  console.log(`Wallet Address: ${trading.getWalletAddress()}`);
  console.log(`BNB Balance: ${await trading.getBNBBalance()} BNB\n`);

  // Token address to trade
  const tokenAddress = '0x6d97e28527582d1be954fde04e83c8e4bbd44444';

  // ===== BUY EXAMPLE =====
  console.log('--- Buying Tokens ---');
  const buyParams: BuyParams = {
    tokenAddress: tokenAddress,
    fundsInBNB: 0.1, // Spend 0.1 BNB (可以用 number 或 string)
    minAmount: 0, // Minimum tokens to receive (0 = no slippage protection)
    gas: {
      gasLimit: 500000, // 可选：设置 gas limit
      gasPrice: 5, // 可选：设置 gas price (单位：Gwei)
      // 或者使用 EIP-1559:
      // maxFeePerGas: 10,
      // maxPriorityFeePerGas: 2,
    },
  };

  try {
    const buyResult = await trading.buyToken(buyParams);
    console.log(`✓ Buy successful: ${buyResult.txHash}\n`);
  } catch (error) {
    console.error('✗ Buy failed:', error);
  }

  // ===== SELL EXAMPLE =====
  console.log('--- Selling Tokens ---');

  // Step 1: Check token balance
  const tokenBalance = await trading.getTokenBalance(tokenAddress);
  console.log(`Token Balance: ${tokenBalance}`);

  // Step 2: Approve contract to spend tokens (only needed once)
  console.log('Approving contract to spend tokens...');
  try {
    await trading.approveToken(
      tokenAddress,
      undefined, // Max approval
      {
        gasLimit: 100000, // 可选：授权的 gas limit
        gasPrice: 5, // 可选：gas price
      }
    );
    console.log('✓ Approval successful\n');
  } catch (error) {
    console.error('✗ Approval failed:', error);
  }

  // Step 3: Sell tokens
  const sellParams: SellParams = {
    tokenAddress: tokenAddress,
    amount: 1000, // Amount of tokens to sell (可以用 number 或 string)
    bonusAmount: 0, // Bonus amount (usually 0)
    gas: {
      gasLimit: 500000, // 可选：卖出的 gas limit
      gasPrice: 5, // 可选：gas price (单位：Gwei)
    },
  };

  try {
    const sellResult = await trading.sellToken(sellParams);
    console.log(`✓ Sell successful: ${sellResult.txHash}`);
  } catch (error) {
    console.error('✗ Sell failed:', error);
  }

  // Check final balance
  console.log(`\nFinal BNB Balance: ${await trading.getBNBBalance()} BNB`);
}

// Run the example
main().catch(console.error);

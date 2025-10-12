import { FourTrading, BuyParams, SellParams, FourTradingConfig } from '../src/fourTrading';
import { ethers } from 'ethers';

/**
 * Comprehensive example: FOUR Trading Platform SDK
 * Demonstrates all major features including trading, queries, and event subscriptions
 */

async function main() {
  // Configuration
  const config: FourTradingConfig = {
    rpcUrl: 'https://bsc-dataseed.bnbchain.org', // HTTP RPC for transactions
    wssUrl: 'wss://bsc-rpc.publicnode.com', // WebSocket for event subscriptions (required)
    // Alternative endpoints:
    // rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/', // BSC testnet HTTP
    // wssUrl: 'wss://bsc-testnet-rpc.publicnode.com', // BSC testnet WebSocket
    privateKey: process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY',
    contractAddress: '0x5c952063c7fc8610FFDB798152D69F0B9550762b',
  };

  const trading = new FourTrading(config);

  console.log('=== FOUR Trading Platform SDK Example ===\n');
  console.log(`Wallet Address: ${trading.getWalletAddress()}`);
  console.log(`BNB Balance: ${await trading.getBNBBalance()} BNB\n`);

  // Token address to trade
  const tokenAddress = '0x6d97e28527582d1be954fde04e83c8e4bbd44444';

  // ==================== Event Subscription Examples ====================
  console.log('--- Setting up Event Listeners ---');

  // Listen to new token creations
  const tokenCreateListenerId = trading.onTokenCreate((event) => {
    console.log('🎉 New Token Created!');
    console.log(`  Token: ${event.token}`);
    console.log(`  Name: ${event.name}`);
    console.log(`  Symbol: ${event.symbol}`);
    console.log(`  Creator: ${event.creator}`);
    console.log(`  Total Supply: ${ethers.formatUnits(event.totalSupply, 18)}`);
    console.log(`  Launch Fee: ${ethers.formatEther(event.launchFee)} BNB\n`);
  });

  // Listen to token purchases for specific token
  const purchaseListenerId = trading.onTokenPurchase((event) => {
    console.log('💰 Token Purchase Detected!');
    console.log(`  Token: ${event.token}`);
    console.log(`  Buyer: ${event.account}`);
    console.log(`  Amount: ${ethers.formatUnits(event.amount, 18)}`);
    console.log(`  Cost: ${ethers.formatEther(event.cost)} BNB`);
    console.log(`  Fee: ${ethers.formatEther(event.fee)} BNB`);
    console.log(`  Price: ${ethers.formatUnits(event.price, 18)}\n`);
  }, tokenAddress); // Filter by token address

  // Listen to token sales
  const saleListenerId = trading.onTokenSale((event) => {
    console.log('📉 Token Sale Detected!');
    console.log(`  Token: ${event.token}`);
    console.log(`  Seller: ${event.account}`);
    console.log(`  Amount: ${ethers.formatUnits(event.amount, 18)}`);
    console.log(`  Received: ${ethers.formatEther(event.cost)} BNB`);
    console.log(`  Fee: ${ethers.formatEther(event.fee)} BNB\n`);
  }, tokenAddress);

  // Listen to liquidity additions
  const liquidityListenerId = trading.onLiquidityAdded((event) => {
    console.log('💧 Liquidity Added!');
    console.log(`  Base Token: ${event.base}`);
    console.log(`  Quote Token: ${event.quote}`);
    console.log(`  Offers: ${ethers.formatUnits(event.offers, 18)}`);
    console.log(`  Funds: ${ethers.formatEther(event.funds)} BNB\n`);
  });

  console.log('✓ Event listeners set up\n');

  // ==================== Query Platform Information ====================
  console.log('--- Platform Information ---');

  try {
    const tokenCount = await trading.getTokenCount();
    console.log(`Total Tokens: ${tokenCount}`);

    const templateCount = await trading.getTemplateCount();
    console.log(`Total Templates: ${templateCount}`);

    const tradingFeeRate = await trading.getTradingFeeRate();
    console.log(`Trading Fee Rate: ${tradingFeeRate}`);

    const launchFee = await trading.getLaunchFee();
    console.log(`Launch Fee: ${ethers.formatEther(launchFee)} BNB`);

    const feeRecipient = await trading.getFeeRecipient();
    console.log(`Fee Recipient: ${feeRecipient}`);

    const isHalted = await trading.isTradingHalted();
    console.log(`Trading Halted: ${isHalted}`);

    const statusConstants = await trading.getStatusConstants();
    console.log(`Status Constants:`, {
      TRADING: statusConstants.TRADING.toString(),
      ADDING_LIQUIDITY: statusConstants.ADDING_LIQUIDITY.toString(),
      COMPLETED: statusConstants.COMPLETED.toString(),
      HALT: statusConstants.HALT.toString(),
    });
    console.log();
  } catch (error) {
    console.error('Error querying platform info:', error);
  }

  // ==================== Query Token Information ====================
  console.log('--- Token Information ---');

  try {
    const tokenInfo = await trading.getTokenInfo(tokenAddress);
    console.log('Token Info:');
    console.log(`  Base: ${tokenInfo.base}`);
    console.log(`  Quote: ${tokenInfo.quote}`);
    console.log(`  Template: ${tokenInfo.template}`);
    console.log(`  Total Supply: ${ethers.formatUnits(tokenInfo.totalSupply, 18)}`);
    console.log(`  Max Offers: ${ethers.formatUnits(tokenInfo.maxOffers, 18)}`);
    console.log(`  Max Raising: ${ethers.formatEther(tokenInfo.maxRaising)} BNB`);
    console.log(`  Launch Time: ${new Date(Number(tokenInfo.launchTime) * 1000).toISOString()}`);
    console.log(`  Current Offers: ${ethers.formatUnits(tokenInfo.offers, 18)}`);
    console.log(`  Current Funds: ${ethers.formatEther(tokenInfo.funds)} BNB`);
    console.log(`  Last Price: ${ethers.formatUnits(tokenInfo.lastPrice, 18)}`);
    console.log(`  Status: ${tokenInfo.status}\n`);

    const tokenInfoEx = await trading.getTokenInfoEx(tokenAddress);
    console.log('Token Extended Info:');
    console.log(`  Creator: ${tokenInfoEx.creator}`);
    console.log(`  Founder: ${tokenInfoEx.founder}`);
    console.log(`  Reserves: ${ethers.formatUnits(tokenInfoEx.reserves, 18)}\n`);

    // Calculate pricing
    const bnbForCalc = ethers.parseEther('0.1');
    const tokenForCalc = ethers.parseUnits('1000', 18);

    const buyAmount = await trading.calcBuyAmount(tokenInfo, bnbForCalc);
    console.log(`For 0.1 BNB, you would get: ${ethers.formatUnits(buyAmount, 18)} tokens`);

    const buyCost = await trading.calcBuyCost(tokenInfo, tokenForCalc);
    console.log(`To buy 1000 tokens, you need: ${ethers.formatEther(buyCost)} BNB`);

    const sellCost = await trading.calcSellCost(tokenInfo, tokenForCalc);
    console.log(`Selling 1000 tokens gives: ${ethers.formatEther(sellCost)} BNB`);

    const tradingFee = await trading.calcTradingFee(tokenInfo, bnbForCalc);
    console.log(`Trading fee for 0.1 BNB: ${ethers.formatEther(tradingFee)} BNB\n`);
  } catch (error) {
    console.error('Error querying token info:', error);
  }

  // ==================== Buy Token Example ====================
  console.log('--- Buying Tokens ---');

  // Convert amounts to bigint first
  const bnbToSpend = ethers.parseEther('0.01');
  const gasPrice = ethers.parseUnits('5', 'gwei');

  const buyParams: BuyParams = {
    tokenAddress: tokenAddress,
    fundsInBNB: bnbToSpend,
    minAmount: 0n, // Minimum tokens to receive (0 = no slippage protection)
    gas: {
      gasLimit: 500000n,
      gasPrice: gasPrice,
    },
  };

  try {
    const buyResult = await trading.buyToken(buyParams);
    console.log(`✓ Buy successful: ${buyResult.txHash}\n`);
  } catch (error: any) {
    console.error('✗ Buy failed:', error.message, '\n');
  }

  // ==================== Sell Token Example ====================
  console.log('--- Selling Tokens ---');

  // Step 1: Check token balance
  const tokenBalance = await trading.getTokenBalance(tokenAddress);
  console.log(`Token Balance: ${tokenBalance}`);

  if (parseFloat(tokenBalance) > 0) {
    // Step 2: Approve contract to spend tokens (only needed once)
    console.log('Approving contract to spend tokens...');

    const approvalGasPrice = ethers.parseUnits('5', 'gwei');

    try {
      await trading.approveToken(
        tokenAddress,
        undefined, // Max approval
        {
          gasLimit: 100000n,
          gasPrice: approvalGasPrice,
        }
      );
      console.log('✓ Approval successful\n');
    } catch (error: any) {
      console.error('✗ Approval failed:', error.message, '\n');
    }

    // Step 3: Sell tokens
    const sellTokenAmount = Math.min(parseFloat(tokenBalance), 100).toString();
    const sellAmount = ethers.parseUnits(sellTokenAmount, 18);
    const sellGasPrice = ethers.parseUnits('5', 'gwei');

    const sellParams: SellParams = {
      tokenAddress: tokenAddress,
      amount: sellAmount,
      minFunds: 0n, // Minimum BNB to receive (slippage protection)
      gas: {
        gasLimit: 500000n,
        gasPrice: sellGasPrice,
      },
    };

    try {
      const sellResult = await trading.sellToken(sellParams);
      console.log(`✓ Sell successful: ${sellResult.txHash}\n`);
    } catch (error: any) {
      console.error('✗ Sell failed:', error.message, '\n');
    }
  } else {
    console.log('No tokens to sell\n');
  }

  // ==================== Query Historical Events ====================
  console.log('--- Historical Events (last 1000 blocks) ---');

  try {
    const currentBlock = await trading['provider'].getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);

    // Get recent token creations
    const tokenCreateEvents = await trading.getTokenCreateEvents(fromBlock);
    console.log(`\nRecent Token Creations: ${tokenCreateEvents.length}`);
    tokenCreateEvents.slice(0, 3).forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.name} (${event.symbol}) - ${event.token}`);
    });

    // Get recent purchases for this token
    const purchaseEvents = await trading.getTokenPurchaseEvents(tokenAddress, fromBlock);
    console.log(`\nRecent Purchases for this token: ${purchaseEvents.length}`);
    purchaseEvents.slice(0, 3).forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.account} bought ${ethers.formatUnits(event.amount, 18)} tokens`);
    });

    // Get recent sales for this token
    const saleEvents = await trading.getTokenSaleEvents(tokenAddress, fromBlock);
    console.log(`\nRecent Sales for this token: ${saleEvents.length}`);
    saleEvents.slice(0, 3).forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.account} sold ${ethers.formatUnits(event.amount, 18)} tokens`);
    });
  } catch (error) {
    console.error('Error querying historical events:', error);
  }

  // Check final balance
  console.log(`\n--- Final Balances ---`);
  console.log(`BNB Balance: ${await trading.getBNBBalance()} BNB`);
  console.log(`Token Balance: ${await trading.getTokenBalance(tokenAddress)}`);

  // Clean up event listeners
  console.log('\n--- Cleaning up ---');
  trading.off(tokenCreateListenerId);
  trading.off(purchaseListenerId);
  trading.off(saleListenerId);
  trading.off(liquidityListenerId);
  console.log('✓ Event listeners removed');

  // Or remove all listeners at once
  // trading.removeAllListeners();

  console.log('\n=== Example Complete ===');
}

// Run the example
main().catch(console.error);

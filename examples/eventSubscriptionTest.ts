import { FourTrading, FourTradingConfig } from '../src/fourTrading';
import { ethers } from 'ethers';

/**
 * Event Subscription Test - FOUR Trading Platform SDK
 * This test verifies that real-time event subscriptions work correctly
 *
 * Prerequisites:
 * - WebSocket RPC endpoint (required for real-time events)
 * - PRIVATE_KEY environment variable set
 *
 * Test Coverage:
 * 1. TokenCreate events (new token launches)
 * 2. TokenPurchase events (buy transactions)
 * 3. TokenSale events (sell transactions)
 * 4. LiquidityAdded events (liquidity pool creation)
 * 5. Event listener cleanup (memory leak prevention)
 */

async function main() {
  console.log('=== FOUR Trading Event Subscription Test ===\n');

  // Configuration (BOTH rpcUrl and wssUrl are required)
  const config: FourTradingConfig = {
    rpcUrl: 'https://bsc-dataseed.bnbchain.org', // HTTP RPC for transactions
    wssUrl: 'wss://bsc-rpc.publicnode.com', // WebSocket for event subscriptions (required)
    privateKey: process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY',
    contractAddress: '0x5c952063c7fc8610FFDB798152D69F0B9550762b',
  };

  const trading = new FourTrading(config);
  console.log(`✓ SDK initialized with WebSocket provider`);
  console.log(`  Wallet: ${trading.getWalletAddress()}`);
  console.log(`  Balance: ${await trading.getBNBBalance()} BNB\n`);

  // Event counters for testing
  let tokenCreateCount = 0;
  let tokenPurchaseCount = 0;
  let tokenSaleCount = 0;
  let liquidityAddedCount = 0;

  // ==================== Test 1: TokenCreate Events ====================
  console.log('--- Test 1: Subscribing to TokenCreate Events ---');

  const tokenCreateListenerId = trading.onTokenCreate((event) => {
    tokenCreateCount++;
    console.log(`\n🎉 [${tokenCreateCount}] New Token Created!`);
    console.log(`  Token Address: ${event.token}`);
    console.log(`  Name: ${event.name}`);
    console.log(`  Symbol: ${event.symbol}`);
    console.log(`  Creator: ${event.creator}`);
    console.log(`  Total Supply: ${ethers.formatUnits(event.totalSupply, 18)}`);
    console.log(`  Launch Time: ${new Date(Number(event.launchTime) * 1000).toISOString()}`);
    console.log(`  Launch Fee: ${ethers.formatEther(event.launchFee)} BNB`);
  });

  console.log(`✓ TokenCreate listener registered (ID: ${tokenCreateListenerId})\n`);

  // ==================== Test 2: TokenPurchase Events ====================
  console.log('--- Test 2: Subscribing to TokenPurchase Events ---');

  const purchaseListenerId = trading.onTokenPurchase((event) => {
    tokenPurchaseCount++;
    console.log(`\n💰 [${tokenPurchaseCount}] Token Purchase Detected!`);
    console.log(`  Token: ${event.token}`);
    console.log(`  Buyer: ${event.account}`);
    console.log(`  Amount: ${ethers.formatUnits(event.amount, 18)} tokens`);
    console.log(`  Cost: ${ethers.formatEther(event.cost)} BNB`);
    console.log(`  Fee: ${ethers.formatEther(event.fee)} BNB`);
    console.log(`  Price per Token: ${ethers.formatUnits(event.price, 18)} BNB`);
    console.log(`  Current Offers: ${ethers.formatUnits(event.offers, 18)}`);
    console.log(`  Current Funds: ${ethers.formatEther(event.funds)} BNB`);
  });

  console.log(`✓ TokenPurchase listener registered (ID: ${purchaseListenerId})\n`);

  // ==================== Test 3: TokenSale Events ====================
  console.log('--- Test 3: Subscribing to TokenSale Events ---');

  const saleListenerId = trading.onTokenSale((event) => {
    tokenSaleCount++;
    console.log(`\n📉 [${tokenSaleCount}] Token Sale Detected!`);
    console.log(`  Token: ${event.token}`);
    console.log(`  Seller: ${event.account}`);
    console.log(`  Amount: ${ethers.formatUnits(event.amount, 18)} tokens`);
    console.log(`  Received: ${ethers.formatEther(event.cost)} BNB`);
    console.log(`  Fee: ${ethers.formatEther(event.fee)} BNB`);
    console.log(`  Price per Token: ${ethers.formatUnits(event.price, 18)} BNB`);
    console.log(`  Current Offers: ${ethers.formatUnits(event.offers, 18)}`);
    console.log(`  Current Funds: ${ethers.formatEther(event.funds)} BNB`);
  });

  console.log(`✓ TokenSale listener registered (ID: ${saleListenerId})\n`);

  // ==================== Test 4: LiquidityAdded Events ====================
  console.log('--- Test 4: Subscribing to LiquidityAdded Events ---');

  const liquidityListenerId = trading.onLiquidityAdded((event) => {
    liquidityAddedCount++;
    console.log(`\n💧 [${liquidityAddedCount}] Liquidity Added!`);
    console.log(`  Base Token: ${event.base}`);
    console.log(`  Quote Token: ${event.quote}`);
    console.log(`  Token Offers: ${ethers.formatUnits(event.offers, 18)}`);
    console.log(`  BNB Funds: ${ethers.formatEther(event.funds)}`);
  });

  console.log(`✓ LiquidityAdded listener registered (ID: ${liquidityListenerId})\n`);

  // ==================== Monitor Events ====================
  console.log('--- Monitoring Events (press Ctrl+C to stop) ---');
  console.log('Listening for real-time events on BSC mainnet...\n');

  // Print status every 30 seconds
  const statusInterval = setInterval(() => {
    console.log(`\n--- Status Update ---`);
    console.log(`  TokenCreate events: ${tokenCreateCount}`);
    console.log(`  TokenPurchase events: ${tokenPurchaseCount}`);
    console.log(`  TokenSale events: ${tokenSaleCount}`);
    console.log(`  LiquidityAdded events: ${liquidityAddedCount}`);
    console.log(`  Total events: ${tokenCreateCount + tokenPurchaseCount + tokenSaleCount + liquidityAddedCount}`);
    console.log(`  Time: ${new Date().toISOString()}\n`);
  }, 30000);

  // ==================== Cleanup Handler ====================
  process.on('SIGINT', async () => {
    console.log('\n\n--- Cleaning Up ---');
    clearInterval(statusInterval);

    // Test listener removal (prevents memory leaks)
    console.log('Removing event listeners...');
    trading.off(tokenCreateListenerId);
    trading.off(purchaseListenerId);
    trading.off(saleListenerId);
    trading.off(liquidityListenerId);
    console.log('✓ All listeners removed');

    // Final statistics
    console.log('\n--- Final Statistics ---');
    console.log(`  TokenCreate events: ${tokenCreateCount}`);
    console.log(`  TokenPurchase events: ${tokenPurchaseCount}`);
    console.log(`  TokenSale events: ${tokenSaleCount}`);
    console.log(`  LiquidityAdded events: ${liquidityAddedCount}`);
    console.log(`  Total events captured: ${tokenCreateCount + tokenPurchaseCount + tokenSaleCount + liquidityAddedCount}`);

    console.log('\n=== Test Complete ===');
    process.exit(0);
  });

  // ==================== Test 5: Historical Events Query ====================
  console.log('--- Test 5: Querying Historical Events (last 1000 blocks) ---');

  try {
    const provider = (trading as any).provider;
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);

    console.log(`  Current block: ${currentBlock}`);
    console.log(`  Query range: ${fromBlock} → ${currentBlock}\n`);

    // Get historical TokenCreate events
    const historicalCreates = await trading.getTokenCreateEvents(fromBlock);
    console.log(`  Historical TokenCreate events: ${historicalCreates.length}`);
    if (historicalCreates.length > 0) {
      console.log(`  Latest token: ${historicalCreates[historicalCreates.length - 1].name} (${historicalCreates[historicalCreates.length - 1].symbol})`);
    }

    // Get historical TokenPurchase events
    const historicalPurchases = await trading.getTokenPurchaseEvents(undefined, fromBlock);
    console.log(`  Historical TokenPurchase events: ${historicalPurchases.length}`);

    // Get historical TokenSale events
    const historicalSales = await trading.getTokenSaleEvents(undefined, fromBlock);
    console.log(`  Historical TokenSale events: ${historicalSales.length}`);

    console.log('\n✓ Historical events query successful\n');
  } catch (error: any) {
    console.error('✗ Historical events query failed:', error.message);
  }

  // ==================== Test 6: Filtered Event Subscription ====================
  console.log('--- Test 6: Testing Token-Specific Event Filter ---');

  // Get a recent token to filter by
  try {
    const provider = (trading as any).provider;
    const currentBlock = await provider.getBlockNumber();
    const recentCreates = await trading.getTokenCreateEvents(Math.max(0, currentBlock - 1000));

    if (recentCreates.length > 0) {
      const testToken = recentCreates[recentCreates.length - 1].token;
      console.log(`  Monitoring token: ${testToken}`);

      let filteredPurchaseCount = 0;
      const filteredPurchaseId = trading.onTokenPurchase((event) => {
        filteredPurchaseCount++;
        console.log(`\n💎 [Filtered ${filteredPurchaseCount}] Purchase for monitored token!`);
        console.log(`  Buyer: ${event.account}`);
        console.log(`  Amount: ${ethers.formatUnits(event.amount, 18)} tokens`);
        console.log(`  Cost: ${ethers.formatEther(event.cost)} BNB`);
      }, testToken);

      console.log(`✓ Filtered TokenPurchase listener registered (ID: ${filteredPurchaseId})\n`);
    } else {
      console.log('  No recent tokens found for filtering test\n');
    }
  } catch (error: any) {
    console.error('✗ Filtered subscription setup failed:', error.message);
  }

  // Keep the process running
  console.log('Subscription test running... (press Ctrl+C to stop)\n');
}

// Run the test
main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

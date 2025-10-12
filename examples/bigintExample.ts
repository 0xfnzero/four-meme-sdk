import { FourTrading } from '../src/fourTrading';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Examples demonstrating bigint usage for precise amount handling
 *
 * Why use bigint?
 * - No precision loss for large numbers
 * - Native blockchain amount representation
 * - Type-safe calculations
 */

async function main() {
  // Initialize SDK
  const trading = new FourTrading({
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
    wssUrl: process.env.BSC_WSS_URL || 'wss://bsc-ws-node.nariox.org:443',
    privateKey: process.env.PRIVATE_KEY!,
  });

  const tokenAddress = '0x...'; // Replace with actual token address

  console.log('=== BigInt Amount Handling Examples ===\n');

  // ==================== Example 1: Using ethers.parseEther ====================
  console.log('1. Recommended: Use ethers.parseEther for amounts:');

  // Convert from BNB string to wei bigint
  const oneBNB = ethers.parseEther('1');
  const pointOneBNB = ethers.parseEther('0.1');
  const preciseAmount = ethers.parseEther('0.123456789012345678');

  console.log(`1 BNB in wei: ${oneBNB}`);
  console.log(`0.1 BNB in wei: ${pointOneBNB}`);
  console.log(`Precise amount: ${preciseAmount}\n`);

  // ==================== Example 2: Buy with bigint ====================
  console.log('2. Buying tokens with bigint amounts:');

  try {
    const minTokens = ethers.parseUnits('1', 18);

    const result = await trading.buyToken({
      tokenAddress,
      fundsInBNB: preciseAmount,
      minAmount: minTokens,
    });
    console.log(`Transaction: ${result.txHash}\n`);
  } catch (error) {
    console.error('Buy failed:', error);
  }

  // ==================== Example 3: Converting between types ====================
  console.log('3. Converting between number/string/bigint:');

  // From string to bigint
  const fromString = ethers.parseEther('1.5'); // Returns bigint
  console.log(`From string "1.5": ${fromString} (type: ${typeof fromString})`);

  // From number to bigint (safe for small numbers)
  const fromNumber = ethers.parseEther('0.1');
  console.log(`From number 0.1: ${fromNumber} (type: ${typeof fromNumber})`);

  // From bigint to string (for display)
  const backToString = ethers.formatEther(fromString);
  console.log(`Back to string: ${backToString} BNB\n`);

  // ==================== Example 4: Safe calculations with bigint ====================
  console.log('4. Safe calculations with bigint:');

  const price = 1234567890123456n;
  const quantity = 1000n;

  // Multiply (no precision loss)
  const totalCost = price * quantity;
  console.log(`Price: ${price}`);
  console.log(`Quantity: ${quantity}`);
  console.log(`Total: ${totalCost}`);

  // Division (truncates, use carefully)
  const avgPrice = totalCost / quantity;
  console.log(`Average: ${avgPrice}\n`);

  // ==================== Example 5: Quote with bigint ====================
  console.log('5. Getting quotes with bigint:');

  try {
    const buyQuote = await trading.quoteBuy(
      tokenAddress,
      oneBNB // Using bigint for precise quote
    );

    console.log('Buy Quote:');
    console.log(`  Token amount: ${buyQuote.tokenAmount}`);
    console.log(`  BNB cost: ${buyQuote.bnbCost}`);
    console.log(`  Price per token: ${buyQuote.pricePerToken}\n`);
  } catch (error) {
    console.error('Quote failed:', error);
  }

  // ==================== Example 6: Slippage calculation ====================
  console.log('6. Slippage protection with bigint:');

  try {
    const slippage = await trading.calculateBuyWithSlippage(
      tokenAddress,
      pointOneBNB, // 0.1 BNB as bigint
      1 // 1% slippage
    );

    console.log('Slippage Calculation:');
    console.log(`  Estimated tokens: ${slippage.estimatedTokenAmount}`);
    console.log(`  Minimum tokens: ${slippage.minTokenAmount}`);
    console.log(`  Price per token: ${slippage.pricePerToken}\n`);
  } catch (error) {
    console.error('Slippage calc failed:', error);
  }

  // ==================== Example 7: Sell with bigint ====================
  console.log('7. Selling tokens with bigint:');

  const tokenAmount = ethers.parseUnits('5', 18); // 5 tokens
  const minBNB = ethers.parseEther('0.1'); // 0.1 BNB minimum

  try {
    // First approve
    await trading.approveToken(tokenAddress, tokenAmount);

    // Then sell
    const sellResult = await trading.sellToken({
      tokenAddress,
      amount: tokenAmount,
      minFunds: minBNB,
    });

    console.log(`Sell transaction: ${sellResult.txHash}\n`);
  } catch (error) {
    console.error('Sell failed:', error);
  }

  // ==================== Example 8: Gas options with bigint ====================
  console.log('8. Setting gas with bigint:');

  try {
    const gasLimit = 500000n;
    const gasPrice = ethers.parseUnits('5', 'gwei');

    const result = await trading.buyToken({
      tokenAddress,
      fundsInBNB: pointOneBNB,
      gas: {
        gasLimit: gasLimit,
        gasPrice: gasPrice,
      },
    });

    console.log(`Transaction with custom gas: ${result.txHash}\n`);
  } catch (error) {
    console.error('Transaction failed:', error);
  }

  // ==================== Example 9: Working with event amounts ====================
  console.log('9. Processing event amounts (bigint):');

  const listenerId = trading.onTokenPurchase((event) => {
    // All event amounts are bigint
    console.log('Purchase Event:');
    console.log(`  Token: ${event.token}`);
    console.log(`  Account: ${event.account}`);
    console.log(`  Amount: ${event.amount} (bigint)`);
    console.log(`  Cost: ${event.cost} (bigint)`);
    console.log(`  Price: ${event.price} (bigint)`);

    // Convert to readable format
    console.log(`  Amount (formatted): ${ethers.formatUnits(event.amount, 18)} tokens`);
    console.log(`  Cost (formatted): ${ethers.formatEther(event.cost)} BNB`);
  }, tokenAddress);

  // ==================== Example 10: Comparison - number vs bigint ====================
  console.log('10. Why bigint matters - comparison:');

  // ❌ WRONG: Using number for large amounts (precision loss)
  const largeNumber = 1234567890123456789; // 19 digits
  console.log(`Large number: ${largeNumber}`); // Will lose precision!
  console.log(`Is precise? ${largeNumber === 1234567890123456789}`); // false!

  // ✅ CORRECT: Using bigint (no precision loss)
  const largeBigInt = 1234567890123456789n;
  console.log(`Large bigint: ${largeBigInt}`);
  console.log(`Is precise? ${largeBigInt === 1234567890123456789n}`); // true!

  // ❌ WRONG: Decimal number precision issues
  const decimal = 0.1 + 0.2;
  console.log(`0.1 + 0.2 = ${decimal}`); // 0.30000000000000004

  // ✅ CORRECT: Use wei amounts with bigint
  const weiAmount1 = ethers.parseEther('0.1');
  const weiAmount2 = ethers.parseEther('0.2');
  const weiSum = weiAmount1 + weiAmount2;
  console.log(`0.1 + 0.2 = ${ethers.formatEther(weiSum)} BNB`); // 0.3

  console.log('\n=== Examples completed ===');

  // Cleanup
  trading.off(listenerId);
  trading.removeAllListeners();
}

main().catch(console.error);

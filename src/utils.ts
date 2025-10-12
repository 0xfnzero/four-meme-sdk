import { ethers, TransactionReceipt, TransactionResponse } from 'ethers';
import { TokenCreateEvent, TokenPurchaseEvent, TokenSaleEvent } from './types';

/**
 * Utility functions for transaction and event parsing
 */

export const FOUR_MEME_ADDRESS = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';
export const TOKEN_CREATE_TOPIC = '0x396d5e902b675b032348d3d2e9517ee8f0c4a926603fbc075d3d282ff00cad20';
export const ADD_LIQUIDITY_SIGNATURE = '0xe3412e3d';
export const CREATE_TOKEN_SIGNATURE = '0x519ebb10';

/**
 * Parse transaction receipt for trading events
 */
export async function parseTradeEvents(
  receipt: TransactionReceipt,
  contract: ethers.Contract
): Promise<{
  purchases: TokenPurchaseEvent[];
  sales: TokenSaleEvent[];
}> {
  const purchases: TokenPurchaseEvent[] = [];
  const sales: TokenSaleEvent[] = [];

  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      if (!parsedLog) {
        continue;
      }

      if (parsedLog.name === 'TokenPurchase') {
        purchases.push({
          token: parsedLog.args.token,
          account: parsedLog.args.account,
          price: parsedLog.args.price,
          amount: parsedLog.args.amount,
          cost: parsedLog.args.cost,
          fee: parsedLog.args.fee,
          offers: parsedLog.args.offers,
          funds: parsedLog.args.funds,
        });
      } else if (parsedLog.name === 'TokenSale') {
        sales.push({
          token: parsedLog.args.token,
          account: parsedLog.args.account,
          price: parsedLog.args.price,
          amount: parsedLog.args.amount,
          cost: parsedLog.args.cost,
          fee: parsedLog.args.fee,
          offers: parsedLog.args.offers,
          funds: parsedLog.args.funds,
        });
      }
    } catch (error) {
      // Ignore logs that can't be parsed
      continue;
    }
  }

  return { purchases, sales };
}

/**
 * Parse TokenCreate event from transaction receipt
 */
export async function parseTokenCreateEvent(
  receipt: TransactionReceipt,
  contract: ethers.Contract
): Promise<TokenCreateEvent | null> {
  for (const log of receipt.logs) {
    if (log.topics[0].toLowerCase() !== TOKEN_CREATE_TOPIC.toLowerCase()) {
      continue;
    }

    try {
      const parsedLog = contract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      if (!parsedLog) {
        continue;
      }

      return {
        creator: parsedLog.args.creator,
        token: parsedLog.args.token,
        requestId: parsedLog.args.requestId,
        name: parsedLog.args.name,
        symbol: parsedLog.args.symbol,
        totalSupply: parsedLog.args.totalSupply,
        launchTime: parsedLog.args.launchTime,
        launchFee: parsedLog.args.launchFee,
      };
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * Format timestamp to readable date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Format BNB amount to readable string
 */
export function formatBNB(amount: bigint): string {
  return ethers.formatEther(amount);
}

/**
 * Format token amount to readable string
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return ethers.formatUnits(amount, decimals);
}

/**
 * Parse BNB amount from string to bigint
 * @param amount - Amount in BNB as string
 * @returns Amount in wei as bigint
 */
export function parseBNB(amount: string): bigint {
  return ethers.parseEther(amount);
}

/**
 * Parse token amount from string to bigint
 * @param amount - Amount as string
 * @param decimals - Token decimals (default 18)
 * @returns Amount in smallest unit as bigint
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals);
}

/**
 * Calculate percentage change
 */
export function calculatePriceChange(oldPrice: bigint, newPrice: bigint): number {
  if (oldPrice === 0n) return 0;
  const change = ((Number(newPrice) - Number(oldPrice)) / Number(oldPrice)) * 100;
  return Math.round(change * 100) / 100;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Normalize address to lowercase
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Check if transaction is to FOUR contract
 */
export function isFourMemeTransaction(tx: TransactionResponse): boolean {
  return tx.to?.toLowerCase() === FOUR_MEME_ADDRESS.toLowerCase();
}

/**
 * Get transaction type from signature
 */
export function getTransactionType(tx: TransactionResponse): string | null {
  if (!tx.data || tx.data.length < 10) return null;

  const signature = tx.data.slice(0, 10);

  if (signature === CREATE_TOKEN_SIGNATURE) return 'createToken';
  if (signature === ADD_LIQUIDITY_SIGNATURE) return 'addLiquidity';
  if (signature === '0x87f27655') return 'buyTokenAMAP';
  if (signature === '0xe63aaf36') return 'sellToken';

  return 'unknown';
}

/**
 * Calculate gas cost in BNB
 */
export function calculateGasCost(receipt: TransactionReceipt): string {
  const gasCost = receipt.gasUsed * (receipt.gasPrice || 0n);
  return ethers.formatEther(gasCost);
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForTransaction(
  provider: ethers.Provider,
  txHash: string,
  confirmations: number = 1,
  timeout: number = 120000
): Promise<TransactionReceipt | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      const currentConfirmations = await receipt.confirmations();
      if (currentConfirmations >= confirmations) {
        return receipt;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Transaction ${txHash} timeout after ${timeout}ms`);
}

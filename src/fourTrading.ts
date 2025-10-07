import { ethers, Wallet, JsonRpcProvider } from 'ethers';

/**
 * FOUR Launch Platform Trading SDK for BSC
 * Contract: 0x5c952063c7fc8610FFDB798152D69F0B9550762b
 */

export interface FourTradingConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress?: string;
}

export interface GasOptions {
  gasLimit?: number | string; // Gas limit (default: auto estimate)
  gasPrice?: number | string; // Gas price in Gwei (default: network price)
  maxFeePerGas?: number | string; // Max fee per gas (EIP-1559, in Gwei)
  maxPriorityFeePerGas?: number | string; // Max priority fee (EIP-1559, in Gwei)
}

export interface BuyParams {
  tokenAddress: string;
  fundsInBNB: number | string; // Amount of BNB to spend
  minAmount?: number | string; // Minimum tokens to receive (slippage protection)
  gas?: GasOptions; // Gas configuration (optional)
}

export interface SellParams {
  tokenAddress: string;
  amount: number | string; // Amount of tokens to sell
  bonusAmount?: number | string; // Bonus amount (usually 0)
  gas?: GasOptions; // Gas configuration (optional)
}

export class FourTrading {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private contract: ethers.Contract;
  private contractAddress: string;

  // Contract ABI for the two methods
  private static readonly ABI = [
    'function buyTokenAMAP(address token, uint256 funds, uint256 minAmount) payable',
    'function sellToken(address to_, uint256 amount, uint256 bonusAmount)',
  ];

  constructor(config: FourTradingConfig) {
    this.contractAddress = config.contractAddress || '0x5c952063c7fc8610FFDB798152D69F0B9550762b';
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.wallet = new Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      this.contractAddress,
      FourTrading.ABI,
      this.wallet
    );
  }

  /**
   * Build transaction options from gas configuration
   */
  private buildTxOptions(gas?: GasOptions, value?: bigint): any {
    const options: any = {};

    if (value !== undefined) {
      options.value = value;
    }

    if (gas) {
      // Gas limit
      if (gas.gasLimit) {
        options.gasLimit = BigInt(gas.gasLimit);
      }

      // Legacy gas pricing
      if (gas.gasPrice) {
        options.gasPrice = ethers.parseUnits(gas.gasPrice.toString(), 'gwei');
      }

      // EIP-1559 gas pricing
      if (gas.maxFeePerGas) {
        options.maxFeePerGas = ethers.parseUnits(gas.maxFeePerGas.toString(), 'gwei');
      }
      if (gas.maxPriorityFeePerGas) {
        options.maxPriorityFeePerGas = ethers.parseUnits(
          gas.maxPriorityFeePerGas.toString(),
          'gwei'
        );
      }
    }

    return options;
  }

  /**
   * Buy tokens using BNB
   * @param params Buy parameters
   * @returns Transaction receipt
   */
  async buyToken(params: BuyParams) {
    try {
      const fundsWei = ethers.parseEther(params.fundsInBNB.toString());
      const minAmount = params.minAmount
        ? ethers.parseUnits(params.minAmount.toString(), 18)
        : 0n;

      console.log(`Buying token ${params.tokenAddress}`);
      console.log(`Spending: ${params.fundsInBNB} BNB`);
      console.log(`Min tokens: ${params.minAmount || 0}`);

      // Build transaction options with user's gas settings
      const txOptions = this.buildTxOptions(params.gas, fundsWei);

      // Call buyTokenAMAP with BNB value
      const tx = await this.contract.buyTokenAMAP(
        params.tokenAddress,
        fundsWei,
        minAmount,
        txOptions
      );

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Buy transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Sell tokens for BNB
   * @param params Sell parameters
   * @returns Transaction receipt
   */
  async sellToken(params: SellParams) {
    try {
      const amount = ethers.parseUnits(params.amount.toString(), 18);
      const bonusAmount = params.bonusAmount
        ? ethers.parseUnits(params.bonusAmount.toString(), 18)
        : 0n;

      console.log(`Selling token ${params.tokenAddress}`);
      console.log(`Amount: ${params.amount}`);
      console.log(`Bonus: ${params.bonusAmount || 0}`);

      // Build transaction options with user's gas settings
      const txOptions = this.buildTxOptions(params.gas);

      // Before selling, need to approve the contract to spend tokens
      // You may need to call approve on the token contract first

      const tx = await this.contract.sellToken(
        params.tokenAddress,
        amount,
        bonusAmount,
        txOptions
      );

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Sell transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Approve token spending before selling
   * @param tokenAddress Token contract address
   * @param amount Amount to approve (use max for unlimited)
   * @param gas Gas configuration (optional)
   */
  async approveToken(
    tokenAddress: string,
    amount?: number | string,
    gas?: GasOptions
  ) {
    try {
      const tokenABI = ['function approve(address spender, uint256 amount) returns (bool)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.wallet);

      const approveAmount = amount
        ? ethers.parseUnits(amount.toString(), 18)
        : ethers.MaxUint256; // Max approval

      console.log(`Approving ${this.contractAddress} to spend tokens`);

      // Build transaction options with user's gas settings
      const txOptions = this.buildTxOptions(gas);

      const tx = await tokenContract.approve(this.contractAddress, approveAmount, txOptions);

      console.log(`Approval transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Approval confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Approval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get BNB balance of wallet
   */
  async getBNBBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Get token balance of wallet
   */
  async getTokenBalance(tokenAddress: string): Promise<string> {
    const tokenABI = ['function balanceOf(address owner) view returns (uint256)'];
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.provider);
    const balance = await tokenContract.balanceOf(this.wallet.address);
    return ethers.formatUnits(balance, 18);
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }
}


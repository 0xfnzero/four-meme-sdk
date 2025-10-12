//! Fourmeme 交易器

use ethers::prelude::*;
use std::sync::Arc;
use crate::trading::types::{TokenInfo, TradeResult, TradeType, PriceInfo};
use crate::trading::price::PriceCalculator;
use crate::trading::abi;
use crate::FOURMEME_CONTRACT;
use anyhow::Result;

/// Fourmeme 交易器
pub struct FourmemeTrader {
    contract: Arc<Contract<SignerMiddleware<Provider<Ws>, LocalWallet>>>,
    calculator: PriceCalculator,
}

impl FourmemeTrader {
    /// 创建交易器（直接从 Provider 创建，无需传入 ABI）
    pub fn new(
        provider: Arc<Provider<Ws>>,
        private_key: &str,
    ) -> Result<Self> {
        let wallet: LocalWallet = private_key.parse::<LocalWallet>()?
            .with_chain_id(56u64); // BSC chain ID
        
        // 创建带签名的客户端
        let client = SignerMiddleware::new((*provider).clone(), wallet.clone());
        let client = Arc::new(client);
        
        // 使用内置的 ABI
        let abi: ethers::abi::Abi = serde_json::from_str(abi::get_trading_abi())?;
        let fourmeme_address: Address = FOURMEME_CONTRACT.parse()?;
        
        // 创建查询用的合约（用原始 provider，不需要签名）
        let query_contract = Arc::new(Contract::new(fourmeme_address, abi.clone(), provider));
        let calculator = PriceCalculator::new(query_contract);
        
        // 创建交易用的合约（用 SignerMiddleware，可以签名发送交易）
        let contract = Arc::new(Contract::new(fourmeme_address, abi, client));

        Ok(Self {
            contract,
            calculator,
        })
    }

    /// 查询代币信息
    pub async fn get_token_info(&self, token: Address) -> Result<TokenInfo> {
        self.calculator.get_token_info(token).await
    }

    /// 查询买入价格
    pub async fn quote_buy(&self, token: Address, bnb_amount: U256) -> Result<PriceInfo> {
        self.calculator.quote_buy(token, bnb_amount).await
    }

    /// 查询卖出价格
    pub async fn quote_sell(&self, token: Address, token_amount: U256) -> Result<PriceInfo> {
        self.calculator.quote_sell(token, token_amount).await
    }

    /// 买入代币（用 BNB 买尽可能多的代币）
    /// 
    /// # 参数
    /// - `token`: 代币地址
    /// - `bnb_amount`: 要花费的 BNB 数量（wei）
    /// - `slippage`: 滑点百分比（例如 1.0 表示 1%）
    /// 
    /// # 返回
    /// 交易结果
    pub async fn buy(
        &self,
        token: Address,
        bnb_amount: U256,
        slippage: f64,
    ) -> Result<TradeResult> {
        // 1. 查询价格
        let price_info = self.quote_buy(token, bnb_amount).await?;
        
        // 2. 计算最小输出（滑点保护）
        let min_amount = (price_info.token_amount.as_u128() as f64 * (100.0 - slippage) / 100.0) as u128;
        let min_amount = U256::from(min_amount);

        // 3. 构造交易
        let tx = self.contract
            .method::<_, ()>("buyTokenAMAP", (token, self.address(), bnb_amount, min_amount))?
            .value(bnb_amount);

        // 4. 估算 Gas 并发送交易
        let gas = tx.estimate_gas().await?;
        let tx_with_gas = tx.gas(gas);
        let pending_tx = tx_with_gas.send().await?;
        let receipt = pending_tx.await?.ok_or_else(|| anyhow::anyhow!("Transaction failed"))?;

        // 6. 返回结果
        Ok(TradeResult {
            tx_hash: format!("{:?}", receipt.transaction_hash),
            trade_type: TradeType::Buy,
            token,
            amount: price_info.token_amount,
            cost: bnb_amount,
            price: price_info.price_per_token,
        })
    }

    /// 卖出代币
    /// 
    /// # 参数
    /// - `token`: 代币地址
    /// - `amount`: 要卖出的代币数量（wei）
    /// - `slippage`: 滑点百分比（例如 1.0 表示 1%）
    /// 
    /// # 返回
    /// 交易结果
    pub async fn sell(
        &self,
        token: Address,
        amount: U256,
        slippage: f64,
    ) -> Result<TradeResult> {
        // 1. 查询价格
        let price_info = self.quote_sell(token, amount).await?;
        
        // 2. 计算最小收益（滑点保护）
        let min_funds = (price_info.bnb_cost.as_u128() as f64 * (100.0 - slippage) / 100.0) as u128;
        let min_funds = U256::from(min_funds);

        // 3. 构造交易
        let tx = self.contract
            .method::<_, ()>("sellToken", (token, amount, min_funds))?;

        // 4. 估算 Gas 并发送交易
        let gas = tx.estimate_gas().await?;
        let tx_with_gas = tx.gas(gas);
        let pending_tx = tx_with_gas.send().await?;
        let receipt = pending_tx.await?.ok_or_else(|| anyhow::anyhow!("Transaction failed"))?;

        // 6. 返回结果
        Ok(TradeResult {
            tx_hash: format!("{:?}", receipt.transaction_hash),
            trade_type: TradeType::Sell,
            token,
            amount,
            cost: price_info.bnb_cost,
            price: price_info.price_per_token,
        })
    }

    /// 买入指定数量的代币
    pub async fn buy_exact_amount(
        &self,
        token: Address,
        token_amount: U256,
        slippage: f64,
    ) -> Result<TradeResult> {
        // 1. 计算需要的 BNB
        let token_info = self.get_token_info(token).await?;
        let price_info = self.calculator.calc_buy_cost(&token_info, token_amount).await?;
        
        // 2. 计算最大花费（滑点保护）
        let max_funds = (price_info.bnb_cost.as_u128() as f64 * (100.0 + slippage) / 100.0) as u128;
        let max_funds = U256::from(max_funds);

        // 3. 构造交易
        let tx = self.contract
            .method::<_, ()>("buyToken", (token, token_amount, max_funds))?
            .value(max_funds);

        // 4. 估算 Gas 并发送交易
        let gas = tx.estimate_gas().await?;
        let tx_with_gas = tx.gas(gas);
        let pending_tx = tx_with_gas.send().await?;
        let receipt = pending_tx.await?.ok_or_else(|| anyhow::anyhow!("Transaction failed"))?;

        // 6. 返回结果
        Ok(TradeResult {
            tx_hash: format!("{:?}", receipt.transaction_hash),
            trade_type: TradeType::Buy,
            token,
            amount: token_amount,
            cost: price_info.bnb_cost,
            price: price_info.price_per_token,
        })
    }

    /// 授权代币给 Fourmeme 合约（卖出前必须调用）
    pub async fn approve_token(&self, token: Address, provider: Arc<Provider<Ws>>) -> Result<String> {
        // 使用 ERC20 ABI
        let erc20_abi = r#"[
            {
                "inputs": [
                    {"name": "spender", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]"#;
        
        let abi: ethers::abi::Abi = serde_json::from_str(erc20_abi)?;
        
        // 创建签名客户端
        let wallet = self.contract.client().signer().clone();
        let client = SignerMiddleware::new((*provider).clone(), wallet);
        let token_contract = Contract::new(token, abi, Arc::new(client));
        
        // 无限授权给 Fourmeme 合约
        let fourmeme_address: Address = FOURMEME_CONTRACT.parse()?;
        let max_amount = U256::MAX;
        
        let tx = token_contract
            .method::<_, bool>("approve", (fourmeme_address, max_amount))?;
        
        let gas = tx.estimate_gas().await?;
        let tx_with_gas = tx.gas(gas);
        let pending_tx = tx_with_gas.send().await?;
        let receipt = pending_tx.await?.ok_or_else(|| anyhow::anyhow!("Approve failed"))?;
        
        Ok(format!("{:?}", receipt.transaction_hash))
    }

    /// 获取钱包地址
    pub fn address(&self) -> Address {
        // 从合约的 client 中获取地址
        self.contract.client().address()
    }
}


import { ethers, TransactionResponse } from 'ethers';
import { CreateInfo, LaunchInfo, TradeInfo } from '../base/interface';
import { PrintMainLog, PrintTradeLog, formatErrorWithStack } from '../base/log.util';
import { formatTimestamp } from '../base/utils';

let provider: ethers.Provider = new ethers.WebSocketProvider('wss://bsc-rpc.publicnode.com');
const fourMeme = '0x5c952063c7fc8610FFDB798152D69F0B9550762b'.toLowerCase();
const addLiquiditySign = '0xe3412e3d';
const createTokenSign = '0x519ebb10';
const tokenCreateTopic = '0x396d5e902b675b032348d3d2e9517ee8f0c4a926603fbc075d3d282ff00cad20'.toLowerCase();
const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const buySignSet = new Set(['0x87f27655', '0x87f27655', '0x819512cd', '0x43fc3523', '0x7f79f6df', '0xe671499b', '0x7771fdb0']);
const sellSignSet = new Set(['0xe63aaf36', '0x3e11741f', '0xf464e7db', '0x0da74935', '0x06e7b98f']);

const FOUR_TOKEN_MANAGER_ABI = [
    "function _tokenInfos(address) view returns (address base, address quote, uint256 template, uint256 totalSupply, uint256 maxOffers, uint256 maxRaising, uint256 launchTime, uint256 offers, uint256 funds, uint256 lastPrice, uint256 K, uint256 T, uint256 status)",
    "event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)",
    "event TokenPurchase(address token, address account, uint256 price, uint256 amount, uint256 cost, uint256 fee, uint256 offers, uint256 funds)",
    "event TokenSale(address token, address account, uint256 price, uint256 amount, uint256 cost, uint256 fee, uint256 offers, uint256 funds)"
]

let trade_id = 0;
export let currentBlockNumber = 0; 
export function initTradeId(max_trade_id: number) {
    PrintMainLog('初始化交易ID: ', max_trade_id);
    trade_id = max_trade_id + 1;
}

export function initProvider(new_provider: ethers.Provider) {
    provider = new_provider;
}

export function getProvider(){
    return provider;
}

export function setCurrentBlockNumber(blockNumber: number) {
    currentBlockNumber = blockNumber;
}

export async function checkTxn(txn: TransactionResponse, time_stamp: number): Promise<[CreateInfo[], LaunchInfo[], TradeInfo[]]> {
    if (!txn.to) {
        return [[], [], []];
    }
    const create_infos: CreateInfo[] = [];
    const launch_infos: LaunchInfo[] = [];
    const trade_infos: TradeInfo[] = [];
    try {
        const sign = txn.data.slice(0, 10);
        const time_stamp_date = formatTimestamp(time_stamp);
        if (sign === addLiquiditySign) {
            launch_infos.push(... await checkAddLiquidityTxn(txn, time_stamp, time_stamp_date));
        }
        else if (sign === createTokenSign) {
            create_infos.push(... await checkCreateTokenTxn(txn, time_stamp, time_stamp_date));
        }
        trade_infos.push(... await checkMemeSwap(txn.hash, time_stamp, time_stamp_date));
    } catch (error) {
        PrintMainLog('检查交易失败: ', formatErrorWithStack(error));
    }
    return [create_infos, launch_infos, trade_infos];
}

async function checkMemeSwap(hash: string, time_stamp: number, time_stamp_date: string): Promise<TradeInfo[]> {
    const txnR = await provider.getTransactionReceipt(hash);
    if (!txnR) {
        PrintMainLog('交易未找到');
        return [];
    }

    const trades: TradeInfo[] = [];

    const fourMemeContract = new ethers.Contract(fourMeme, FOUR_TOKEN_MANAGER_ABI, provider);

    let is_bind = false;

    for (let log of txnR.logs) {
        try {
            const parsedLog = fourMemeContract.interface.parseLog({
                topics: log.topics,
                data: log.data
            });

            if (!parsedLog) {
                continue;
            }

            // 检测购买事件
            if (parsedLog.name === 'TokenPurchase') {
                PrintTradeLog(`区块: ${txnR.blockNumber}, 延迟: ${(Math.round(Date.now() - time_stamp * 1000))}毫秒, 签名: ${hash}, 代币购买: ${parsedLog.args.token}, 购买者: ${parsedLog.args.account}, 价格: ${ethers.formatEther(parsedLog.args.price)}, 购买数量: ${ethers.formatEther(parsedLog.args.amount)}, 花费: ${ethers.formatEther(parsedLog.args.cost)}`);
                trades.push({
                    trade_id: trade_id++,
                    time_stamp_date: time_stamp_date,
                    platform: 'fourmeme',
                    is_buy: true,
                    is_launch: false,
                    is_bind: is_bind,
                    price: Number(ethers.formatEther(parsedLog.args.price)),
                    signature: hash,
                    mint: parsedLog.args.token.toLowerCase(),
                    slot: txnR.blockNumber,
                    time_stamp: time_stamp,
                    user: parsedLog.args.account.toLowerCase(),
                    main_amount: Number(ethers.formatEther(parsedLog.args.cost)),
                    token_amount: Number(ethers.formatEther(parsedLog.args.amount)),
                });
                is_bind = true;
            }
            // 检测出售事件
            else if (parsedLog.name === 'TokenSale') {
                PrintTradeLog(`区块: ${txnR.blockNumber}, 延迟: ${(Math.round(Date.now() - time_stamp * 1000))}毫秒, 签名: ${hash}, 代币出售: ${parsedLog.args.token}, 出售者: ${parsedLog.args.account}, 价格: ${ethers.formatEther(parsedLog.args.price)}, 出售数量: ${ethers.formatEther(parsedLog.args.amount)}, 获得: ${ethers.formatEther(parsedLog.args.cost)}`);
                trades.push({
                    trade_id: trade_id++,
                    time_stamp_date: time_stamp_date,
                    platform: 'fourmeme',
                    is_buy: false,
                    is_launch: false,
                    is_bind: is_bind,
                    price: Number(ethers.formatEther(parsedLog.args.price)),
                    signature: hash,
                    mint: parsedLog.args.token.toLowerCase(),
                    slot: txnR.blockNumber,
                    time_stamp: time_stamp,
                    user: parsedLog.args.account.toLowerCase(),
                    main_amount: Number(ethers.formatEther(parsedLog.args.cost)),
                    token_amount: Number(ethers.formatEther(parsedLog.args.amount)),
                });
                is_bind = true;
            }
        } catch (error) {
            // 忽略无法解析的日志
            continue;
        }
    }
    if (trades.length > 1) {
        trades[0].is_bind = true;
    }
    return trades;
}

async function checkCreateTokenTxn(txn: TransactionResponse, time_stamp: number, time_stamp_date: string): Promise<CreateInfo[]> {
    const hash = txn.hash;
    const txnR = await provider.getTransactionReceipt(hash);
    if (!txnR) {
        PrintMainLog('交易未找到');
        return [];
    }
    const create_infos: CreateInfo[] = [];

    const fourMemeContract = new ethers.Contract(fourMeme, FOUR_TOKEN_MANAGER_ABI, provider);
    for (let log of txnR.logs) {
        if (log.topics[0] !== tokenCreateTopic) {
            continue;
        }
        const parsedLog = fourMemeContract.interface.parseLog({
            topics: log.topics,
            data: log.data
        });
        if (!parsedLog) {
            PrintMainLog('无法解析日志: ', log);
            continue;
        }

        PrintTradeLog(`区块: ${txn.blockNumber}, 延迟: ${(Math.round(Date.now() - time_stamp * 1000))}毫秒, 签名: ${hash}, 代币创建: ${parsedLog.args.token}, 代币名称: ${parsedLog.args.name}, 代币符号: ${parsedLog.args.symbol}, 总供应量: ${ethers.formatEther(parsedLog.args.totalSupply)}`);
        create_infos.push({
            time_stamp_date: time_stamp_date,
            platform: 'fourmeme',
            signature: hash,
            mint: parsedLog.args.token.toLowerCase(),
            slot: txn.blockNumber,
            time_stamp: time_stamp,
            symbol: parsedLog.args.symbol,
            name: parsedLog.args.name,
            user: parsedLog.args.creator.toLowerCase(),
            initial_token_amount: Number(ethers.formatEther(parsedLog.args.totalSupply)),
        });
        break;
    }

    return create_infos;
}

async function checkAddLiquidityTxn(txn: TransactionResponse, time_stamp: number, time_stamp_date: string): Promise<LaunchInfo[]> {
    const data = '0x' + txn.data.slice(10);
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const result = abiCoder.decode(['address'], data);
    const launch_infos: LaunchInfo[] = [];

    PrintTradeLog(`区块: ${txn.blockNumber}, 延迟: ${(Math.round(Date.now() - time_stamp * 1000))}毫秒, 签名: ${txn.hash}, 代币发射: ${result[0]}`);
    launch_infos.push({
        time_stamp_date: time_stamp_date,
        platform: 'fourmeme',
        signature: txn.hash,
        mint: result[0].toLowerCase(),
        slot: txn.blockNumber,
        time_stamp: time_stamp,
    });

    return launch_infos;

    // PrintMainLog('检测到addLiquidity事件:');
    // PrintMainLog('代币地址:', result[0]);
    // const token = result[0];
    // const tokenInfo = await getTokenInfo(token);
    // const quote = tokenInfo.quote === ZERO_ADDRESS ? WBNB : tokenInfo.quote;
    // const pair = getPair(tokenInfo.base, quote);
    // PrintMainLog('交易对地址:', pair);
}

async function getTokenInfo(token: string) {
    const fourMemeContract = new ethers.Contract(fourMeme, FOUR_TOKEN_MANAGER_ABI, provider);
    const tokenInfo = await fourMemeContract._tokenInfos(token);

    return {
        base: tokenInfo[0],
        quote: tokenInfo[1],
        template: tokenInfo[2],
        totalSupply: tokenInfo[3],
        maxOffers: tokenInfo[4],
        maxRaising: tokenInfo[5],
        launchTime: tokenInfo[6],
        offers: tokenInfo[7],
        funds: tokenInfo[8],
        lastPrice: tokenInfo[9],
        K: tokenInfo[10],
        T: tokenInfo[11],
        status: tokenInfo[12]
    };
}

function getPair(tokenA: string, tokenB: string) {
    const INIT_CODE_HASH = '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5';
    const FACTORY_ADDRESS = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';

    const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];

    // 计算 salt (token0 和 token1 的 packed encoding 的 keccak256)
    const salt = ethers.solidityPackedKeccak256(
        ['address', 'address'],
        [token0, token1]
    );

    // 计算 pair 地址: keccak256(0xff ++ factory ++ salt ++ initCodeHash)
    return ethers.getCreate2Address(
        FACTORY_ADDRESS,
        salt,
        INIT_CODE_HASH
    );
}
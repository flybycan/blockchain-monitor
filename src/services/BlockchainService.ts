import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface SolanaStatus {
  status: 'connected' | 'disconnected' | 'error';
  blockHeight?: number;
  currentSlot?: number;
  error?: string;
  storageUsage?: number;
  transactionCount?: number;
}

export class BlockchainService {
  private solanaConnections: Connection[];
  private currentConnectionIndex: number;
  private readonly maxRetries = 3;

  constructor() {
    // 初始化多个 Solana 连接
    const endpoints = [
      'https://api.devnet.solana.com',  // Solana Devnet
      'https://api.testnet.solana.com',  // Solana Testnet
      'https://solana-api.projectserum.com'  // Project Serum 公共节点
    ];

    this.solanaConnections = endpoints.map(endpoint => 
      new Connection(endpoint, 'confirmed')
    );
    this.currentConnectionIndex = 0;
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === this.maxRetries - 1) throw error;
        
        // 切换到下一个连接
        this.currentConnectionIndex = (this.currentConnectionIndex + 1) % this.solanaConnections.length;
        console.log(`切换到下一个节点: ${this.currentConnectionIndex + 1}/${this.solanaConnections.length}`);
      }
    }
    throw new Error('所有重试都失败了');
  }

  private get currentConnection(): Connection {
    return this.solanaConnections[this.currentConnectionIndex];
  }

  // 获取 Solana 区块链状态
  async getSolanaStatus(): Promise<SolanaStatus> {
    try {
      const [blockHeight, slot, supply, performance] = await this.withRetry(async () => {
        return await Promise.all([
          this.currentConnection.getBlockHeight('finalized'),
          this.currentConnection.getSlot('finalized'),
          this.currentConnection.getSupply(),
          this.currentConnection.getRecentPerformanceSamples(1)
        ]);
      });

      // 计算存储使用情况（以 GB 为单位）
      const storageUsage = supply.total / LAMPORTS_PER_SOL * 0.001; // 估算值
      // 获取最近的交易数量
      const transactionCount = performance[0]?.numTransactions || 0;

      return {
        status: 'connected',
        blockHeight,
        currentSlot: slot,
        storageUsage,
        transactionCount
      };
    } catch (error) {
      console.error('获取 Solana 状态失败:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
}
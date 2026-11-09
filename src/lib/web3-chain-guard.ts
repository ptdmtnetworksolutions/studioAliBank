/**
 * AliBank Web3 Multi-Chain Guard & Network Synchronization Engine
 * Memastikan setiap transaksi penandatanganan smart contract (MetaMask / Trust Wallet)
 * berada di lapisan jaringan yang tepat (misalnya: Polygon Mainnet untuk ALX & USDT,
 * atau Ethereum Mainnet untuk AliBankVault) agar tidak terjadi kegagalan eksekusi
 * ataupun hilangnya aset nasabah.
 */

export interface ChainConfig {
  chainIdHex: string;
  chainIdDecimal: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  POLYGON: {
    chainIdHex: '0x89', // 137
    chainIdDecimal: 137,
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18,
    },
    rpcUrls: [
      'https://polygon-bor-rpc.publicnode.com',
      'https://1rpc.io/matic',
      'https://polygon.drpc.org',
      'https://rpc.ankr.com/polygon',
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  ETHEREUM: {
    chainIdHex: '0x1', // 1
    chainIdDecimal: 1,
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://ethereum-rpc.publicnode.com',
      'https://1rpc.io/eth',
      'https://rpc.ankr.com/eth',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
  },
};

// Alamat Smart Contract Resmi AliBank V3
export const OFFICIAL_CONTRACTS = {
  ALX_TOKEN_POLYGON: '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd',
  USDT_POLYGON: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  ALIBANK_VAULT_ETHEREUM: '0x56268032A3B3E64CFeF1916d591087CF8dF40945',
};

/**
 * Memastikan Web3 Wallet (MetaMask / Trust Wallet / Browser Provider)
 * terhubung ke rantai (chain) yang ditentukan sebelum melakukan penandatanganan.
 */
export async function ensureCorrectWeb3Chain(
  ethereum: any,
  targetChain: 'POLYGON' | 'ETHEREUM'
): Promise<{ success: boolean; activeChainId: string }> {
  if (!ethereum || typeof ethereum.request !== 'function') {
    throw new Error('Provider Web3 (MetaMask / Trust Wallet) tidak terdeteksi.');
  }

  const targetConfig = SUPPORTED_CHAINS[targetChain];
  if (!targetConfig) {
    throw new Error(`Jaringan target ${targetChain} tidak didukung.`);
  }

  // 1. Dapatkan chain ID saat ini
  const currentChainId: string = await ethereum.request({ method: 'eth_chainId' });

  if (currentChainId.toLowerCase() === targetConfig.chainIdHex.toLowerCase()) {
    return { success: true, activeChainId: currentChainId };
  }

  // 2. Minta wallet untuk berpindah jaringan (Switch Chain)
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetConfig.chainIdHex }],
    });
    return { success: true, activeChainId: targetConfig.chainIdHex };
  } catch (switchError: any) {
    // Kode 4902: Jaringan belum terdaftar di wallet pengguna
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: targetConfig.chainIdHex,
            chainName: targetConfig.chainName,
            nativeCurrency: targetConfig.nativeCurrency,
            rpcUrls: targetConfig.rpcUrls,
            blockExplorerUrls: targetConfig.blockExplorerUrls,
          },
        ],
      });
      return { success: true, activeChainId: targetConfig.chainIdHex };
    }

    throw new Error(
      `Gagal beralih ke ${targetConfig.chainName}. Harap ubah jaringan secara manual di MetaMask atau Trust Wallet Anda.`
    );
  }
}

/**
 * Validasi Alamat Tujuan Pencairan Aset
 * Mencegah pengguna memasukkan Smart Contract Token ALX sebagai alamat dompet pribadi.
 */
export function validateRecipientAddress(
  address: string,
  asset: string
): { isValid: boolean; error?: string } {
  const clean = (address || '').trim();
  if (!clean) {
    return { isValid: false, error: 'Alamat dompet tujuan tidak boleh kosong.' };
  }

  // Anti-Burn Trap: Jangan izinkan pengiriman ke contract address token ALX
  if (
    clean.toLowerCase() === OFFICIAL_CONTRACTS.ALX_TOKEN_POLYGON.toLowerCase() ||
    clean.toLowerCase() === OFFICIAL_CONTRACTS.USDT_POLYGON.toLowerCase() ||
    clean.toLowerCase() === OFFICIAL_CONTRACTS.ALIBANK_VAULT_ETHEREUM.toLowerCase()
  ) {
    return {
      isValid: false,
      error: `Alamat yang dimasukkan adalah Alamat Smart Contract resmi AliBank, bukan dompet pribadi Anda. Silakan masukkan alamat publik dompet Anda (MetaMask / Trust Wallet).`,
    };
  }

  if (asset === 'BTC') {
    const isSegwit = clean.startsWith('bc1');
    const isLegacy = clean.startsWith('1') || clean.startsWith('3');
    if (!isSegwit && !isLegacy) {
      return { isValid: false, error: 'Format alamat Bitcoin (Native SegWit bc1 atau Legacy) tidak valid.' };
    }
    return { isValid: true };
  }

  if (asset === 'SOL') {
    const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean);
    if (!isBase58) {
      return { isValid: false, error: 'Format alamat Solana (Base58) tidak valid.' };
    }
    return { isValid: true };
  }

  // EVM (ETH, ALX, USDT)
  const isEvm = /^0x[a-fA-F0-9]{40}$/.test(clean);
  if (!isEvm) {
    return { isValid: false, error: 'Format alamat dompet EVM (0x...) tidak valid.' };
  }

  return { isValid: true };
}

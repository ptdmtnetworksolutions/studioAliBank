
/**
 * @fileOverview ABI yang disinkronkan dengan Smart Contract AliBankVault milik user di Mainnet.
 * Alamat Kontrak: 0x56268032A3B3E64CFeF1916d591087CF8dF40945
 */

export const AliBankVaultABI = [
  // Read Functions
  "function owner() view returns (address)",
  "function balances(address) view returns (uint256)",
  "function depositTimestamps(address) view returns (uint256)",
  "function getTotalVaultBalance() view returns (uint256)",
  
  // Write Functions
  "function deposit() payable",
  "function withdraw(uint256 _amount) public",
  "function transferOwnership(address newOwner) public",
  
  // Events
  "event Deposited(address indexed user, uint256 amount, uint256 timestamp)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 timestamp)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
] as const;

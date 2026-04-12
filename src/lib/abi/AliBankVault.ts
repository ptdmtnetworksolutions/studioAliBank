
/**
 * @fileOverview ABI untuk AliBank Vault V3 Smart Contract.
 * Mendukung penyimpanan multi-aset dan pengelolaan likuiditas pusat.
 */

export const AliBankVaultABI = [
  // Read
  "function getVaultBalance() view returns (uint256)",
  "function owner() view returns (address)",
  "function isEmergencyPaused() view returns (bool)",
  "function totalDeposits() view returns (uint256)",
  
  // Write
  "function deposit() payable",
  "function withdraw(address to, uint256 amount) public",
  "function emergencyPause(bool status) public",
  "function transferOwnership(address newOwner) public",
  
  // Events
  "event Deposit(address indexed sender, uint256 amount, uint256 timestamp)",
  "event Withdrawal(address indexed receiver, uint256 amount, uint256 timestamp)",
  "event EmergencyStateChanged(bool paused)"
] as const;

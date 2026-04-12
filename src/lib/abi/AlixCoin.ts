
/**
 * @fileOverview ABI resmi AlixCoin (ALX) - Institutional Grade V3.1
 * Disinkronkan dengan kontrak di Polygon Mainnet: 0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd
 */

export const AlixCoinABI = [
  // Read Functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function remainingMintable() view returns (uint256)",
  "function circulationRate() view returns (uint256)",
  "function ANCHOR_PRICE_USD_CENTS() view returns (uint256)",
  "function paused() view returns (bool)",
  "function owner() view returns (address)",
  "function nonces(address owner) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  
  // Write Functions
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function pause()",
  "function unpause()",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  
  // Events
  "event TokensMinted(address indexed to, uint256 amount, uint256 newTotalSupply)",
  "event TokensBurned(address indexed from, uint256 amount, uint256 newTotalSupply)",
  "event EmergencyPause(address indexed triggeredBy, uint256 timestamp)",
  "event EmergencyUnpause(address indexed triggeredBy, uint256 timestamp)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
] as const;

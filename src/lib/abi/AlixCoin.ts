
export const AlixCoinABI = [
  // Read Functions
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function remainingMintable() view returns (uint256)",
  "function circulationRate() view returns (uint256)",
  "function paused() view returns (bool)",
  "function owner() view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  
  // Write Functions
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function pause()",
  "function unpause()",
  
  // Events
  "event TokensMinted(address indexed to, uint256 amount, uint256 newTotalSupply)",
  "event TokensBurned(address indexed from, uint256 amount, uint256 newTotalSupply)",
  "event EmergencyPause(address indexed triggeredBy, uint256 timestamp)",
  "event EmergencyUnpause(address indexed triggeredBy, uint256 timestamp)",
] as const;

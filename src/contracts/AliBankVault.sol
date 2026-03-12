// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AliBankVault V3
 * @dev Brankas Terpusat AliBank dengan Keamanan Berlapis (Reentrancy Guard & Ownership Validation).
 * Dikembangkan khusus untuk Bapak Dzulfikar A Ridlo sebagai Owner AliBank.
 */
contract AliBankVault {
    address public owner;
    bool private locked; // Mekanisme Reentrancy Guard internal

    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps;

    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Menetapkan pemilik pertama kali saat kontrak diterbitkan.
     */
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @dev Batasan akses hanya untuk Pemilik (Super Admin).
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "AliBank: Akses ditolak, anda bukan owner");
        _;
    }

    /**
     * @dev Mencegah serangan reentrancy (panggilan berulang ilegal).
     */
    modifier noReentrant() {
        require(!locked, "AliBank: Keamanan aktif, transaksi sedang diproses");
        locked = true;
        _;
        locked = false;
    }

    /**
     * @dev Nasabah menyetor ETH ke dalam Brankas.
     */
    function deposit() public payable {
        require(msg.value > 0, "AliBank: Deposit harus lebih dari 0");
        
        balances[msg.sender] += msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Nasabah menarik dana dengan perlindungan Reentrancy Guard.
     */
    function withdraw(uint256 _amount) public noReentrant {
        require(balances[msg.sender] >= _amount, "AliBank: Saldo vault tidak mencukupi");
        
        // Aturan Emas: Kurangi saldo dulu sebelum mengirim uang (Checks-Effects-Interactions)
        balances[msg.sender] -= _amount;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "AliBank: Transfer ke dompet gagal");
        
        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Melihat total likuiditas ETH yang ada di dalam Brankas.
     */
    function getTotalVaultBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Memindahkan kepemilikan AliBank ke alamat baru dengan validasi keamanan.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "AliBank: Alamat baru tidak valid (Zero Address)");
        require(newOwner != owner, "AliBank: Alamat baru sama dengan owner saat ini");
        
        address previousOwner = owner;
        owner = newOwner;
        
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /**
     * @dev Fungsi darurat untuk menerima ETH langsung tanpa fungsi deposit.
     */
    receive() external payable {
        deposit();
    }
}

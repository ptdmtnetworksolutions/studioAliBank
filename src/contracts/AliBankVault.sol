/**
 *Submitted for verification at Etherscan.io on 2026-03-12
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AliBankVault
 * @dev Brankas on-chain dengan kontrol kepemilikan, perlindungan reentrancy, 
 * dan fondasi untuk sistem staking/yield. Versi V3 - Security Audited.
 */
contract AliBankVault {
    address public owner;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps; 
    
    // Flag untuk perlindungan reentrancy
    bool private _locked;

    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Modifier untuk membatasi akses hanya kepada pemilik.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya pemilik yang dapat melakukan ini");
        _;
    }

    /**
     * @dev Modifier untuk mencegah serangan reentrancy.
     */
    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    /**
     * @dev Menyetor ETH ke dalam Vault.
     */
    function deposit() public payable {
        require(msg.value > 0, "Deposit harus lebih dari 0");
        
        balances[msg.sender] += msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Menarik ETH dari Vault dengan perlindungan reentrancy.
     */
    function withdraw(uint256 _amount) public nonReentrant {
        require(balances[msg.sender] >= _amount, "Saldo vault tidak mencukupi");
        
        // Effects: Kurangi saldo sebelum interaksi eksternal (Pattern: Checks-Effects-Interactions)
        balances[msg.sender] -= _amount;
        
        // Interaction: Kirim dana
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer ETH gagal");
        
        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Memeriksa total saldo ETH yang tersimpan di dalam kontrak.
     */
    function getTotalVaultBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Memindahkan kepemilikan kontrak ke alamat baru.
     * Termasuk validasi input untuk mencegah pengiriman ke alamat nol.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Alamat baru tidak boleh alamat nol");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AliBankVault
 * @dev Brankas on-chain dengan kontrol kepemilikan dan fondasi untuk sistem staking/yield.
 */
contract AliBankVault {
    address public owner;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps; // Fondasi Staking: Mencatat waktu setoran terakhir

    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya pemilik yang dapat melakukan ini");
        _;
    }

    /**
     * @dev Mengembalikan total saldo ETH yang tersimpan dalam kontrak.
     */
    function getTotalVaultBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Memungkinkan pengguna untuk menyetor ETH ke dalam Brankas.
     * Mencatat timestamp untuk perhitungan staking di masa depan.
     */
    function deposit() public payable {
        require(msg.value > 0, "Deposit harus lebih dari 0");
        
        // Jika ini setoran baru atau penambahan, perbarui timestamp
        // Di masa depan, logika ini bisa dikembangkan untuk mengunci dana selama periode tertentu
        balances[msg.sender] += msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Memungkinkan pengguna menarik ETH mereka.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo vault tidak mencukupi");
        
        balances[msg.sender] -= _amount;
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer gagal");
        
        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Memungkinkan pemindahan kepemilikan kontrak.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Alamat baru tidak valid");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

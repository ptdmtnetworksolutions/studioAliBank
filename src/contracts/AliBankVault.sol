// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AliBankVault
 * @dev Kontrak Brankas Digital AliBank dengan Kontrol Akses (Ownership)
 * Memungkinkan nasabah menyimpan ETH dan pemilik memantau total likuiditas.
 */
contract AliBankVault {
    address public owner;
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Menetapkan pengirim kontrak sebagai pemilik pertama.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Modifier untuk membatasi akses hanya untuk pemilik kontrak.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Akses ditolak: Hanya Owner yang diizinkan");
        _;
    }

    /**
     * @dev Fungsi untuk nasabah menyetorkan ETH ke dalam brankas.
     */
    function deposit() public payable {
        require(msg.value > 0, "Deposit harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Fungsi untuk nasabah menarik kembali ETH mereka dari brankas.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo vault tidak mencukupi");
        balances[msg.sender] -= _amount;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer gagal");
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev Mengembalikan total saldo ETH yang tersimpan di dalam seluruh kontrak.
     */
    function getTotalVaultBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Memungkinkan pemilik saat ini untuk mentransfer kontrol kontrak ke pemilik baru.
     * @param _newOwner Alamat pemilik baru.
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Alamat baru tidak valid");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}

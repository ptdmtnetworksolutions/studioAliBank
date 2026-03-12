// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AliBankVault
 * @dev Smart Contract untuk Brankas (Vault) AliBank.
 * Memungkinkan nasabah menyetor dan menarik ETH secara aman di Ethereum Mainnet.
 */
contract AliBankVault {
    // Mapping untuk menyimpan saldo individu nasabah
    mapping(address => uint256) public balances;

    // Event untuk audit log transaksi di blockchain
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Fungsi untuk menyetor ETH ke Brankas.
     */
    function deposit() public payable {
        require(msg.value > 0, "Deposit harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Fungsi untuk menarik ETH kembali ke dompet pribadi.
     * @param _amount Jumlah ETH dalam Wei.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo vault tidak mencukupi");
        
        // Update state sebelum transfer untuk mencegah reentrancy attack
        balances[msg.sender] -= _amount;
        
        // Kirim ETH kembali ke nasabah
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer gagal");
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev Fungsi untuk memeriksa total likuiditas ETH di dalam Brankas.
     * Hanya bisa diakses secara eksternal.
     */
    function getTotalVaultBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
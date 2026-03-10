
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AliBankVault
 * @dev Smart Contract Brankas Digital untuk nasabah AliBank.
 * Memungkinkan penyimpanan dan penarikan ETH secara aman dan terdesentralisasi.
 */
contract AliBankVault {
    // Pemetaan saldo per alamat dompet
    mapping(address => uint256) public balances;

    // Event untuk log aktivitas blockchain
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Fungsi untuk menyetor ETH ke dalam brankas.
     */
    function deposit() public payable {
        require(msg.value > 0, "Setoran harus lebih besar dari 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Fungsi untuk menarik ETH dari brankas ke dompet pribadi.
     * @param _amount Jumlah ETH dalam wei yang ingin ditarik.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo brankas tidak mencukupi");
        balances[msg.sender] -= _amount;
        
        // Transfer aset kembali ke penarik
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer gagal");
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev Fungsi fallback untuk menerima ETH secara langsung.
     */
    receive() external payable {
        deposit();
    }
}

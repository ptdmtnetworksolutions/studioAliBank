// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AliBankVault
 * @dev Brankas Smart Contract untuk penyimpanan aset ETH nasabah AliBank secara on-chain.
 */
contract AliBankVault {
    // Pemetaan saldo individu nasabah
    mapping(address => uint256) public balances;

    // Event untuk pelacakan transaksi di Etherscan
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Fungsi untuk menyetor ETH ke dalam brankas.
     */
    function deposit() public payable {
        require(msg.value > 0, "Deposit harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Fungsi untuk menarik kembali ETH dari brankas ke dompet pribadi.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo vault tidak mencukupi");
        balances[msg.sender] -= _amount;
        
        // Mengirimkan ETH kembali ke pengirim
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer gagal");
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev FUNGSI BARU: Memeriksa total saldo ETH yang tersimpan di dalam seluruh kontrak AliBankVault.
     * @return uint256 Jumlah total ETH dalam satuan wei.
     */
    function getTotalVaultBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

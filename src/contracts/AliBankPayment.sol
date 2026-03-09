// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AliBankPayment
 * @dev Smart Contract untuk layanan Digital Vault AliBank.
 * Memungkinkan nasabah menyimpan (Deposit) dan menarik (Withdraw) ETH secara aman.
 */
contract AliBankPayment {
    // Mapping untuk menyimpan saldo per alamat dompet
    mapping(address => uint256) public balances;

    // Event untuk log transaksi di blockchain
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Fungsi untuk menyetor dana ke Vault.
     * ETH yang dikirim akan ditambahkan ke saldo pengirim di dalam kontrak.
     */
    function deposit() public payable {
        require(msg.value > 0, "Jumlah deposit harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Fungsi untuk menarik dana dari Vault.
     * Memastikan saldo di kontrak mencukupi sebelum dikirim kembali ke dompet.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo Vault tidak mencukupi");
        
        balances[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev Melihat total saldo yang tersimpan di dalam Smart Contract.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

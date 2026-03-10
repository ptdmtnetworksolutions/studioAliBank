// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AliBankVault
 * @dev Brankas Digital Terdesentralisasi untuk ekosistem AliBank.
 * Memungkinkan nasabah menyimpan (deposit) dan menarik (withdraw) ETH secara on-chain.
 */
contract AliBankVault {
    // Pemetaan saldo per alamat dompet nasabah
    mapping(address => uint256) public balances;

    // Log transaksi untuk audit publik di blockchain
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Nasabah menyetorkan ETH ke dalam Brankas.
     */
    function deposit() public payable {
        require(msg.value > 0, "Nominal setoran harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Nasabah menarik kembali ETH dari Brankas ke dompet pribadi.
     * @param _amount Jumlah dalam Wei (18 desimal).
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo Brankas tidak mencukupi");
        
        // Update saldo sebelum transfer (mencegah re-entrancy attack)
        balances[msg.sender] -= _amount;
        
        // Transfer dana asli ke dompet pengirim
        payable(msg.sender).transfer(_amount);
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev Fungsi pembantu untuk melihat total likuiditas di dalam kontrak.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Fungsi fallback untuk menerima ETH secara langsung
    receive() external payable {
        deposit();
    }
}

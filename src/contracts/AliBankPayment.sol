// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AliBankPayment
 * @dev Kontrak sederhana untuk mengelola deposit dan withdraw aset kripto nasabah AliBank.
 */
contract AliBankPayment {
    // Menyimpan saldo masing-masing nasabah di dalam vault
    mapping(address => uint256) public balances;

    // Event untuk melacak transaksi on-chain
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Nasabah menyetor ETH ke dalam vault AliBank.
     */
    function deposit() public payable {
        require(msg.value > 0, "Jumlah deposit harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Nasabah menarik ETH dari vault AliBank kembali ke dompet mereka.
     * @param _amount Jumlah dalam Wei (1 ETH = 10^18 Wei)
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo vault tidak mencukupi");
        
        balances[msg.sender] -= _amount;
        
        // Melakukan transfer dana kembali ke pengirim
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Gagal mengirim dana");
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev Melihat total saldo yang dikelola oleh kontrak ini.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
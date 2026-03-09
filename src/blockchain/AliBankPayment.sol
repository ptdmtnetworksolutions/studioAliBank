// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AliBankPayment
 * @dev Kontrak sederhana untuk mengelola deposit dan penarikan ETH nasabah AliBank.
 */
contract AliBankPayment {
    // Mapping untuk menyimpan saldo setiap alamat dompet
    mapping(address => uint256) public balances;

    // Event untuk mencatat aktivitas di blockchain
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    /**
     * @dev Fungsi untuk menyetor ETH ke dalam Vault AliBank.
     * ETH yang dikirim akan tersimpan di dalam kontrak ini.
     */
    function deposit() public payable {
        require(msg.value > 0, "Jumlah setoran harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Fungsi untuk menarik ETH milik nasabah dari Vault.
     * @param _amount Jumlah dalam Wei (1 ETH = 10^18 Wei).
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo tidak mencukupi untuk penarikan");
        balances[msg.sender] -= _amount;
        
        // Mengirimkan ETH kembali ke dompet nasabah
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer ETH gagal");
        
        emit Withdraw(msg.sender, _amount);
    }

    /**
     * @dev Mengecek total saldo yang dikelola oleh kontrak AliBank ini.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

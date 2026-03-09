// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AliBankPayment
 * @dev Kontrak pintar untuk mengelola setoran dan penarikan aset nasabah AliBank secara on-chain.
 */
contract AliBankPayment {
    // Menyimpan saldo masing-masing nasabah
    mapping(address => uint256) public balances;

    // Event yang dipicu saat nasabah melakukan deposit
    event Deposit(address indexed user, uint256 amount);
    
    // Event yang dipicu saat nasabah melakukan penarikan
    event Withdrawal(address indexed user, uint256 amount);

    /**
     * @dev Fungsi untuk menyetorkan Ether ke dalam vault AliBank.
     */
    function deposit() public payable {
        require(msg.value > 0, "Deposit harus lebih besar dari 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Fungsi untuk menarik Ether dari vault AliBank.
     * @param _amount Jumlah Ether (dalam wei) yang ingin ditarik.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo tidak mencukupi di vault");
        
        balances[msg.sender] -= _amount;
        
        // Mengirim dana kembali ke dompet nasabah
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Gagal mengirim dana ke dompet");
        
        emit Withdrawal(msg.sender, _amount);
    }

    /**
     * @dev Fungsi helper untuk melihat total dana yang ada di dalam kontrak pintar.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Fungsi fallback untuk menerima Ether jika dikirim langsung tanpa memanggil deposit()
    receive() external payable {
        deposit();
    }
}

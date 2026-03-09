// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AliBankPayment
 * @dev Kontrak pintar resmi AliBank untuk mengelola setoran dan penarikan ETH nasabah secara on-chain.
 */
contract AliBankPayment {
    // Menyimpan catatan saldo setiap alamat nasabah di dalam Vault AliBank
    mapping(address => uint256) public balances;

    // Event untuk mencatat aktivitas di blockchain
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Fungsi untuk menyetor ETH ke dalam Vault. 
     * Dana akan disimpan di dalam kontrak ini atas nama pengirim.
     */
    function deposit() public payable {
        require(msg.value > 0, "Jumlah setoran harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Fungsi untuk menarik ETH dari Vault kembali ke dompet nasabah.
     * @param _amount Jumlah dalam Wei (1 ETH = 10^18 Wei).
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo Vault AliBank Anda tidak mencukupi");
        
        balances[msg.sender] -= _amount;
        
        // Mengirimkan ETH kembali ke dompet nasabah
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Gagal melakukan pengiriman dana ke dompet");
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev Melihat total likuiditas yang tersimpan di dalam kontrak AliBank.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

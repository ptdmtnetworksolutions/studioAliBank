// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AliBankPayment
 * @dev Kontrak pintar untuk mengelola setoran dan penarikan aset nasabah AliBank.
 */
contract AliBankPayment {
    mapping(address => uint256) public balances;
    address public owner;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Nasabah menyetorkan ETH ke vault AliBank.
     */
    function deposit() public payable {
        require(msg.value > 0, "Jumlah harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Nasabah menarik ETH mereka dari vault AliBank.
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo tidak mencukupi");
        balances[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        emit Withdraw(msg.sender, _amount);
    }

    /**
     * @dev Melihat saldo total yang ada di dalam kontrak.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

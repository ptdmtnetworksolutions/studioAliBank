// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AliBankVault - Institutional Grade V3
 * @dev Brankas Terpusat AliBank untuk mengelola cadangan likuiditas ETH dan ERC20.
 * Mendukung setoran publik dan penarikan administratif dengan keamanan tinggi.
 */
contract AliBankVault is Ownable, ReentrancyGuard {
    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);
    event ERC20Withdrawal(address indexed token, address indexed to, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Menerima ETH secara langsung (Fallback)
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Penarikan ETH hanya oleh Super Admin (Owner)
     * Digunakan untuk penyelesaian dana riil (Settlement)
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(address(this).balance >= amount, "Saldo tidak mencukupi");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Gagal mengirim ETH");
        emit Withdrawal(owner(), amount);
    }

    /**
     * @dev Penarikan Token ERC20 (seperti USDT/ALX) oleh Super Admin
     */
    function withdrawERC20(address token, uint256 amount) external onlyOwner nonReentrant {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "Saldo token tidak mencukupi");
        require(IERC20(token).transfer(owner(), amount), "Gagal transfer token");
        emit ERC20Withdrawal(token, owner(), amount);
    }

    /**
     * @dev Mendapatkan total saldo ETH brankas
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Fungsi darurat untuk mengosongkan brankas (Hanya Admin)
     */
    function emergencyDrain() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = owner().call{value: balance}("");
            require(success, "Gagal drain ETH");
        }
    }
}
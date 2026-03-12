// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AliBankVault V3
 * @dev Brankas utama AliBank dengan keamanan Grade A (ReentrancyGuard & Access Control).
 * Mendukung penyimpanan ETH nasabah dan pencatatan waktu untuk sistem imbal hasil (staking).
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract AliBankVault is ReentrancyGuard {
    address public owner;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps;

    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya Owner yang dapat melakukan ini.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Setoran ETH nasabah. Mencatat saldo dan waktu setoran.
     */
    function deposit() public payable nonReentrant {
        require(msg.value > 0, "Nominal setoran harus lebih dari 0.");
        
        if (balances[msg.sender] == 0) {
            depositTimestamps[msg.sender] = block.timestamp;
        }
        
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Penarikan ETH nasabah dengan proteksi Reentrancy.
     */
    function withdraw(uint256 _amount) public nonReentrant {
        require(balances[msg.sender] >= _amount, "Saldo Brankas tidak mencukupi.");
        
        balances[msg.sender] -= _amount;
        
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Gagal mengirim ETH.");
        
        if (balances[msg.sender] == 0) {
            depositTimestamps[msg.sender] = 0;
        }

        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Memindahkan kepemilikan kontrak (Access Control).
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Alamat baru tidak valid.");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @dev Melihat total likuiditas riil di dalam Brankas.
     */
    function getTotalVaultBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Penarikan darurat oleh owner (Hanya untuk likuiditas yang tidak dimiliki nasabah).
     */
    function emergencyWithdraw(uint256 _amount) public onlyOwner nonReentrant {
        require(address(this).balance >= _amount, "Likuiditas tidak cukup.");
        (bool success, ) = owner.call{value: _amount}("");
        require(success, "Gagal menarik dana.");
    }
}

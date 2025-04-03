// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EduSpendingTracker {
    struct Transaction {
        address sender;       
        uint amount;
        address recipient;    
        string purpose;
        string currency;
        uint timestamp;
        bytes32 transactionId;
        string senderName;    
        string recipientName; 
    }

    Transaction[] public transactions;
    mapping(address => bool) public authorized;
    address public admin;

    event TransactionAdded(
        address indexed sender,
        uint amount,
        address indexed recipient,
        string purpose,
        string currency,
        uint timestamp,
        bytes32 transactionId,
        string senderName,
        string recipientName
    );
    event Authorized(address indexed entity);
    event Unauthorized(address indexed entity);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorized[msg.sender] = true;
    }

    function addTransaction(
        uint _amount,
        address _recipient,
        string memory _purpose,
        string memory _currency,
        bytes32 _transactionId,
        string memory _senderName,
        string memory _recipientName
    ) public {
        require(authorized[msg.sender], "Entity not authorized");
        transactions.push(Transaction(
            msg.sender,
            _amount,
            _recipient,
            _purpose,
            _currency,
            block.timestamp,
            _transactionId,
            _senderName,
            _recipientName
        ));
        emit TransactionAdded(
            msg.sender,
            _amount,
            _recipient,
            _purpose,
            _currency,
            block.timestamp,
            _transactionId,
            _senderName,
            _recipientName
        );
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _index)
        public
        view
        returns (
            address sender,
            uint amount,
            address recipient,
            string memory purpose,
            string memory currency,
            uint timestamp,
            bytes32 transactionId,
            string memory senderName,
            string memory recipientName
        )
    {
        require(_index < transactions.length, "Index out of bounds");
        Transaction memory txn = transactions[_index];
        return (
            txn.sender,
            txn.amount,
            txn.recipient,
            txn.purpose,
            txn.currency,
            txn.timestamp,
            txn.transactionId,
            txn.senderName,
            txn.recipientName
        );
    }

    function authorize(address _entity) public onlyAdmin {
        authorized[_entity] = true;
        emit Authorized(_entity);
    }

    function unauthorize(address _entity) public onlyAdmin {
        authorized[_entity] = false;
        emit Unauthorized(_entity);
    }
}
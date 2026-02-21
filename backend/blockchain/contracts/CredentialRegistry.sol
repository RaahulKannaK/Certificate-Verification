// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;


contract CredentialRegistry {
    address public owner;

    struct Credential {
        address issuer;     
        address recipient;    
        bytes32 credentialHash; 
        uint256 issuedAt;     
        bool revoked;         
    }

    mapping(bytes32 => Credential) private credentials;

    mapping(address => bytes32[]) private recipientIndex;

    event CredentialIssued(bytes32 indexed credentialHash, address indexed recipient, uint256 issuedAt);
    event CredentialRevoked(bytes32 indexed credentialHash, uint256 revokedAt);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }


    function issueCredential(bytes32 _credentialHash, address _recipient) external onlyOwner {
        require(_credentialHash != bytes32(0), "invalid hash");
        Credential storage c = credentials[_credentialHash];
        require(c.issuedAt == 0, "already issued");

        credentials[_credentialHash] = Credential({
            issuer: msg.sender,
            recipient: _recipient,
            credentialHash: _credentialHash,
            issuedAt: block.timestamp,
            revoked: false
        });

        recipientIndex[_recipient].push(_credentialHash);

        emit CredentialIssued(_credentialHash, _recipient, block.timestamp);
    }


    function verifyCredential(bytes32 _credentialHash) external view returns (bool exists, address issuer, address recipient, uint256 issuedAt, bool revoked) {
        Credential memory c = credentials[_credentialHash];
        if (c.issuedAt == 0) {
            return (false, address(0), address(0), 0, false);
        }
        return (true, c.issuer, c.recipient, c.issuedAt, c.revoked);
    }


    function revokeCredential(bytes32 _credentialHash) external onlyOwner {
        Credential storage c = credentials[_credentialHash];
        require(c.issuedAt != 0, "not issued");
        require(!c.revoked, "already revoked");
        c.revoked = true;
        emit CredentialRevoked(_credentialHash, block.timestamp);
    }

    function getCredentialsForRecipient(address _recipient) external view returns (bytes32[] memory) {
        return recipientIndex[_recipient];
    }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

// ============ External Imports ============
import {Router} from "https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/main/solidity/contracts/Router.sol";

/*
 * @title The Hello World App
 * @dev You can use this simple app as a starting point for your own application.
 */
contract SimpleGeneralMessage is Router {

    mapping(address => string) public lastMessage;

    constructor(
        address _abacusConnectionManager,
        address _interchainGasPaymaster
    ) {
        // Transfer ownership of the contract to deployer
        _transferOwnership(msg.sender);

        // Set the addresses for the ACM and IGP
        // Alternatively, this could be done later in an initialize method
        _setAbacusConnectionManager(_abacusConnectionManager);
        _setInterchainGasPaymaster(_interchainGasPaymaster);
    }

    // ============ External functions ============

    /**
     * @notice Sends a message to the _destinationDomain. Any msg.value is
     * used as interchain gas payment.
     * @param _destinationDomain The destination domain to send the message to.
     */
    function sendMessage(uint32 _destinationDomain, string calldata message)
        external
        payable
    {
        bytes memory payload = abi.encode(msg.sender, message);
        _dispatchWithGas(_destinationDomain, payload, msg.value);
    }

    // ============ Internal functions ============

    /**
     * @notice Handles a message from a remote router.
     * @dev Only called for messages sent from a remote router, as enforced by Router.sol.
     * @param _message The message body.
     */
    function _handle(
        uint32,
        bytes32,
        bytes calldata _message
    ) internal override {
        // Do some checks if you want

        (address from, string memory message) = abi.decode(_message, (address, string));
        lastMessage[from] = message;
    }
}

// 1. Contracts deployed at these addresses
// Moonbase Alpha: 0xDedC95A31c0a04175CeB9d31Da505D4592e2C1f3
// Avalanche Fuji: 0xaf108eF646c8214c9DD9C13CBC5fadf964Bbe293

// 2. Enroll remote routers (input data)
// Moonbase Alpha: 43113        0x000000000000000000000000af108eF646c8214c9DD9C13CBC5fadf964Bbe293 
// Avalanche Fuji: 0x6d6f2d61   0x000000000000000000000000DedC95A31c0a04175CeB9d31Da505D4592e2C1f3

// 3. Send message (these are the chainIds)
// Moonbase Alpha: 0x6d6f2d61
// Avalanche Fuji: 43113


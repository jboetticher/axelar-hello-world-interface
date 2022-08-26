// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
 
import {IAxelarExecutable} from "https://github.com/axelarnetwork/axelar-cgp-solidity/blob/main/contracts/interfaces/IAxelarExecutable.sol";
import {StringToAddress, AddressToString} from "https://github.com/axelarnetwork/axelar-utils-solidity/blob/main/contracts/StringAddressUtils.sol";
import {IERC20} from "https://github.com/axelarnetwork/axelar-cgp-solidity/blob/main/contracts/interfaces/IERC20.sol";
import {IAxelarGateway} from "https://github.com/axelarnetwork/axelar-cgp-solidity/blob/main/contracts/interfaces/IAxelarGateway.sol";
import {IAxelarGasService} from "https://github.com/axelarnetwork/axelar-cgp-solidity/blob/main/contracts/interfaces/IAxelarGasService.sol";

// Packages and sends a string from one chain to another.
contract HelloWorldMessage is IAxelarExecutable {
   using AddressToString for address;
   using StringToAddress for string;
 
   // The gas receiver relayer (microservice) provided by Axelar
   IAxelarGasService gasService;
 
   // The last message we received from Axelar, mapped to the sender
   mapping(address => string) public lastMessage;
 
   constructor(address gateway_, address gasService_) IAxelarExecutable(gateway_)
   {
       gasService = IAxelarGasService(gasService_);
   }
 
   // Locks and sends a token
   // REMEMBER TO SEND VALUE AS GAS PAYMENT
   function sendMessage(string memory message, string memory destAddress, string memory destChain) external payable {
       // Create the payload.
       bytes memory payload = abi.encode(msg.sender, message);
 
       // Pay for gas
       // You will need to use the SDK to find out how much gas you need
       gasService.payNativeGasForContractCall{value: msg.value}(
           address(this),
           destChain,
           destAddress,
           payload,
           msg.sender
       );
 
       // Call remote contract
       gateway.callContract(destChain, destAddress, payload);
   }
 
   // This is automatically executed by Axelar Relay Services if gas was paid for
   function _execute(
       string memory, /*sourceChain*/
       string memory, /*sourceAddress*/
       bytes calldata payload
   ) internal override {
       (address adr, string memory str) = abi.decode(payload, (address,string));
       lastMessage[adr] = str;
   }
}

contract DoubleHello {
    HelloWorldMessage H;
    constructor(HelloWorldMessage h) {
        H = h;
    }
//   function sendMessage(string memory message, string memory destAddress, string memory destChain) external payable {

    function send() external payable {
        H.sendMessage{ value: 55389864900000 }("msg 1", "0xfb8afead05b130796de04f00d9213a7bac2bc6c2", "Fantom");
        H.sendMessage{ value: 197036323830100000 }("msg 2", "0x827d4b6bd9660d1a4c42e4453307c8d3d5c1f051", "Avalanche");
    }
}

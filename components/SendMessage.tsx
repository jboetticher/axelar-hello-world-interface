import React, { useState, useEffect, useContext } from 'react';
import { Button, Dropdown, DropdownItemProps, Grid, Input } from 'semantic-ui-react';
import {
  Chain, MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai,
  useEthers, useCall
} from '@usedapp/core';
import { utils } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import AxelarModule, { chainIdToAxelar } from '../ethereum/axelar/AxelarModule';
import HyperlaneModule from '../ethereum/hyperlane/HyperlaneModule';
import ConnectedContractModule from '../ethereum/ConnectedContractModule';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { chainIdToHyperlane } from '../ethereum/hyperlane/HyperlaneModule';
import ConnectedContractContext from './ConnectedContractContext';

/**
 * Converts a chainId to a faucet URL
 * @param chainId The chain ID of the chain you want to send to.
 */
 function chainIdToFaucet(chainId): string {
  switch (chainId) {
    case MoonbaseAlpha.chainId: return "https://apps.moonbeam.network/moonbase-alpha/faucet/";
    case FantomTestnet.chainId: return "https://faucet.fantom.network/";
    case AvalancheTestnet.chainId: return "https://faucet.avax.network/";
    case Mumbai.chainId: return "https://faucet.polygon.technology/";
    default: return null;
  }
}

const EMPTY_ADDRESS = '0x9999999999999999999999999999999999999999';

/*
Each protocol has their own: 
- Available chains
- Querying system
- Contract deployments
*/

const SendMessage = () => {
  // State for sending the message
  const [message, setMessage] = useState<string>();
  const [destination, setDestination] = useState<number>();
  const [formError, setFormError] = useState<string>();
  const [isPending, setIsPending] = useState<boolean>();
  const { switchNetwork, chainId, account } = useEthers();

  // Set up protocol options
  const protocolOptions: DropdownItemProps[] = [
    { key: 0, value: "axelar", text: "Axelar", image: { avatar: true, src: './logos/axelar.svg' } },
    { key: 1, value: "hyperlane", text: "Hyperlane", image: { avatar: true, src: './logos/hyperlane.png' } },
    //{ key: 2, value: "layerzero", text: "Layer Zero", image: { avatar: true, src: './logos/layerzero.png' } },
  ];
  const [protocol, setProtocol] = useState<string>(protocolOptions[0].value as string);
  const modules = { axelar: new AxelarModule(), hyperlane: new HyperlaneModule(), layerzero: new AxelarModule() };
  const currentModule: ConnectedContractModule = modules[protocol ?? protocolOptions[0].value as string];
  const { data: connectedContractContext, setData: setConnectedContractContext } = useContext(ConnectedContractContext);

  // Set up network options
  const chains: Chain[] = currentModule.chains;
  const chainOptions: DropdownItemProps[] = [];
  chains.forEach(c => {
    chainOptions.push({ key: c.chainId, value: c.chainId, text: c.chainName, image: { avatar: true, src: `./logos/${c.chainName}.png` } });
  });
  const faucetURL = chainIdToFaucet(chainId);

  // Basic form error handling
  useEffect(() => {
    if (chainId === destination) setFormError('Must send to a different chain.');
    else setFormError('');
  }, [chainId, destination]);
  const formIsValidated = destination != null && chainId != null && formError == '' && message != '' && message != null;

  // Submit transaction
  const helloWorldInterface = new utils.Interface(currentModule.abi);
  const contract = new Contract(currentModule.addresses[chainId ?? 0] ?? EMPTY_ADDRESS, helloWorldInterface);
  const CrossChainConfigurer = currentModule.CrossChainConfigurer({ contract, functionName: 'sendMessage' });
  const { originState, send, transactionState, resetState } = connectedContractContext ?? { originState: undefined, send: undefined, transactionState: undefined, resetState: undefined };
  async function sendTransaction() {
    // Reset state
    resetState();
    setIsPending(true);

    // Calculate potential cross-chain gas fee
    const crossChainGasFee = await currentModule.calculateNativeGasFee(chainId, destination);

    // Send transaction
    // Not sure how best to modularize this since there will be different inputs for each implementation. 
    //    You could ensure that it's the same input in the smart contract, but you'll need some way of adapting for each protocol
    //    You could also put that adpater into the module, but... that's extra work
    //    For now it's just a switch
    let txReceipt: TransactionReceipt;
    switch(protocol) {
      case 'axelar':
        txReceipt = await send(message, currentModule.addresses[destination], chainIdToAxelar(destination), { value: crossChainGasFee });
        break;
      case 'hyperlane':
        txReceipt = await send(chainIdToHyperlane(destination), message, { value: crossChainGasFee });
        break;
      case 'layerzero':
        break;
    }
  }

  // Handle message reading from multiple chains
  const [networkToRead, setNetworkToRead] = useState<number>(MoonbaseAlpha.chainId);
  const [protocolToRead, setProtocolToRead] = useState<string>('axelar');
  const chainReadOptions: DropdownItemProps[] = [];
  const readChains: Chain[] = modules[protocolToRead ?? protocolOptions[0].value as string].chains;
  readChains.forEach(c => {
    chainReadOptions.push({ key: c.chainId, value: c.chainId, text: c.chainName, image: { avatar: true, src: `./logos/${c.chainName}.png` } });
  });
  const readContract = new Contract(modules[protocolToRead].addresses[networkToRead], helloWorldInterface);
  const call = useCall({ contract: readContract, method: 'lastMessage', args: [account ?? EMPTY_ADDRESS] }, { chainId: networkToRead });
  const lastMessage: string = call?.value?.[0];

  // Ensure that no incorrect chain is read
  function changeProtocolToRead(protocol: string) {
    setProtocolToRead(protocol);
  }
  useEffect(() => {
    if(modules[protocolToRead].addresses[protocolToRead] == null) {
      const moduleToRead: ConnectedContractModule = modules[protocolToRead] as ConnectedContractModule;
      setNetworkToRead(moduleToRead.chains[0].chainId);
    }
  }, [protocolToRead]);


  // Handle pending button & loading status
  useEffect(() => {
    if (originState?.status != 'None' && originState?.status != 'PendingSignature') setIsPending(false);
  }, [originState?.status]);
  const buttonIsLoading = transactionState?.isLoading || isPending;

  return (
    <div>
      <h3>Hello World Messaging</h3>
      <p>
        Send a string message from one chain to another. Select your destination and origin chains below.
      </p>
      <Grid centered divided='vertically' textAlign='center'>
        <Grid.Row centered columns={5} textAlign='center'>
          <Grid.Column>
            <h4>SEND</h4>
            <Input placeholder='Your message...' fluid onChange={(_, data) => setMessage(data?.value)} />
          </Grid.Column>
          <Grid.Column>
            <h4>VIA</h4>
            <Dropdown
              placeholder='Select protocol'
              options={protocolOptions} fluid selection
              onChange={(_, data) => setProtocol(data?.value as string)}
              value={protocol}
            />
          </Grid.Column>
          <Grid.Column>
            <h4>FROM {faucetURL ? <a href={faucetURL}>(Faucet)</a> : <></>} </h4>
            <Dropdown
              placeholder='Select origin chain'
              options={chainOptions} fluid selection
              onChange={(_, data) => switchNetwork(data?.value as number)}
              value={chainId}
            />
          </Grid.Column>
          <Grid.Column>
            <h4>TO</h4>
            <Dropdown
              placeholder='Select destination chain'
              options={chainOptions} fluid selection
              onChange={(_, data) => setDestination(data?.value as number)}
            />
          </Grid.Column>
          <Grid.Column>
            <div className='h4-spacer' />
            <Button
              onClick={sendTransaction}
              disabled={!formIsValidated || buttonIsLoading}
              loading={buttonIsLoading}
            >
              Submit
            </Button>
            <p className='error-text'>{formError}</p>
          </Grid.Column>
        </Grid.Row>
        <br />
        <Grid.Row centered columns={4} textAlign='center'>
          <Grid.Column>
            <h4>{chains.find(x => x.chainId === chainId)?.chainName} Status</h4>
            <p className='wrp'>{originState?.transaction?.hash}</p>
            <p className='wrp'>{transactionState?.originTxState}</p>
          </Grid.Column>
          <Grid.Column>
            <h4>Protocol Status</h4>
            <p className='wrp'>{originState?.transaction?.hash}</p>
            <p className='wrp'>{transactionState?.middlemanTxState}</p>
          </Grid.Column>
          <Grid.Column>
            <h4>{chains.find(x => x.chainId === destination)?.chainName} Status</h4>
            {transactionState?.destTxHash && <p className='wrp'>{transactionState?.destTxHash}</p>}
            <p className='wrp'>{transactionState?.destTxState}</p>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <br />
      <br />
      {account == null ? <></> :
        <>
          <h3>Read Hello World Contracts</h3>
          <Grid centered divided='vertically' textAlign='center'>
            <Grid.Row centered columns={3} textAlign='center'>
              <Grid.Column>
                <Dropdown
                  placeholder='Select network to read'
                  options={chainReadOptions} fluid selection
                  onChange={(_, data) => setNetworkToRead(data?.value as number)}
                  value={networkToRead}
                />
              </Grid.Column>
              <Grid.Column>
                <Dropdown
                  placeholder='Select protocol'
                  options={protocolOptions} fluid selection
                  onChange={(_, data) => changeProtocolToRead(data?.value as string)}
                  value={protocolToRead}
                />
              </Grid.Column>
              <Grid.Column>
                <h4>Message: "{lastMessage}"</h4>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </>
      }
      {CrossChainConfigurer}
    </div>
  );
};

export default SendMessage;

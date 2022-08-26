import React, { useState, useEffect } from 'react';
import { Button, Dropdown, DropdownItemProps, Grid, Input } from 'semantic-ui-react';
import {
  Chain, MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai,
  useEthers, useCall
} from '@usedapp/core';
import { utils } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import HelloWorldABI from '../ethereum/abi/HelloWorldMessage.json';
import addresses from '../ethereum/addresses';
import { AxelarQueryAPI, Environment, EvmChain } from '@axelar-network/axelarjs-sdk';
import { tokenName } from '../ethereum/axelar/axelarHelpers';
import useAxelarFunction, { AxelarTransactionState } from '../ethereum/axelar/useAxelarFunction';

/**
 * Converts a chainId to a string that Axelar's contract can interpet
 * @param chainId The chain ID of the chain you want to send to.
 * @returns The name of a chain that Axelar can interprets
 */
function chainIdToAxelar(chainId): EvmChain {
  switch (chainId) {
    case MoonbaseAlpha.chainId: return EvmChain.MOONBEAM;
    case FantomTestnet.chainId: return EvmChain.FANTOM;
    case AvalancheTestnet.chainId: return EvmChain.AVALANCHE;
    case Mumbai.chainId: return EvmChain.POLYGON;
  }
  throw new Error(`Chain ${chainId} is not supported!`);
}

const SendMessage = () => {
  const [message, setMessage] = useState<string>();
  const [destination, setDestination] = useState<number>();
  const [formError, setFormError] = useState<string>();
  const [isPending, setIsPending] = useState<boolean>();
  const [destReceipt, setDestReceipt] = useState<TransactionReceipt>();
  const { switchNetwork, chainId, account } = useEthers();

  // Set up network options
  const chains: Chain[] = [MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai];
  const chainOptions: DropdownItemProps[] = [];
  chains.forEach(c => {
    chainOptions.push({ key: c.chainId, value: c.chainId, text: c.chainName, image: { avatar: true, src: `./logos/${c.chainName}.png` } });
  });

  // Basic form error handling
  useEffect(() => {
    if (chainId === destination) setFormError('Must send to a different chain.');
    else setFormError('');
  }, [chainId, destination]);
  const formIsValidated = destination != null && chainId != null && formError == '' && message != '';

  // Submit transaction
  const wethInterface = new utils.Interface(HelloWorldABI);
  const contract = new Contract(addresses[chainId], wethInterface);
  const { originState, send, state, gmp, resetState } = useAxelarFunction(contract, 'sendMessage', { transactionName: 'Send Message' });
  async function sendTransaction() {
    // Reset state
    resetState();
    setIsPending(true);

    // Calculate potential cross-chain gas fee
    const axlearSDK = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const estimateGasUsed = 200000;
    const crossChainGasFee = await axlearSDK.estimateGasFee(
      chainIdToAxelar(chainId),
      chainIdToAxelar(destination),
      tokenName(chainId),
      estimateGasUsed
    );

    // Send transaction
    const txReceipt = await send(message, addresses[destination], chainIdToAxelar(destination), { value: crossChainGasFee });
    setDestReceipt(txReceipt);
  }

  // Handle message reading from multiple chains
  const [networkToRead, setNetworkToRead] = useState<number>(MoonbaseAlpha.chainId);
  const readContract = new Contract(addresses[networkToRead], wethInterface);
  const call = useCall({ contract: readContract, method: 'lastMessage', args: [account] }, { chainId: networkToRead });
  const lastMessage: string = call?.value?.[0];

  // Extra transaction state handling to simplify interface logic
  const axelarStateIsError =
    state == AxelarTransactionState.OriginError ||
    state == AxelarTransactionState.AxelarError ||
    state == AxelarTransactionState.DestinationError;
  const buttonIsLoading = (
    state != AxelarTransactionState.None &&
    state != AxelarTransactionState.Success &&
    !axelarStateIsError) ||
    isPending;
  const originChainTxState = state == AxelarTransactionState.None ? '---' :
    state == AxelarTransactionState.OriginError ? 'ERROR' :
      state == AxelarTransactionState.OriginPending ? 'PENDING' : 'SUCCESS';
  const axelarTxState = gmp == null ? '---' :
    state == AxelarTransactionState.AxelarError ? 'ERROR' :
      state == AxelarTransactionState.AxelarPending ? 'PENDING' : 'SUCCESS';
  const destChainTxState = gmp == null || state < AxelarTransactionState.DestinationPending ? '---' :
    state == AxelarTransactionState.DestinationError ? 'ERROR' :
      state == AxelarTransactionState.DestinationPending ? 'PENDING' : 'SUCCESS';
  useEffect(() => {
    if (originState.status != 'None' && originState.status != 'PendingSignature') setIsPending(false);
  }, [originState.status]);

  return (
    <div>
      <h3>Basic Request Model</h3>
      <p>
        Send a string message from one chain to another. Select your destination and origin chains below.
      </p>
      <Grid centered divided='vertically' textAlign='center'>
        <Grid.Row centered columns={4} textAlign='center'>
          <Grid.Column>
            <h4>SEND</h4>
            <Input placeholder='Your message...' fluid onChange={(_, data) => setMessage(data?.value)} />
          </Grid.Column>
          <Grid.Column>
            <h4>FROM</h4>
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
              disabled={!formIsValidated}
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
            <p className='wrp'>{originChainTxState}</p>
          </Grid.Column>
          <Grid.Column>
            <h4>Axelar Status</h4>
            <p className='wrp'>{originState?.transaction?.hash}</p>
            <p className='wrp'>{axelarTxState}</p>
          </Grid.Column>
          <Grid.Column>
            <h4>{chains.find(x => x.chainId === destination)?.chainName} Status</h4>
            <p className='wrp'>{destReceipt?.transactionHash}</p>
            <p className='wrp'>{destChainTxState}</p>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <br />
      <br />
      {account == null ? <></> :
        <>
          <h3>Read Hello World Contracts</h3>
          <Grid centered divided='vertically' textAlign='center'>
            <Grid.Row centered columns={2} textAlign='center'>
              <Grid.Column>
                <Dropdown
                  placeholder='Select network to read'
                  options={chainOptions} fluid selection
                  onChange={(_, data) => setNetworkToRead(data?.value as number)}
                  value={networkToRead}
                />
              </Grid.Column>
              <Grid.Column>
                <h4>Message: "{lastMessage}"</h4>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </>
      }
    </div>
  );
};

export default SendMessage;

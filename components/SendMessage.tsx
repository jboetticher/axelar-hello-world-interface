import React, { useState, useEffect } from 'react';
import { Button, Dropdown, DropdownItemProps, Grid, Input } from 'semantic-ui-react';
import { 
  Chain, MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai, 
  useEthers, useContractFunction
} from '@usedapp/core';
import { utils } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import HelloWorldABI from '../ethereum/abi/HelloWorldMessage.json';
import addresses from '../ethereum/addresses';
import { send } from 'process';

/**
 * Converts a chainId to a string that Axelar's contract can interpet
 * @param chainId The chain ID of the chain you want to send to.
 * @returns The name of a chain that Axelar can interpret
 */
function chainIdToAxelar(chainId): "Moonbeam" | "Fantom" | "Avalanche" | "Polygon" {
  switch (chainId) {
    case MoonbaseAlpha.chainId: return 'Moonbeam';
    case FantomTestnet.chainId: return 'Fantom';
    case AvalancheTestnet.chainId: return 'Avalanche';
    case Mumbai.chainId: return 'Polygon';
  }
  throw new Error(`Chain ${chainId} is not supported!`);
}

const SendMessage = () => {
  const [message, setMessage] = useState<string>();
  const [destination, setDestination] = useState<number>();
  const [formError, setFormError] = useState<string>();
  const { switchNetwork, chainId } = useEthers();

  // Set up network options
  const chains: Chain[] = [MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai];
  const chainOptions: DropdownItemProps[] = [];
  chains.forEach(c => {
    chainOptions.push({ key: c.chainId, value: c.chainId, text: c.chainName, image: { avatar: true, src: `./logos/${c.chainName}.png` }});
  });

  // Basic form error handling
  useEffect(() => {
    if(chainId === destination) setFormError('Must send to a different chain.');
    else setFormError('');
  }, [chainId, destination]);
  const formIsValidated = destination != null && chainId != null && formError !== '';

  // Submit transaction
  const wethInterface = new utils.Interface(HelloWorldABI);
  const contract = new Contract(addresses[chainId], wethInterface);
  const { state, send } = useContractFunction(contract, 'sendMessage', { transactionName: 'Send Message' });
  function sendTransaction() {
    // TODO: calculate value amount via SDK
    send(message, addresses[destination], chainIdToAxelar(destination), { value: 10 });
  }


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
            <Button disabled={formIsValidated}>Submit</Button>
            <p className='error-text'>{formError}</p>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <br />
      <br />

    </div>
  );
};

export default SendMessage;

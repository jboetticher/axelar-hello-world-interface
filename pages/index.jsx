import React, { useEffect, useState } from 'react';
import { Container, Button, Icon, Menu } from 'semantic-ui-react';
import Head from 'next/head';
import SendMessage from '../components/SendMessage';
import Link from 'next/link';
import detectEthereumProvider from '@metamask/detect-provider';
import { Mainnet, DAppProvider, useEtherBalance, useEthers } from '@usedapp/core';

const config = {
  /*readOnlyChainId: Mainnet.chainId,
  readOnlyUrls: {
    [Mainnet.chainId]: getDefaultProvider('mainnet'),
  }*/
}

const MoonlinkDashboard = () => {
  // Initial State
  const { account, chainId, error, deactivate, activateBrowserWallet } = useEthers();
  const isConnected = account !== undefined;
  if(error) console.log(error);

  const networkName = (() => {
    switch(chainId) {
      case undefined: return 'Not Connected';
      case 1287: return 'Moonbase Alpha';
      default: return 'Not Supported';
    }
  })();

  /*
  const checkMetamask = async () => {
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });

    if (provider) {
      const chainId = await provider.request({
        method: 'eth_chainId',
      });

      let networkName;
      switch (chainId) {
        case '0x507':
          networkName = 'Moonbase Alpha';
          break;
        default:
          networkName = '';
          setAccount('Only Moonbase Alpha Supported');
          break;
      }
      if (networkName !== '') {
        setNetworkName(networkName);
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts',
        });

        // Update State
        if (accounts) {
          setAccount(ethers.utils.getAddress(accounts[0]));
          setConnected(true);
        }
      }
    } else {
      // MetaMask not detected
      setAccount('MetaMask not Detected');
    }
  };
  */

  return (
    <Container>
      <Head>
        <title>Axelar {'<'}{'>'} Moonbase Hello World</title>
        <link rel='icon' type='image/png' sizes='32x32' href='/favicon.png' />
        <link
          rel='stylesheet'
          href='//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css'
        />
      </Head>
      <div style={{ paddingTop: '10px' }}></div>
      <Menu>
        <Link href='/'>
          <a className='item'>Moonbase Alpha Axelar Hello World</a>
        </Link>
        <Menu.Menu position='right'>
          <a className='item'> {account} </a>
          {isConnected ? (
            <Button floated='right' icon labelPosition='left' color='green' onClick={deactivate}>
              <Icon name='check'></Icon>
              {networkName}
            </Button>
          ) : (
            <Button floated='right' icon labelPosition='left' onClick={activateBrowserWallet} primary>
              <Icon name='plus square'></Icon>
              Connect MetaMask
            </Button>
          )}
        </Menu.Menu>
      </Menu>
      <br />
      <br />
      <SendMessage />
    </Container>
  );
};

export default MoonlinkDashboard;

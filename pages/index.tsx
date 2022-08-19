import React, { useEffect, useState } from 'react';
import { Container, Button, Icon, Menu } from 'semantic-ui-react';
import Head from 'next/head';
import SendMessage from '../components/SendMessage';
import Link from 'next/link';
import { MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai, useEthers } from '@usedapp/core';

const Dashboard = () => {
  // Initial State
  const { account, chainId, error, deactivate, activateBrowserWallet } = useEthers();
  const isConnected = account !== undefined;
  if (error) console.log(error.name);
  console.log(chainId);

  const networkName = (() => {
    if (chainId === undefined && error.name === 'ChainIdError') return 'Not Supported';
    switch (chainId) {
      case undefined: return 'Not Connected';
      case MoonbaseAlpha.chainId: return 'Moonbase Alpha';
      case FantomTestnet.chainId: return 'Fantom Testnet';
      case AvalancheTestnet.chainId: return 'Avalanche Fuji';
      case Mumbai.chainId: return 'Mumbai';
      default: return 'Not Supported';
    }
  })();

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

export default Dashboard;

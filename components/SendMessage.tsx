import React, { useState, useEffect } from 'react';
import { Button, Dropdown, DropdownItemProps, Grid, Input } from 'semantic-ui-react';
import { Chain, MoonbaseAlpha, FantomTestnet, AvalancheTestnet, useEthers, Mumbai } from '@usedapp/core';

const jobids = require('../ethereum/jobid');

const Table = () => {
  /*
  const [jobId, setJobId] = useState('');
  const [jobInfo, setJobInfo] = useState({
    value: 'N/A',
    updated: 'N/A',
    lastJobID: 'N/A',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
 
  useEffect(async () => {
    const getValue = async () => {
      try {
        // Date
        const currentdate = new Date();
 
        // Contract Fetch
        const clientAddress = '0x8ea35EdC1709ea0Ea2C86241C7D1C84Fd0dDeB11';
        const contractInstance = BMRInstance(clientAddress, 0);
        const value = (await contractInstance.currentPrice()) / 100;
 
        // Check if value is new to update data
        if (value != jobInfo.value) {
          // Get Job ID
          const lastJobID = await contractInstance.lastJobId();
          // Get Date
          const lastBlockTime = await contractInstance.lastBlockTime();
          const epoch = new Date(lastBlockTime.toNumber() * 1000);
          const date = `${epoch.getFullYear()}/
            ${('00' + (epoch.getMonth() + 1)).slice(-2)}/
            ${('00' + epoch.getDate()).slice(-2)} -- 
            ${('00' + epoch.getHours()).slice(-2)}:
            ${('00' + epoch.getMinutes()).slice(-2)}:
            ${('00' + epoch.getSeconds()).slice(-2)}`;
 
          // Update value, time and lastJobID
          setJobInfo({ value: value.toString(), updated: date, lastJobID: lastJobID });
        }
      } catch (error) {
        console.log(error);
      }
    };
    setInterval(async () => await getValue(), 5000);
  });
 
  const onSubmit = async (event) => {
    event.preventDefault();
 
    setLoading(true);
    setErrorMessage('');
 
    // Check Metamask and Chain ID
    if (typeof window.ethereum !== 'undefined' && ethereum.chainId === '0x507') {
      // Contract info
      const clientAddress = '0x8ea35EdC1709ea0Ea2C86241C7D1C84Fd0dDeB11';
      const contractInstance = BMRInstance(clientAddress, 1);
 
      // Hack to reset state of contract
      if (jobId === 'moonlinkreset') {
        try {
          await contractInstance.forceToTrue();
        } catch (err) {
          setLoading(false);
          setErrorMessage(err.message);
        }
        setLoading(false);
        return;
      } else {
        // Check if Job ID is supported
        for (let i in jobids) {
          if (jobids[i] === jobId) {
            // Check for ongoing request
            const check = await contractInstance.fulfillCheck();
 
            // Sends the Tx
            if (check) {
              try {
                await contractInstance.requestPrice(jobId);
              } catch (err) {
                setLoading(false);
                setErrorMessage(err.message);
              }
            } else {
              setLoading(false);
              setErrorMessage(
                `Request ${jobInfo.lastJobID} ongoing. Please wait until it is fulfilled`
              );
            }
            setLoading(false);
            return;
          }
        }
 
        // Error message because JobId not in the list
        setLoading(false);
        setErrorMessage('Job ID not supported');
      }
    } else {
      // Error message because MetaMask not found or Network Id not correct
      setLoading(false);
      setErrorMessage('Please install MetaMask or connect it to Moonbase Alpha');
    }
  };
  */

  const [message, setMessage] = useState<string>();
  const [origin, setOrigin] = useState<number>();
  const [destination, setDestination] = useState<number>();

  const chains: Chain[] = [MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai];
  const chainOptions: DropdownItemProps[] = [];
  chains.forEach(c => {
    chainOptions.push({ key: c.chainId, value: c.chainId, text: c.chainName, image: { avatar: true, src: `./logos/${c.chainName}.png` }});
  })


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
              onChange={(_, data) => setOrigin(data?.value as number)}
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
            <Button>Submit</Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
};

export default Table;

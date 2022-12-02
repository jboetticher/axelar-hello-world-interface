import React, { useState, useEffect } from 'react';
import {
  MoonbaseAlpha, BSCTestnet, AvalancheTestnet, Mumbai,
  useContractFunction, Params, Chain
} from '@usedapp/core';
import { ContractFunctionNames, Falsy, TransactionOptions, TransactionStatus, TypedContract } from '@usedapp/core/dist/esm/src/model';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import TransactionState from '../TransactionState';
import { LogDescription } from 'ethers/lib/utils';
import ConnectedContractModule from '../ConnectedContractModule';
import abi from './HyperlaneHelloWorldMessage.json';
import { HyperlaneCore, MultiProvider, objMap, chainConnectionConfigs, DispatchedMessage } from '@hyperlane-xyz/sdk';

const prodConfigs = {
  moonbasealpha: chainConnectionConfigs.moonbasealpha,
  mumbai: chainConnectionConfigs.mumbai,
  fuji: chainConnectionConfigs.fuji
};
// const signer = new Wallet(process.env.PRIVATE_KEY as string);
const chainProviders = objMap(prodConfigs, (_, config) => ({
  provider: config.provider,
  confirmations: config.confirmations,
  overrides: config.overrides,
  //signer: signer.connect(config.provider)
}));
const multiProvider = new MultiProvider(chainProviders);
const core = HyperlaneCore.fromEnvironment('testnet2', multiProvider);

export enum HyperlaneTransactionState {
  'None',
  'OriginPending',
  'OriginError',
  'HyperlanePending',
  'DestinationPending',
  'DestinationError',
  'Success'
};

const addresses = {
  [MoonbaseAlpha.chainId]: "0xDedC95A31c0a04175CeB9d31Da505D4592e2C1f3",
  [AvalancheTestnet.chainId]: "0xaf108eF646c8214c9DD9C13CBC5fadf964Bbe293"
};

/**
 * Extends usedapp's useContractFunction by expecting Axelar related
 * functionality.
 */
export function useHyperlaneFunction
  <T extends TypedContract, FN extends ContractFunctionNames<T>>(
    contract: T | Falsy,
    functionName: FN,
    options?: TransactionOptions
  ): {
    originState: TransactionStatus,
    send: (...args: Params<T, FN>) => Promise<TransactionReceipt | undefined>,  // todo
    originEvents: LogDescription[],
    resetState: () => void,
    transactionState: TransactionState,
    gmp?: any,
    state?: any
  } {
  const { state, send, events, resetState } = useContractFunction(contract, functionName, options);
  const [entireState, setEntireState] = useState<HyperlaneTransactionState>(HyperlaneTransactionState.None);
  const [crossChainMessages, setCrossChainMessages] = useState<DispatchedMessage[] | undefined>(undefined);
  const [destTxHash, setDestTxHash] = useState<string>("");

  // Rename to origin state
  const originState: TransactionStatus = state;

  // Watch origin state to ensure we're setting the right status
  useEffect(() => {
    // State switch to HyperlanePending
    if (originState.status == 'Mining') {
      setEntireState(HyperlaneTransactionState.OriginPending);
    }
    else if (originState.status == 'Success' && entireState === HyperlaneTransactionState.OriginPending) {
      setEntireState(HyperlaneTransactionState.HyperlanePending);

      // Begin coroutine to check message received status
      beginStatusCheck(state.receipt);
    }
    else if (originState.status == 'Exception' || originState.status == 'Fail') {
      setEntireState(HyperlaneTransactionState.OriginError);
    }
  }, [originState]);

  // Update status every 3 seconds
  async function beginStatusCheck(txReceipt: TransactionReceipt) {
    let waitForDest = false;
    while (1) {

      if (originState.transaction.hash == null) {
        setEntireState(HyperlaneTransactionState.OriginError);
        break;
      }
      else if (entireState == HyperlaneTransactionState.None) {
        // Can occur if function is reset, in which case we shouldn't be querying anymore
        break;
      }

      console.log(entireState, HyperlaneTransactionState.HyperlanePending, entireState < HyperlaneTransactionState.HyperlanePending);

      if(!waitForDest) {
        const dispatched = core.getDispatchedMessages(state.receipt);
        setCrossChainMessages(dispatched);
  
        if(dispatched != null && dispatched.length > 0) {
          setEntireState(HyperlaneTransactionState.DestinationPending);
          waitForDest = true;
        }
      }

      if(waitForDest) {
        console.log("starting to wait for message processing");
        const destStatus = await core.waitForMessageProcessing(txReceipt);

        if(destStatus.length <= 0) setEntireState(HyperlaneTransactionState.DestinationError);
        else {
          const destReceipt = destStatus[0];
          setDestTxHash(destReceipt.transactionHash);
          if(destReceipt.status == 1) setEntireState(HyperlaneTransactionState.Success);
          else setEntireState(HyperlaneTransactionState.DestinationError);
        }
        console.log(destStatus);
        break;
      }

      // Await for five seconds
      await new Promise((resolve, _) => setTimeout(resolve, 3000));
    }
  }

  // Replaces the previous reset state to update every state
  function newResetState() {
    setEntireState(HyperlaneTransactionState.None);
    setCrossChainMessages(undefined);
    setDestTxHash("");
    resetState();
  }

  // In case changing the function is required in the future. Doesn't do anything now
  function newSend(...args: Parameters<T["functions"][FN]>): Promise<TransactionReceipt> {
    console.log('beginning hyperlane send');
    return send(...args);
  }

  const stateIsError =
    entireState == HyperlaneTransactionState.OriginError ||
    entireState == HyperlaneTransactionState.DestinationError;
  const isLoading = 
    entireState != HyperlaneTransactionState.None &&
    entireState != HyperlaneTransactionState.Success &&
    !stateIsError;
  const originTxState = entireState == HyperlaneTransactionState.None ? '---' :
    entireState == HyperlaneTransactionState.OriginError ? 'ERROR' :
      entireState == HyperlaneTransactionState.OriginPending ? 'PENDING' : 'SUCCESS';
  const hyperlaneState = crossChainMessages == null ? '---' : 
    crossChainMessages.length == 0 ? 'PENDING' : 'SUCCESS';
  const destTxState = entireState < HyperlaneTransactionState.DestinationPending ? '---' : 
    entireState == HyperlaneTransactionState.DestinationError ? 'ERROR' :
    entireState == HyperlaneTransactionState.DestinationPending ? 'PENDING' : 'SUCCESS';

  const transactionState: TransactionState = {
    errorState: stateIsError,
    isLoading,
    hasMiddleman: true,
    originTxState,
    middlemanTxState: hyperlaneState,
    destTxState,
    destTxHash
  }
  console.log(entireState, transactionState);

  return {
    originState,
    send: newSend,
    originEvents: events,
    resetState: newResetState,
    state: entireState,
    transactionState
  };
}

/**
 * Converts a chainId to a Hyperlane domain
 * @param chainId The chain ID of the chain you want to send to.
 * @returns The name of a chain that Axelar can interprets
 */
export function chainIdToHyperlane(chainId: number): number {
  switch (chainId) {
    case MoonbaseAlpha.chainId: return 0x6d6f2d61;
    case AvalancheTestnet.chainId: return 43113;
    case Mumbai.chainId: return 80001;
    case BSCTestnet.chainId: return 0x62732d74;
  }
  throw new Error(`Chain ${chainId} is not supported!`);
}

export async function calculateAxelarGasFee(originId: number, destinationId: number) {
  // TODO: replace with SDK
  return "100000000000000000";
}

export default class HyperlaneModule extends ConnectedContractModule {
  abi = abi;
  addresses: { [x: number]: string } = addresses;
  calculateNativeGasFee = calculateAxelarGasFee;
  chains: Chain[] = [MoonbaseAlpha, AvalancheTestnet];
  protocolName = 'hyperlane';
  useCrossChainFunction = useHyperlaneFunction;
}
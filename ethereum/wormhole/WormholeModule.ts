import React, { useState, useEffect } from 'react';
import {
  MoonbaseAlpha, AvalancheTestnet, Mumbai, Goerli, FantomTestnet,
  useContractFunction, Params, Chain
} from '@usedapp/core';
import { ContractFunctionNames, Falsy, TransactionOptions, TransactionStatus, TypedContract } from '@usedapp/core/dist/esm/src/model';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import TransactionState from '../TransactionState';
import { LogDescription } from 'ethers/lib/utils';
import ConnectedContractModule from '../ConnectedContractModule';
import abi from './WormholeHelloWorldMessage.json';

export enum WormholeTransactionState {
  'None',
  'OriginPending',
  'OriginError',
  'Success'
};

const addresses = {
  [MoonbaseAlpha.chainId]: "0xfB7327Fe26aD52b693E38232E5D97F4892623075",
  [FantomTestnet.chainId]: "0xfB7327Fe26aD52b693E38232E5D97F4892623075",
  [Mumbai.chainId]: "0xfB7327Fe26aD52b693E38232E5D97F4892623075",
  [AvalancheTestnet.chainId]: "0xfB7327Fe26aD52b693E38232E5D97F4892623075",
  [Goerli.chainId]: "0xfB7327Fe26aD52b693E38232E5D97F4892623075"
};

/**
 * Extends usedapp's useContractFunction by expecting Axelar related
 * functionality.
 */
export function useWormholeFunction
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
  const [entireState, setEntireState] = useState<WormholeTransactionState>(WormholeTransactionState.None);
  // const [destTxHash, setDestTxHash] = useState<string>("");

  // Rename to origin state
  const originState: TransactionStatus = state;

  // Watch origin state to ensure we're setting the right status
  useEffect(() => {
    // State switch to HyperlanePending
    if (originState.status == 'Mining') {
      setEntireState(WormholeTransactionState.OriginPending);
    }
    else if (originState.status == 'Success' && entireState === WormholeTransactionState.OriginPending) {
      setEntireState(WormholeTransactionState.Success);

      // Begin coroutine to check message received status
      // beginStatusCheck(state.receipt);
    }
    else if (originState.status == 'Exception' || originState.status == 'Fail') {
      setEntireState(WormholeTransactionState.OriginError);
    }
  }, [originState]);

  // Update status every 3 seconds
  // async function beginStatusCheck(txReceipt: TransactionReceipt) {
  //   let waitForDest = false;
  //   while (1) {

  //     if (originState.transaction.hash == null) {
  //       setEntireState(WormholeTransactionState.OriginError);
  //       break;
  //     }
  //     else if (entireState == WormholeTransactionState.None) {
  //       // Can occur if function is reset, in which case we shouldn't be querying anymore
  //       break;
  //     }

  //     console.log(entireState, WormholeTransactionState.HyperlanePending, entireState < WormholeTransactionState.HyperlanePending);

  //     if(!waitForDest) {
  //       const dispatched = core.getDispatchedMessages(state.receipt);
  //       setCrossChainMessages(dispatched);
  
  //       if(dispatched != null && dispatched.length > 0) {
  //         setEntireState(WormholeTransactionState.DestinationPending);
  //         waitForDest = true;
  //       }
  //     }

  //     if(waitForDest) {
  //       console.log("starting to wait for message processing");
  //       const destStatus = await core.waitForMessageProcessing(txReceipt);

  //       if(destStatus.length <= 0) setEntireState(WormholeTransactionState.DestinationError);
  //       else {
  //         const destReceipt = destStatus[0];
  //         setDestTxHash(destReceipt.transactionHash);
  //         if(destReceipt.status == 1) setEntireState(WormholeTransactionState.Success);
  //         else setEntireState(WormholeTransactionState.DestinationError);
  //       }
  //       console.log(destStatus);
  //       break;
  //     }

  //     // Await for five seconds
  //     await new Promise((resolve, _) => setTimeout(resolve, 3000));
  //   }
  // }

  // Replaces the previous reset state to update every state
  function newResetState() {
    setEntireState(WormholeTransactionState.None);
    // setDestTxHash("");
    resetState();
  }

  // In case changing the function is required in the future. Doesn't do anything now
  function newSend(...args: Parameters<T["functions"][FN]>): Promise<TransactionReceipt> {
    console.log('beginning hyperlane send');
    return send(...args);
  }

  const stateIsError = entireState == WormholeTransactionState.OriginError;
  const isLoading = 
    entireState != WormholeTransactionState.None &&
    entireState != WormholeTransactionState.Success &&
    !stateIsError;
  const originTxState = entireState == WormholeTransactionState.None ? '---' :
    entireState == WormholeTransactionState.OriginError ? 'ERROR' :
      entireState == WormholeTransactionState.OriginPending ? 'PENDING' : 'SUCCESS';
  const wormholeState = '---';
  const destTxState = '---';

  const transactionState: TransactionState = {
    errorState: stateIsError,
    isLoading,
    hasMiddleman: false,
    originTxState,
    middlemanTxState: wormholeState,
    destTxState,
    destTxHash: ""
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
export function chainIdToWormhole(chainId: number): number {
  switch (chainId) {
    case Goerli.chainId: return 2;
    case Mumbai.chainId: return 5;
    case AvalancheTestnet.chainId: return 6;
    case FantomTestnet.chainId: return 10;
    case MoonbaseAlpha.chainId: return 16;
  }
  throw new Error(`Chain ${chainId} is not supported!`);
}

export async function calculateGasFee(originId: number, destinationId: number) {
  // Wormhole relayers are the ones paying
  return "0";
}

export default class HyperlaneModule extends ConnectedContractModule {
  abi = abi;
  addresses: { [x: number]: string } = addresses;
  calculateNativeGasFee = calculateGasFee;
  chains: Chain[] = [MoonbaseAlpha, FantomTestnet, AvalancheTestnet];
  protocolName = 'wormhole';
  useCrossChainFunction = useWormholeFunction;
}
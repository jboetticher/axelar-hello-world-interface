import React, { useState, useEffect } from 'react';
import {
  MoonbaseAlpha, BSCTestnet, AvalancheTestnet, Mumbai, FantomTestnet,
  useContractFunction, Params, Chain
} from '@usedapp/core';
import { ContractFunctionNames, Falsy, TransactionOptions, TransactionStatus, TypedContract } from '@usedapp/core/dist/esm/src/model';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import TransactionState from '../TransactionState';
import { LogDescription } from 'ethers/lib/utils';
import ConnectedContractModule from '../ConnectedContractModule';
import abi from './LayerZeroHelloWorldMessage.json';
import { createClient } from './client';

const client = createClient('testnet');

export enum LayerZeroTransactionState {
  'None',
  'OriginPending',
  'OriginError',
  'LayerZeroPending',
  'DestinationError',
  'Success'
};

const addresses = {
  [MoonbaseAlpha.chainId]: "0x95e0B8CFcFbac0Ee92B5064A108aA02f68E622d6",
  [FantomTestnet.chainId]: "0x5d9fa4E09AC085d3281c7bbC433e2B9500bD9923"
};

/**
 * Extends usedapp's useContractFunction by expecting Axelar related
 * functionality.
 */
function useLayerZeroFunction
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
  const [entireState, setEntireState] = useState<LayerZeroTransactionState>(LayerZeroTransactionState.None);
  const [destTxHash, setDestTxHash] = useState<string>("");

  // Rename to origin state
  const originState: TransactionStatus = state;

  // Watch origin state to ensure we're setting the right status
  useEffect(() => {
    if (originState.status == 'Mining') {
      setEntireState(LayerZeroTransactionState.OriginPending);
    }
    else if (originState.status == 'Success' && entireState === LayerZeroTransactionState.OriginPending) {
      beginStatusCheck(state.receipt);
    }
    else if (originState.status == 'Exception' || originState.status == 'Fail') {
      setEntireState(LayerZeroTransactionState.OriginError);
    }
  }, [originState]);

  // Update status every 3 seconds
  async function beginStatusCheck(txReceipt: TransactionReceipt) {
    let waitForDest = false;
    while (1) {

      if (originState.transaction.hash == null) {
        setEntireState(LayerZeroTransactionState.OriginError);
        break;
      }
      else if (entireState == LayerZeroTransactionState.None) {
        // Can occur if function is reset, in which case we shouldn't be querying anymore
        break;
      }

      // Query LayerZero for status
      const lzQuery = await client.getMessagesBySrcTxHash(state.receipt?.transactionHash);

      // Set state
      if (lzQuery.messages.length <= 0) {
        setEntireState(LayerZeroTransactionState.OriginPending);
      }
      else {
        switch (lzQuery.messages[0].status) {
          case "INFLIGHT":
            if (entireState != LayerZeroTransactionState.LayerZeroPending)
              setEntireState(LayerZeroTransactionState.LayerZeroPending);
            break;
          // TODO: set destination transaction hash somewhere
          case "DELIVERED":
            setEntireState(LayerZeroTransactionState.Success);
            setDestTxHash(lzQuery.messages[0].dstTxHash);
            return;
          case "FAILED":
            setEntireState(LayerZeroTransactionState.DestinationError);
            return;
        }
      }

      // Await for five seconds
      await new Promise((resolve, _) => setTimeout(resolve, 3000));
    }
  }

  // Replaces the previous reset state to update every state
  function newResetState() {
    setEntireState(LayerZeroTransactionState.None);
    setDestTxHash("");
    resetState();
  }

  // In case changing the function is required in the future. Doesn't do anything now
  function newSend(...args: Parameters<T["functions"][FN]>): Promise<TransactionReceipt> {
    console.log('beginning hyperlane send');
    return send(...args);
  }

  const stateIsError =
    entireState == LayerZeroTransactionState.OriginError ||
    entireState == LayerZeroTransactionState.DestinationError;
  const isLoading =
    entireState != LayerZeroTransactionState.None &&
    entireState != LayerZeroTransactionState.Success &&
    !stateIsError;
  const originTxState = entireState == LayerZeroTransactionState.None ? '---' :
    entireState == LayerZeroTransactionState.OriginError ? 'ERROR' :
      entireState == LayerZeroTransactionState.OriginPending ? 'PENDING' : 'SUCCESS';
  const lzState =
    entireState < LayerZeroTransactionState.LayerZeroPending ? '---' :
      entireState == LayerZeroTransactionState.LayerZeroPending ? 'PENDING' : 'SUCCESS';
  const destTxState =
    entireState < LayerZeroTransactionState.DestinationError ? '---' :
      entireState == LayerZeroTransactionState.DestinationError ? 'ERROR' : 'SUCCESS';

  const transactionState: TransactionState = {
    errorState: stateIsError,
    isLoading,
    hasMiddleman: false,
    originTxState,
    middlemanTxState: lzState,
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
export function chainIdToLayerZero(chainId: number): number {
  switch (chainId) {
    case MoonbaseAlpha.chainId: return 10126;
    case AvalancheTestnet.chainId: return 10106;
    case Mumbai.chainId: return 10109;
    case BSCTestnet.chainId: return 10102;
    case FantomTestnet.chainId: return 10112;
  }
  throw new Error(`Chain ${chainId} is not supported!`);
}

export async function calculateLayerZeroGasFee(originId: number, destinationId: number) {
  // TODO: replace with https://layerzero.gitbook.io/docs/evm-guides/code-examples/estimating-message-fees
  return "100000000000000000";
}

export default class LayerZeroModule extends ConnectedContractModule {
  abi = abi;
  addresses: { [x: number]: string } = addresses;
  calculateNativeGasFee = calculateLayerZeroGasFee;
  chains: Chain[] = [MoonbaseAlpha, FantomTestnet];
  protocolName = 'layerzero';
  useCrossChainFunction = useLayerZeroFunction;
}
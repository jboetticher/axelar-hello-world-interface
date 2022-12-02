import React, { useState, useEffect } from 'react';
import {
  MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai,
  useContractFunction, Params, Chain
} from '@usedapp/core';
import { ContractFunctionNames, Falsy, TransactionOptions, TransactionStatus, TypedContract } from '@usedapp/core/dist/esm/src/model';
import { AxelarGMPRecoveryAPI, Environment, GMPStatus, GMPStatusResponse, AxelarQueryAPI, EvmChain } from '@axelar-network/axelarjs-sdk';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import TransactionState from '../TransactionState';
import { LogDescription } from 'ethers/lib/utils';
import ConnectedContractModule from '../ConnectedContractModule';
import addresses from './addresses';
import abi from './AxelarHelloWorldMessage.json';
import { tokenName } from './axelarHelpers';

export enum AxelarTransactionState {
  'None',
  'OriginPending',
  'OriginError',
  'AxelarPending',
  'AxelarError',
  'DestinationPending',
  'DestinationError',
  'Success'
};

/**
 * Extends usedapp's useContractFunction by expecting Axelar related
 * functionality.
 */
export function useAxelarFunction
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
  let [entireState, setEntireState] = useState<AxelarTransactionState>(AxelarTransactionState.None);
  let [gmp, setGMP] = useState<GMPStatusResponse>(null);
  let [destTx, setDestTx] = useState(null); // This is necessary because of the foolish antipattern

  // Rename to origin state
  const originState: TransactionStatus = state;

  // Watch state to ensure we're setting the right status
  useEffect(() => {
    // State switch to AxelarPending
    if (originState.status == 'Mining') {
      setEntireState(AxelarTransactionState.OriginPending);
    }
    else if (originState.status == 'Success' && entireState === AxelarTransactionState.OriginPending) {
      setEntireState(AxelarTransactionState.AxelarPending);

      // Begin coroutine to check Axelar status
      beginAxelarStatusCheck();
    }
    else if (originState.status == 'Exception' || originState.status == 'Fail') {
      setEntireState(AxelarTransactionState.OriginError);
    }
  }, [originState]);

  // Update Axelar status every 5 seconds
  async function beginAxelarStatusCheck() {
    const sdk = new AxelarGMPRecoveryAPI({ environment: Environment.TESTNET });

    while (1) {
      if (originState.transaction.hash == null) {
        setEntireState(AxelarTransactionState.OriginError);
        break;
      }
      else if (entireState == AxelarTransactionState.None) {
        // Can occur if function is reset, in which case we shouldn't be querying anymore
        break;
      }

      const gmpRes = await sdk.queryTransactionStatus(originState.transaction?.hash);
      setGMP(gmpRes);

      if (gmpRes.status == GMPStatus.CANNOT_FETCH_STATUS) {
        setEntireState(AxelarTransactionState.AxelarError);
      }
      else if (gmpRes.status == GMPStatus.DEST_EXECUTE_ERROR) {
        setEntireState(AxelarTransactionState.DestinationError);
      }
      else if (gmpRes.status == GMPStatus.DEST_GATEWAY_APPROVED) {
        setEntireState(AxelarTransactionState.DestinationPending);
      }
      else if (gmpRes.status == GMPStatus.DEST_EXECUTED) {
        setEntireState(AxelarTransactionState.Success);
        break;
      }

      // Await for five seconds
      await new Promise((resolve, _) => setTimeout(resolve, 5000));
    }
  }

  // Replaces the previous reset state to update every state
  function newResetState() {
    setEntireState(AxelarTransactionState.None);
    setGMP(null);
    setDestTx(null);
    resetState();
  }

  // In case changing the function is required in the future. Doesn't do anything now
  function newSend(...args: Parameters<T["functions"][FN]>): Promise<TransactionReceipt> {
    return send(...args);
  }

  const axelarStateIsError =
    entireState == AxelarTransactionState.OriginError ||
    entireState == AxelarTransactionState.AxelarError ||
    entireState == AxelarTransactionState.DestinationError;
  const isLoading = (
    entireState != AxelarTransactionState.None &&
    entireState != AxelarTransactionState.Success &&
    !axelarStateIsError);
  const originTxState = entireState == AxelarTransactionState.None ? '---' :
    entireState == AxelarTransactionState.OriginError ? 'ERROR' :
      entireState == AxelarTransactionState.OriginPending ? 'PENDING' : 'SUCCESS';
  const axelarTxState = gmp == null ? '---' :
    entireState == AxelarTransactionState.AxelarError ? 'ERROR' :
      entireState == AxelarTransactionState.AxelarPending ? 'PENDING' : 'SUCCESS';
  const destTxState = gmp == null || entireState < AxelarTransactionState.DestinationPending ? '---' :
    entireState == AxelarTransactionState.DestinationError ? 'ERROR' :
      entireState == AxelarTransactionState.DestinationPending ? 'PENDING' : 'SUCCESS';
  const transactionState: TransactionState = {
    errorState: axelarStateIsError,
    isLoading,
    hasMiddleman: true,
    originTxState,
    middlemanTxState: axelarTxState,
    destTxState
  }

  return {
    originState,
    send: newSend,
    originEvents: events,
    resetState: newResetState,
    state: entireState,
    gmp,
    transactionState
  };
}

/**
 * Converts a chainId to a string that Axelar's contract can interpet
 * @param chainId The chain ID of the chain you want to send to.
 * @returns The name of a chain that Axelar can interprets
 */
export function chainIdToAxelar(chainId: number): EvmChain {
  switch (chainId) {
    case MoonbaseAlpha.chainId: return EvmChain.MOONBEAM;
    case FantomTestnet.chainId: return EvmChain.FANTOM;
    case AvalancheTestnet.chainId: return EvmChain.AVALANCHE;
    case Mumbai.chainId: return EvmChain.POLYGON;
  }
  throw new Error(`Chain ${chainId} is not supported!`);
}

export async function calculateAxelarGasFee(originId: number, destinationId: number) {
  const axelarSDK = new AxelarQueryAPI({ environment: Environment.TESTNET });
  const estimateGasUsed = 200000;
  return await axelarSDK.estimateGasFee(
    chainIdToAxelar(originId),
    chainIdToAxelar(destinationId),
    tokenName(originId),
    estimateGasUsed
  );
}

export default class AxelarModule extends ConnectedContractModule {
  abi = abi;
  addresses: { [x: number]: string } = addresses;
  calculateNativeGasFee = calculateAxelarGasFee;
  chains: Chain[] = [MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai];
  protocolName = 'axelar';
  useCrossChainFunction = useAxelarFunction;
}
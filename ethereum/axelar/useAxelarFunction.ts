import React, { useState, useEffect } from 'react';
import { useContractFunction } from '@usedapp/core';
import { ContractFunctionNames, Falsy, TransactionOptions, TransactionStatus, TypedContract } from '@usedapp/core/dist/esm/src/model';
import { AxelarGMPRecoveryAPI, Environment, GMPStatus, GMPStatusResponse, AxelarQueryAPI } from '@axelar-network/axelarjs-sdk';
import { TransactionReceipt } from '@ethersproject/abstract-provider';

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
export default function useAxelarFunction
  <T extends TypedContract, FN extends ContractFunctionNames<T>>(
    contract: T | Falsy,
    functionName: FN,
    options?: TransactionOptions
  ) {
  const { state, send, events, resetState } = useContractFunction(contract, functionName, options);
  let [entireState, setEntireState] = useState<AxelarTransactionState>(AxelarTransactionState.None);
  let [gmp, setGMP] = useState<GMPStatusResponse>(null);

  // Rename to origin state
  const originState: TransactionStatus = state;

  // Watch state to ensure we're setting the right status
  useEffect(() => {
    // State switch to AxelarPending
    if(originState.status == 'Mining') {
      setEntireState(AxelarTransactionState.OriginPending);
    }
    else if (originState.status == 'Success' && entireState === AxelarTransactionState.OriginPending) {
      setEntireState(AxelarTransactionState.AxelarPending);

      // Begin coroutine to check Axelar status
      beginAxelarStatusCheck();
    }
    else if(originState.status == 'Exception' || originState.status == 'Fail') {
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
      else if(entireState == AxelarTransactionState.None) {
        // Can occur if function is reset, in which case we shouldn't be querying anymore
        break;
      }

      const gmpRes = await sdk.queryTransactionStatus(originState.transaction?.hash);
      setGMP(gmpRes);
      console.log(await sdk.queryExecuteParams(originState.transaction?.hash));

      if(gmpRes.status == GMPStatus.CANNOT_FETCH_STATUS) {
        setEntireState(AxelarTransactionState.AxelarError);
      }
      else if(gmpRes.status == GMPStatus.DEST_EXECUTE_ERROR) {
        setEntireState(AxelarTransactionState.DestinationError);
      }
      else if(gmpRes.status == GMPStatus.DEST_GATEWAY_APPROVED) {
        setEntireState(AxelarTransactionState.DestinationPending);
      }
      else if(gmpRes.status == GMPStatus.DEST_EXECUTED) {
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
    resetState();
  }

  // In case changing the function is required in the future. Doesn't do anything now
  function newSend(...args: Parameters<T["functions"][FN]>): Promise<TransactionReceipt> {
    return send(...args);
  }

  return {
    originState,
    send: newSend,
    originEvents: events,
    resetState: newResetState,
    state: entireState,
    gmp
  };
}
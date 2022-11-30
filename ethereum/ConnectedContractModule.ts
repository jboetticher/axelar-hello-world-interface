import { Chain } from "@usedapp/core"
import { ContractFunctionNames, Falsy, TransactionOptions, TransactionStatus, TypedContract } from '@usedapp/core/dist/esm/src/model';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { Params } from '@usedapp/core';
import { LogDescription } from 'ethers/lib/utils';
import { Fragment, JsonFragment } from '@ethersproject/abi'
import TransactionState from "./TransactionState";

abstract class ConnectedContractModule {
  /**
   * The chains that this connected contract module should be able to connect to.
   */
  abstract chains: Chain[];

  /**
   * The addresses of the deployed connected contracts in this provider (this is a peer-to-peer project)
   */
  abstract addresses: {[x: number]: string};

  /**
   * The abi specific to the connected contract protocol.
   */
  abstract abi: string | ReadonlyArray<Fragment | JsonFragment | string>;

  /**
   * An extension of useDapp's useContractFunction that also monitors the cross-chain transaction state
   * 
   * @dev NOTE: as it currently stands, the system relies on an antipattern of conditionally using react hooks. This
   * breaks the rules of React hooks, but the system will not throw an error until hook order has been changed. Thus,
   * to implement this hook, the order of hooks MUST be: useContractFunction, useState, useState, useState, useEffect.
   *
   * @todo Replace antipattern with a context-based system that injects state functions so that components are modular 
   * instead of relying only on hooks
   * 
   * The idea is to:
   * 1. Put all of the data that would be returned by useCrossChainFunction into a context object
   * 2. Replace this abstract hook with a component that can be conditionally rendered
   * 3. The component that is conditionally rendered will set the context
   */
  abstract useCrossChainFunction: <T extends TypedContract, FN extends ContractFunctionNames<T>>(
    contract: T | Falsy,
    functionName: FN,
    options?: TransactionOptions
  ) => {
    originState: TransactionStatus,
    send: (...args: Params<T, FN>) => Promise<TransactionReceipt | undefined>,  // todo
    originEvents: LogDescription[],
    resetState: () => void,
    transactionState: TransactionState,
    gmp?: any,
    state?: any
  };

  /**
   * A function that calculates the gas fee
   */
  abstract calculateNativeGasFee: (originId: number, destinationId: number) => Promise<string>;
}
export default ConnectedContractModule;

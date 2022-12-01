import { Chain } from "@usedapp/core"
import { ContractFunctionNames, Falsy, TransactionOptions, TransactionStatus, TypedContract } from '@usedapp/core/dist/esm/src/model';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { Params } from '@usedapp/core';
import { LogDescription } from 'ethers/lib/utils';
import { Fragment, JsonFragment } from '@ethersproject/abi'
import TransactionState from "./TransactionState";
import React from "react";

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

  abstract CrossChainConfigurer: (...args) => React.ReactNode;

  /**
   * A function that calculates the gas fee
   */
  abstract calculateNativeGasFee: (originId: number, destinationId: number) => Promise<string>;
}
export default ConnectedContractModule;

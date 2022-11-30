import { Params } from "@usedapp/core"
import { ContractFunctionNames, TransactionStatus, TypedContract } from '@usedapp/core/dist/esm/src/model';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { LogDescription } from 'ethers/lib/utils';
import TransactionState from "../ethereum/TransactionState";
import { createContext, useState } from 'react';

type CrossChainFunctionContextData = {
    originState: TransactionStatus,
    send: (...args: Params<TypedContract, ContractFunctionNames<TypedContract>>) => Promise<TransactionReceipt | undefined>,  // todo
    originEvents: LogDescription[],
    resetState: () => void,
    transactionState: TransactionState,
    gmp?: any,
    state?: any
}

const CrossChainFunctionContext = createContext<{
    data: CrossChainFunctionContextData,
    setData: (data: CrossChainFunctionContextData) => void
} | undefined>(undefined);

export const ConnectedContractContextProvider = ({ children }) => {
    // the value that will be given to the context
    const [contextData, setContextData] = useState<CrossChainFunctionContextData | undefined>(undefined);

    return (
        // the Provider gives access to the context to its children
        <CrossChainFunctionContext.Provider value={{ data: contextData, setData: setContextData }}>
            {children}
        </CrossChainFunctionContext.Provider>
    );
};

export default CrossChainFunctionContext;
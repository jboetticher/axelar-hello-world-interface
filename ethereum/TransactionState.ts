type TransactionState = {
    errorState: boolean,
    isLoading: boolean,
    hasMiddleman: boolean,
    originTxState: 'ERROR' | 'PENDING' | 'SUCCESS' | '---',
    middlemanTxState?: 'ERROR' | 'PENDING' | 'SUCCESS' | '---',
    destTxState: 'ERROR' | 'PENDING' | 'SUCCESS' | '---',
};

export default TransactionState;
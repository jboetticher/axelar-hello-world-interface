// https://www.npmjs.com/package/@layerzerolabs/scan-client

import axios from 'axios';

const URLS = {
    testnet: 'https://api-testnet.layerzero-scan.com',
    mainnet: 'https://api-mainnet.layerzero-scan.com',
    sandbox: 'https://api-sandbox.layerzero-scan.com',
};
export const createClient = (env: Environment, options?: ClientOptions | undefined) => {
    const url = URLS[env];
    if (!url)
        throw new Error(`No endpoint for env ${env}`);
    const client = axios.create({
        baseURL: url,
    });
    return {
        async getMessagesBySrcTxHash(srcTxHash: string): Promise<GetMessagesBySrcTxHashResponse> {
            if (!srcTxHash)
                throw new Error('srcTxHash must be provided');
            const { data } = await client.get(`/tx/${srcTxHash}`);
            return data;
        },
    };
};

export declare type Environment = 'testnet' | 'mainnet' | 'sandbox';
export declare type ClientOptions = {};
export declare type Message = {
    srcUaAddress: string;
    dstUaAddress: string;
    srcChainId: number;
    dstChainId: number;
    dstTxHash?: string;
    dstTxError?: string;
    srcTxHash: string;
    srcBlockHash: string;
    srcBlockNumber: string;
    srcUaNonce: number;
    status: 'INFLIGHT' | 'DELIVERED' | 'FAILED';
};
declare type GetMessagesBySrcTxHashResponse = {
    messages: Message[];
};
import {
    Mainnet,
    DAppProvider,
    useEtherBalance,
    useEthers,
    Config
} from '@usedapp/core';


const config = {
    readOnlyChainId: 1287,
    readOnlyUrls: {
        [Mainnet.chainId]: 'https://mainnet.infura.io/v3/62687d1a985d4508b2b7a24827551934',
        [1287]: '<url of the custom chain>',
    },
    networks: []
}
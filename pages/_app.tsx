import './styles.css'
import { DAppProvider, Config, MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai, Chain } from '@usedapp/core';
import { ConnectedContractContextProvider } from '../components/ConnectedContractContext';

// https://github.com/TrueFiEng/useDApp/blob/master/packages/example-next/providers/Providers.tsx
export const config: Config = {
  readOnlyChainId: MoonbaseAlpha.chainId,
  readOnlyUrls: {
    [MoonbaseAlpha.chainId]: 'https://rpc.api.moonbase.moonbeam.network',
    [FantomTestnet.chainId]: 'https://rpc.testnet.fantom.network/',
    [AvalancheTestnet.chainId]: 'https://api.avax-test.network/ext/bc/C/rpc',
    [Mumbai.chainId]: 'https://matic-mumbai.chainstacklabs.com'
  },
  networks: [
    { ...MoonbaseAlpha, rpcUrl: 'https://rpc.api.moonbase.moonbeam.network' },
    { ...FantomTestnet, rpcUrl: 'https://rpc.testnet.fantom.network/' },
    { ...AvalancheTestnet, rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc' },
    { ...Mumbai, rpcUrl: 'https://matic-mumbai.chainstacklabs.com' }
  ]
}

export default function MyApp({ Component, pageProps }) {
  return (
    <DAppProvider config={config}>
      <ConnectedContractContextProvider>
        <Component {...pageProps} />
      </ConnectedContractContextProvider>
    </DAppProvider>
  )
}

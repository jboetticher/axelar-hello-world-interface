import './styles.css'
import { DAppProvider, Config, MoonbaseAlpha, FantomTestnet, AvalancheTestnet, Mumbai } from '@usedapp/core';

// https://github.com/TrueFiEng/useDApp/blob/master/packages/example-next/providers/Providers.tsx
export const config: Config = {
  readOnlyChainId: MoonbaseAlpha.chainId,
  readOnlyUrls: {
    [MoonbaseAlpha.chainId]: 'https://rpc.api.moonbase.moonbeam.network',
    [FantomTestnet.chainId]: 'https://rpc.testnet.fantom.network/',
    [AvalancheTestnet.chainId]: 'https://api.avax-test.network/ext/bc/C/rpc',
    [Mumbai.chainId]: 'https://matic-mumbai.chainstacklabs.com'
  }
}

export default function MyApp({ Component, pageProps }) {
  return (
    <DAppProvider config={config}>
      <Component {...pageProps} />
    </DAppProvider>
  )
}

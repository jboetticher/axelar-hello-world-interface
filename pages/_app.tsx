import './styles.css'
import { DAppProvider, Config, MoonbaseAlpha, FantomTestnet } from '@usedapp/core';
/*
const MoonbaseAlphaChain: Chain = {
  chainId: 1287,
  chainName: 'Moonbase Alpha',
  isTestChain: true,
  isLocalChain: false,
  multicallAddress: '0x4E2cfca20580747AdBA58cd677A998f8B261Fc21',
  getExplorerAddressLink: (address: string) => `https://moonbase.moonscan.io/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://moonbase.moonscan.io/tx/${transactionHash}`,
  rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
  blockExplorerUrl: 'https://moonbase.moonscan.io',
  nativeCurrency: {
    name: 'DEV',
    symbol: 'DEV',
    decimals: 18,
  }
}
*/

// https://github.com/TrueFiEng/useDApp/blob/master/packages/example-next/providers/Providers.tsx
const config: Config = {
  readOnlyChainId: MoonbaseAlpha.chainId,
  readOnlyUrls: {
    [MoonbaseAlpha.chainId]: 'https://rpc.api.moonbase.moonbeam.network',
  }
}

export default function MyApp({ Component, pageProps }) {
  return (
    <DAppProvider config={config}>
      <Component {...pageProps} />
    </DAppProvider>
  )
}

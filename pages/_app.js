import './styles.css'
import { Mainnet, DAppProvider } from '@usedapp/core';

// https://github.com/TrueFiEng/useDApp/blob/master/packages/example-next/providers/Providers.tsx
const config = {
  /*readOnlyChainId: Mainnet.chainId,
  readOnlyUrls: {
    [Mainnet.chainId]: getDefaultProvider('mainnet'),
  }*/
}

export default function MyApp({ Component, pageProps }) {
  return (
    <DAppProvider config={config}>
      <Component {...pageProps} />
    </DAppProvider>
  )
}
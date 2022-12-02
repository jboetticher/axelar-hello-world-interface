import React, { useEffect, useState } from 'react';
import SendMessage from '../components/SendMessage';
import PageWrapper from '../components/PageWrapper';
import LayerZeroModule from '../ethereum/layerzero/LayerZeroModule';
import HyperlaneModule from '../ethereum/hyperlane/HyperlaneModule';

const LayerZeroPage = () => {

  const module = new LayerZeroModule();
  

  return (
    <PageWrapper name="LayerZero">
      <h4 style={{ color: "orange", textAlign: 'center' }}>There is currently no SDK to poll for destination transaction status on LayerZero.</h4>
      <SendMessage currentModule={module} />
    </PageWrapper>
  );
};

export default LayerZeroPage;
import React, { useEffect, useState } from 'react';
import SendMessage from '../components/SendMessage';
import PageWrapper from '../components/PageWrapper';
import LayerZeroModule from '../ethereum/layerzero/LayerZeroModule';

const LayerZeroPage = () => {

  const module = new LayerZeroModule();
  

  return (
    <PageWrapper name="LayerZero">
      <SendMessage currentModule={module} />
    </PageWrapper>
  );
};

export default LayerZeroPage;
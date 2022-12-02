import React, { useEffect, useState } from 'react';
import SendMessage from '../components/SendMessage';
import PageWrapper from '../components/PageWrapper';
import HyperlaneModule from '../ethereum/hyperlane/HyperlaneModule';

const HyperlanePage = () => {

  const module = new HyperlaneModule();

  return (
    <PageWrapper name="Hyperlane">
      <SendMessage currentModule={module} />
    </PageWrapper>
  );
};

export default HyperlanePage;
import React, { useEffect, useState } from 'react';
import SendMessage from '../components/SendMessage';
import PageWrapper from '../components/PageWrapper';
import WormholeModule from '../ethereum/wormhole/WormholeModule';

const WormholePage = () => {

  const module = new WormholeModule();
  
  return (
    <PageWrapper name="Wormhole">
      <p style={{ color: "orange", textAlign: 'center', marginBottom: '16px' }}>There is no simple way of tracking Wormhole transactions. In your implementation, you may opt to add an additional database and API to your relayer to store relations between origin and destination transactions.</p>
      <SendMessage currentModule={module} />
    </PageWrapper>
  );
};

export default WormholePage;
import React, { useEffect, useState } from 'react';
import SendMessage from '../components/SendMessage';
import PageWrapper from '../components/PageWrapper';
import AxelarModule from '../ethereum/axelar/AxelarModule';

const AxelarPage = () => {

  const module = new AxelarModule();

  return (
    <PageWrapper>
      <SendMessage currentModule={module} />
    </PageWrapper>
  );
};

export default AxelarPage;

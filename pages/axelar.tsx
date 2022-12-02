import React, { useEffect, useState } from 'react';
import SendMessage from '../components/SendMessage';
import PageWrapper from '../components/PageWrapper';

const Dashboard = () => {
  return (
    <PageWrapper>
      <SendMessage />
    </PageWrapper>
  );
};

export default Dashboard;

import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useTransaction } from '../contexts/TransactionContext';
import StatsPanel from './sidebar/StatsPanel';
import ApiStatus from './sidebar/ApiStatus';
import RecentRecords from './sidebar/RecentRecords';

const Sidebar = () => {
  const { wallet } = useWallet();
  const { records, stats } = useTransaction();

  return (
    <div className="space-y-6">
      <StatsPanel wallet={wallet} stats={stats} />
      <ApiStatus />
      <RecentRecords records={records} />
    </div>
  );
};

export default Sidebar;
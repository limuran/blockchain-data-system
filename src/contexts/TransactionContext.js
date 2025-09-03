import React, { createContext, useContext, useState } from 'react';

const TransactionContext = createContext();

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ tx: 0, data: 0 });
  const [contractAddress, setContractAddress] = useState('');

  const addRecord = (record) => {
    const newRecord = {
      ...record,
      id: Date.now(),
      time: new Date().toLocaleString()
    };
    
    setRecords(prev => [newRecord, ...prev.slice(0, 9)]);
    setStats(prev => ({ 
      tx: prev.tx + 1, 
      data: prev.data + (record.data ? 1 : 0) 
    }));
  };

  const clearRecords = () => {
    setRecords([]);
    setStats({ tx: 0, data: 0 });
  };

  const value = {
    records,
    stats,
    contractAddress,
    setContractAddress,
    addRecord,
    clearRecords
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
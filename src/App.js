import React, { useState } from 'react';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Sidebar from './components/Sidebar';
import Toast from './components/ui/Toast';
import Progress from './components/ui/Progress';
import { WalletProvider } from './contexts/WalletContext';
import { TransactionProvider } from './contexts/TransactionContext';
import './styles/App.css';

function App() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [progress, setProgress] = useState({ show: false, title: '', step: 0 });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const showProgress = (title) => {
    setProgress({ show: true, title, step: 0 });
  };

  const updateProgress = (step) => {
    setProgress(prev => ({ ...prev, step }));
  };

  const hideProgress = () => {
    setProgress({ show: false, title: '', step: 0 });
  };

  return (
    <WalletProvider>
      <TransactionProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
          <Toast {...toast} onHide={hideToast} />
          <Progress {...progress} onHide={hideProgress} />
          
          <div className="container mx-auto p-6 max-w-7xl">
            <Header showToast={showToast} showProgress={showProgress} updateProgress={updateProgress} hideProgress={hideProgress} />
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <MainContent 
                  showToast={showToast} 
                  showProgress={showProgress} 
                  updateProgress={updateProgress} 
                  hideProgress={hideProgress} 
                />
              </div>
              <div>
                <Sidebar />
              </div>
            </div>
          </div>
        </div>
      </TransactionProvider>
    </WalletProvider>
  );
}

export default App;
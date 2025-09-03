import React, { useEffect } from 'react';

const Toast = ({ message, type, show, onHide }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  const styles = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
  };

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${styles[type]} border-l-4 p-4 rounded-lg shadow-lg max-w-sm`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <span className="mr-2">{icons[type]}</span>
            <span className="text-sm font-medium">{message}</span>
          </div>
          <button
            onClick={onHide}
            className="ml-4 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
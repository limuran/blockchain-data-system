import React from 'react';

const Progress = ({ show, title, step, onHide }) => {
  if (!show) return null;

  const steps = ['🔄 初始化', '✅ 验证参数', '📡 广播交易', '🎉 确认完成'];
  const progress = (step / 4) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass rounded-2xl p-8 min-w-96 relative">
        <button
          onClick={onHide}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
        <h3 className="text-xl font-bold text-center mb-6">{title}</h3>

        <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center"
            style={{ width: `${progress}%` }}
          >
            {progress > 15 && (
              <span className="text-white text-xs font-bold">
                {Math.round(progress)}%
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((text, i) => (
            <div
              key={i}
              className={`flex items-center p-3 rounded-lg transition-all ${
                i < step
                  ? 'bg-green-50 border-l-4 border-green-500'
                  : i === step
                  ? 'bg-blue-50 border-l-4 border-blue-500'
                  : 'bg-gray-50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-300'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Progress;
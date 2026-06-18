import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium text-sm">FlowPilot đang tải...</p>
      </div>
    </div>
  );
};

export default Loading;

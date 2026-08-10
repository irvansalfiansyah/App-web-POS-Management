import React from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed bottom-4 right-4 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between space-x-4 ${bgColors[type] || bgColors.info}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="font-bold hover:opacity-75">
          ✕
        </button>
      )}
    </div>
  );
};

export default Toast;

import React from 'react';

interface LoadingProps {
  message?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = "Loading...", className = "" }) => {
  return (
    <div className={`text-center my-4 ${className}`}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-2">{message}</p>
    </div>
  );
};

export default Loading;

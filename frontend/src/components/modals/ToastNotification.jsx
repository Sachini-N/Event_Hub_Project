import React from 'react';

export default function ToastNotification({ toast }) {
  if (!toast || !toast.visible) return null;

  return (
    <div className="toast">
      <i className="fa-solid fa-circle-info toast-icon"></i>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}

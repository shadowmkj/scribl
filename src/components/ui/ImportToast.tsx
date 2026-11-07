import React, { useEffect } from 'react';

export interface ImportNotification {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface ImportToastProps {
  notification: ImportNotification | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const ImportToast: React.FC<ImportToastProps> = ({
  notification,
  onDismiss,
  autoDismissMs = 6000,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [notification, onDismiss, autoDismissMs]);

  if (!notification) return null;

  const isWarning = notification.type === 'warning';
  const isError = notification.type === 'error';

  return (
    <div
      role='status'
      aria-live='polite'
      style={{
        position: 'fixed',
        top: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'var(--color-panel-bg, rgba(15, 23, 42, 0.88))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${
          isError
            ? 'rgba(239, 68, 68, 0.4)'
            : isWarning
            ? 'rgba(234, 179, 8, 0.4)'
            : 'var(--color-panel-border, rgba(255, 255, 255, 0.12))'
        }`,
        borderRadius: 10,
        boxShadow: 'var(--color-panel-shadow, 0 12px 36px rgba(0, 0, 0, 0.45))',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 540,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {isError
          ? (
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--color-danger, #ef4444)'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
          )
          : isWarning
          ? (
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='#eab308'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
              <line x1='12' y1='9' x2='12' y2='13' />
              <line x1='12' y1='17' x2='12.01' y2='17' />
            </svg>
          )
          : (
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--color-accent-light, #38bdf8)'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
              <polyline points='22 4 12 14.01 9 11.01' />
            </svg>
          )}
      </div>

      {/* Message & Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-primary, #f8fafc)',
          }}
        >
          {notification.message}
        </span>
        {notification.details && (
          <span
            style={{
              fontSize: 11,
              color: isWarning
                ? '#fde047'
                : isError
                ? '#fca5a5'
                : 'var(--color-text-secondary, #94a3b8)',
            }}
          >
            {notification.details}
          </span>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type='button'
        aria-label='Close'
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-secondary, #94a3b8)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          transition: 'color 0.15s ease',
        }}
      >
        <svg
          width='14'
          height='14'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <line x1='18' y1='6' x2='6' y2='18' />
          <line x1='6' y1='6' x2='18' y2='18' />
        </svg>
      </button>
    </div>
  );
};

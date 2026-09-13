import React, { useEffect, useState } from 'react';

const modalTransitionDuration = 180;

const modalStyles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '32rem',
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)',
    overflow: 'hidden',
    outline: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111827',
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    fontSize: '1.5rem',
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
  },
  body: {
    padding: '1.5rem',
    color: '#374151',
    lineHeight: 1.6,
  },
  footer: {
    padding: '0 1.5rem 1.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
  size = 'md',
  className = '',
  ariaLabel,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setShouldRender(false);
    }, modalTransitionDuration);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const modalWidth = {
    sm: '22rem',
    md: '32rem',
    lg: '42rem',
    xl: '52rem',
  }[size] || '32rem';

  return (
    <div
      className={`modal-backdrop ${isOpen ? 'is-open' : 'is-closing'}`}
      style={modalStyles.backdrop}
      onClick={closeOnOverlayClick ? onClose : undefined}
      aria-hidden={!isOpen}
    >
      <div
        className={`modal-panel ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title || 'Dialog'}
        style={{
          ...modalStyles.modal,
          maxWidth: modalWidth,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div style={modalStyles.header}>
            {title && <h2 style={modalStyles.title}>{title}</h2>}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                style={modalStyles.closeButton}
              >
                ×
              </button>
            )}
          </div>
        )}

        {children && <div style={modalStyles.body}>{children}</div>}

        {footer && <div style={modalStyles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;

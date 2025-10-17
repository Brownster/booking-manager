import { createPortal } from 'react-dom';
import clsx from 'clsx';
import './modal.css';

const modalRoot = typeof document !== 'undefined' ? document.body : null;

const sizeClassMap = {
  sm: 'ui-modal__dialog--sm',
  md: 'ui-modal__dialog--md',
  lg: 'ui-modal__dialog--lg',
  xl: 'ui-modal__dialog--xl',
  full: 'ui-modal__dialog--full'
};

export const Modal = ({
  isOpen,
  onClose,
  size = 'md',
  title,
  description,
  children
}) => {
  if (!isOpen || !modalRoot) {
    return null;
  }

  return createPortal(
    <div className="ui-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="ui-modal__backdrop" onClick={onClose} />
      <div className={clsx('ui-modal__dialog', sizeClassMap[size] ?? sizeClassMap.md)}>
        <div className="ui-modal__header">
          <div>
            {title && (
              <h2 id="modal-title" className="ui-modal__title">
                {title}
              </h2>
            )}
            {description && <p className="ui-modal__description">{description}</p>}
          </div>
          <button type="button" className="ui-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
      </div>
    </div>,
    modalRoot
  );
};

export const ModalBody = ({ className, children }) => (
  <div className={clsx('ui-modal__body', className)}>{children}</div>
);

export const ModalFooter = ({ className, children }) => (
  <div className={clsx('ui-modal__footer', className)}>{children}</div>
);

export default Modal;

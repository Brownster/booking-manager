import clsx from 'clsx';
import './card.css';

export const Card = ({ variant = 'default', hoverable = false, className, children, ...props }) => (
  <div
    className={clsx(
      'ui-card',
      variant === 'outlined' ? 'ui-card--outlined' : 'ui-card--default',
      hoverable && 'ui-card--hoverable',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ className, children }) => (
  <div className={clsx('ui-card__header', className)}>{children}</div>
);

export const CardTitle = ({ className, children }) => (
  <h3 className={clsx('ui-card__title', className)}>{children}</h3>
);

export const CardSubtitle = ({ className, children }) => (
  <p className={clsx('ui-card__subtitle', className)}>{children}</p>
);

export const CardContent = ({ className, children }) => (
  <div className={clsx('ui-card__content', className)}>{children}</div>
);

export const CardFooter = ({ className, children }) => (
  <div className={clsx('ui-card__footer', className)}>{children}</div>
);

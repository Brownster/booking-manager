import clsx from 'clsx';
import './badge.css';

const variantClassMap = {
  default: 'ui-badge--default',
  success: 'ui-badge--success',
  warning: 'ui-badge--warning',
  danger: 'ui-badge--danger',
  info: 'ui-badge--info',
  owner: 'ui-badge--owner',
  admin: 'ui-badge--admin',
  provider: 'ui-badge--provider',
  client: 'ui-badge--client',
  support: 'ui-badge--support'
};

export const Badge = ({ variant = 'default', className, children, ...props }) => (
  <span
    className={clsx('ui-badge', variantClassMap[variant] ?? variantClassMap.default, className)}
    {...props}
  >
    {children}
  </span>
);

export default Badge;

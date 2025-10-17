import clsx from 'clsx';
import './button.css';

const variantClassMap = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  danger: 'ui-button--danger',
  ghost: 'ui-button--ghost',
  link: 'ui-button--link'
};

const sizeClassMap = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg'
};

export const Button = ({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}) => (
  <button
    type={type}
    className={clsx(
      'ui-button',
      variantClassMap[variant] ?? variantClassMap.primary,
      sizeClassMap[size] ?? sizeClassMap.md,
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <span className="ui-button__spinner" aria-hidden="true" />}
    {leftIcon && <span className="ui-button__icon ui-button__icon--left">{leftIcon}</span>}
    <span className="ui-button__label">{children}</span>
    {rightIcon && <span className="ui-button__icon ui-button__icon--right">{rightIcon}</span>}
  </button>
);

export default Button;

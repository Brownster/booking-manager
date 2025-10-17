import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import './login.css';

export const LoginPage = () => {
  const { login, isAuthenticated, isInitialized, isLoading, authError, clearAuthError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const redirectPath = location.state?.from?.pathname ?? '/';

  useEffect(() => {
    setSubmitError(authError ?? null);
  }, [authError]);

  useEffect(
    () => () => {
      clearAuthError();
    },
    [clearAuthError]
  );

  if (isAuthenticated && isInitialized) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await login({ email, password, tenantId, rememberMe });
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  const disableSubmit = isLoading || !email || !password || !tenantId;

  return (
    <div className="login-page">
      <div className="login-card" aria-live="assertive">
        <header className="login-card__header">
          <span className="login-card__logo" aria-hidden="true">
            📅
          </span>
          <h1 className="login-card__title">Calendar Booking</h1>
          <p className="login-card__subtitle">Sign in to access your scheduling workspace.</p>
        </header>

        {submitError && (
          <div className="login-card__error" role="alert">
            {submitError}
          </div>
        )}

        <form className="login-card__form" onSubmit={handleSubmit} noValidate>
          <label className="login-card__field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (submitError) {
                  clearAuthError();
                  setSubmitError(null);
                }
              }}
              required
              placeholder="you@example.com"
            />
          </label>

          <label className="login-card__field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (submitError) {
                  clearAuthError();
                  setSubmitError(null);
                }
              }}
              required
              placeholder="••••••••"
            />
          </label>

          <label className="login-card__field">
            <span>Tenant ID</span>
            <input
              type="text"
              name="tenantId"
              value={tenantId}
              onChange={(event) => {
                setTenantId(event.target.value.trim());
                if (submitError) {
                  clearAuthError();
                  setSubmitError(null);
                }
              }}
              required
              placeholder="Enter your tenant ID"
            />
          </label>

          <div className="login-card__options">
            <label className="login-card__remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={disableSubmit}
            className="login-card__submit"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

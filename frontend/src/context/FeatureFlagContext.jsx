import { createContext, useContext, useMemo } from 'react';

const FeatureFlagContext = createContext(undefined);

const readBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).toLowerCase() === 'true';
};

const defaultFlags = {
  groupBookings: readBoolean(import.meta.env.VITE_FEATURE_FLAG_GROUP_BOOKINGS, true),
  waitlist: readBoolean(import.meta.env.VITE_FEATURE_FLAG_WAITLIST, true),
  notifications: readBoolean(import.meta.env.VITE_FEATURE_FLAG_NOTIFICATIONS, false)
};

export const FeatureFlagProvider = ({ children, initialFlags }) => {
  const value = useMemo(
    () => ({
      ...defaultFlags,
      ...(initialFlags || {})
    }),
    [initialFlags]
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};

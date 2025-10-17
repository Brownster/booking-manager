import {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  getCurrentUser
} from '../services/auth.service.js';
import { ApiError } from '../utils/error.js';

const REFRESH_COOKIE = process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth'
};

const attachTokens = (res, tokens) => {
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return {
    accessToken: tokens.accessToken
  };
};

export const register = async (req, res, next) => {
  try {
    const { tenantId, email, password, firstName, lastName, role } = req.body;
    const { user, tokens } = await registerUser({
      tenantId,
      email,
      password,
      firstName,
      lastName,
      role
    });

    const responseTokens = attachTokens(res, tokens);

    res.status(201).json({ user, tokens: responseTokens });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { tenantId, email, password } = req.body;
    const { user, tokens } = await loginUser({ tenantId, email, password });
    const responseTokens = attachTokens(res, tokens);
    res.status(200).json({ user, tokens: responseTokens });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token missing');
    }
    await logoutUser(refreshToken);
    res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
    const { user, tokens } = await refreshSession(refreshToken);
    const responseTokens = attachTokens(res, tokens);
    res.status(200).json({ user, tokens: responseTokens });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const user = await getCurrentUser(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

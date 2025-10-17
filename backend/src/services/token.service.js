import { cacheSet, cacheGet } from '../config/redis.js';
import { issueAccessToken, issueRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import { blacklistToken, isTokenBlacklisted } from '../repositories/token.repository.js';

const REFRESH_BLACKLIST_PREFIX = 'refresh:blacklist:';

const buildRedisKey = (token) => `${REFRESH_BLACKLIST_PREFIX}${token}`;

export const generateTokenPair = (user) => ({
  accessToken: issueAccessToken(user),
  refreshToken: issueRefreshToken(user)
});

export const decodeAccessToken = (token) => verifyAccessToken(token);

export const decodeRefreshToken = (token) => verifyRefreshToken(token);

export const revokeRefreshToken = async (token) => {
  const payload = verifyRefreshToken(token);
  const expiresAt = new Date(payload.exp * 1000);

  await cacheSet(buildRedisKey(token), { revoked: true }, Math.ceil((expiresAt - Date.now()) / 1000));
  await blacklistToken({ token, expiresAt });
};

export const isRefreshTokenRevoked = async (token) => {
  const cached = await cacheGet(buildRedisKey(token));
  if (cached?.revoked) {
    return true;
  }

  return isTokenBlacklisted(token);
};

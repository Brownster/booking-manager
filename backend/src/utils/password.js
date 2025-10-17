import bcrypt from 'bcrypt';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

export const hashPassword = async (plainText) => {
  if (!plainText) {
    throw new Error('Password is required');
  }
  return bcrypt.hash(plainText, SALT_ROUNDS);
};

export const verifyPassword = async (plainText, hash) => {
  if (!plainText || !hash) {
    return false;
  }
  return bcrypt.compare(plainText, hash);
};

export const getSaltRounds = () => SALT_ROUNDS;

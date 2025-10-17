import { Router } from 'express';
import { register, login, logout, refresh, me } from '../controllers/auth.controller.js';
import { registerValidation, loginValidation, refreshValidation } from '../validators/auth.validators.js';
import { loginRateLimiter, registerRateLimiter, refreshRateLimiter } from '../middleware/rate-limit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerRateLimiter, registerValidation, register);
router.post('/login', loginRateLimiter, loginValidation, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshRateLimiter, refreshValidation, refresh);
router.get('/me', authenticate, me);

export default router;

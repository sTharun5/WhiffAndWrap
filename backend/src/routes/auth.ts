import { Router } from 'express';
import { register, login, googleLogin, me, logout, acceptTerms } from '../controllers/auth';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', optionalAuthenticate, me);
router.post('/logout', logout);
router.post('/accept-terms', authenticate, acceptTerms);

export default router;

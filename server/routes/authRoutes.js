import express from 'express';
import userAuth from '../middlewares/userAuth.js';
import { isAuthenticated, login, logout, register, resetPassword, sendResetOtp, sendVerifyOtp, verifyEmail } from '../controllers/authController.js';

const userRouter = express.Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/logout', logout);
userRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);
userRouter.post('/verify-account', userAuth, verifyEmail);
userRouter.get('/is-auth', userAuth, isAuthenticated);
userRouter.post('/send-reset-otp', sendResetOtp);
userRouter.post('/reset-password', resetPassword);

export default userRouter;
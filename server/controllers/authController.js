import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.json({ success: false, message: "Missing Details" });
  }
  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Welcome to Ahmad Services',
      text: `Welcome to Ahmad Services website. Your account has been created with email id: ${email}.`
    }
    await transporter.sendMail(mailOptions);

    res.json({success: true});
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.json({ success: false, message: "Email and password are required" });
  }
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      res.json({ success: false, message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({success: true});
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    
    return res.json({success: true, message: "Log out"})
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// Send Verification OTP to the User's Email
export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      res.json({ success: false, message: "Account Already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000)

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Account Verification OTP',
      text: `Your OTP is ${otp}. Verify your account using this OTP.`
    }
    await transporter.sendMail(mailOptions);

    return res.json({success: true, message: "Verification OTP sent on Email"})
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// Verify Account
export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userId = req.userId;

  if (!userId || !otp) {
    res.json({ success: false, message: "Missing Details" });
  }

  try {
    const user = await userModel.findById(userId);

    if (!userId || !otp) {
      res.json({ success: false, message: "User not found" });
    }

    if (user.verifyOtp === '' || user.verifyOtp !== otp) {
      res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      res.json({ success: false, message: "OTP Expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtpExpireAt = 0;
    user.verifyOtp = '';
    await user.save();

    return res.json({success: true, message: "Email Verified successfully"})
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

export const isAuthenticated = async (req, res) => {
  try {
    return res.json({success: true});
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// Send Password Reset OTP to the User's Email
export const sendResetOtp = async (req, res) => {
  const {email} = req.body;
  
  if (!email) {
    res.json({ success: false, message: "Email is required" });
  }
  try {
    const user = await userModel.findOne({email});

    if (!user) {
      res.json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000)

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your OTP for resetting password is ${otp}. Use this OTP to proceed with resetting your password.`
    }
    await transporter.sendMail(mailOptions);

    return res.json({success: true, message: "OTP sent on Email"})
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// Send Password Reset OTP to the User's Email
export const resetPassword = async (req, res) => {
  const { email, newPassword, otp } = req.body;

  if (!email || !newPassword || !otp) {
    res.json({ success: false, message: "Email, OTP and new Password are required" });
  }

  try {
    const user = await userModel.findOne({email});

    if (!user) {
      res.json({ success: false, message: "User not found" });
    }

    if (user.resetOtp === '' || user.resetOtp !== otp) {
      res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      res.json({ success: false, message: "OTP Expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtpExpireAt = 0;
    user.resetOtp = '';
    
    await user.save();

    return res.json({success: true, message: "Password has been reset successfully"})
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}
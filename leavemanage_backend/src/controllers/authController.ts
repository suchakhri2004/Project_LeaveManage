import { MailSettings } from './../../node_modules/@sendgrid/helpers/classes/mail.d';
import { Request, Response } from "express";
import { pool } from "../db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sgMail from '@sendgrid/mail';
import dotenv from "dotenv";


dotenv.config();
const crypto = require('crypto');


export const login = async (req: Request, res: Response) => {
  try {
    const checkUser = await pool.query(`
      SELECT 
        users.*, 
        position.positionname, 
        roles.rolename,
        users.isactive
      FROM users
      JOIN position ON users.position_id = position.id
      JOIN roles ON position.roleid = roles.id
      WHERE users.username = $1
    `, [req.body.username]);

    if (checkUser.rows.length === 0) {
      return res.status(400).send(`username or password is incorrect`);
    }

    const user = checkUser.rows[0];

    if (user.isactive !== true) {
      return res.status(400).send(`user is not active`);
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);

    if (!passwordMatch) {
      return res.status(400).send(`username or password is incorrect`);
    }

    if (!process.env.SECRET) {
      return res.status(500).send("Internal Server Error: Secret is undefined");
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        gender: user.gender,
        profile: user.profile,
        signature: user.signature,
        position_id: user.position_id,
        position: user.positionname, 
        affiliation_id: user.affiliation_id,
        role: user.rolename   
      },
      process.env.SECRET,
      { expiresIn: "3h" }
    );

    return res.status(200).json({
      token,
      position: user.positionname,
      role: user.rolename,
      message: `Login Success`
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send("Internal Server Error");
  }
};


sgMail.setApiKey('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');

    
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = () => crypto.randomBytes(32).toString('hex');

export const forgot_password = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'กรุณาระบุอีเมล' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND isactive = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ด้วยอีเมลนี้' });
    }

    const userId = userResult.rows[0].id;
    const otp = generateOtp(); // 6 หลัก
    const token = generateToken(); // 64 char
    const expiresAt = new Date(Date.now() + 60 * 1000); // OTP 60 วินาที
    const resetTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000); // token 20 นาที

    await pool.query(
      `INSERT INTO otp_tokens (user_id, token, otp, expires_at, reset_token_expires_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, token, otp, expiresAt, resetTokenExpiresAt]
    );

    const mailOptions = {
      from: "tum0990ti@gmail.com",
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน',
      text: `รหัส OTP ของคุณคือ: ${otp}\nกรุณาใช้รหัสนี้ภายใน 1 นาทีเพื่อรีเซ็ตรหัสผ่านของคุณ`,
      mailSettings: {
        sandboxMode: {
          enable: false,
        }
      }
    };

    await sgMail.send(mailOptions);

    return res.status(200).json({ message: 'ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว' });

  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};


export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'กรุณาระบุ OTP' });
    }

    const result = await pool.query(
      `SELECT token, reset_token_expires_at FROM otp_tokens 
       WHERE otp = $1 AND expires_at > NOW() AND used = false
       ORDER BY createdat DESC LIMIT 1`,
      [otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'OTP ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    const { token, reset_token_expires_at } = result.rows[0];

    await pool.query(`UPDATE otp_tokens SET used = true , updatedat = $1 WHERE otp = $2`, [new Date(),otp]);

    return res.status(200).json({ message: 'OTP ถูกต้อง', token, reset_token_expires_at });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};



export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'กรุณาระบุ token และรหัสผ่านใหม่' });
    }

    const tokenResult = await pool.query(
      `SELECT user_id FROM otp_tokens
       WHERE token = $1 AND reset_token_expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'token ไม่ถูกต้องหรือหมดอายุ' });
    }

    const userId = tokenResult.rows[0].user_id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(`UPDATE users SET password = $1, updatedat = $2 WHERE id = $3`, [hashedPassword, new Date(), userId]);

    await pool.query(`UPDATE otp_tokens SET reset_token_expires_at = NOW() WHERE token = $1`,[token]);

    return res.status(200).json({ message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};


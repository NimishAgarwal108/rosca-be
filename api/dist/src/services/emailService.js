import nodemailer from 'nodemailer';
import config from '../config/config.js';
import { OTP_EXPIRY_MINUTES } from '../utils/index.js';
import logger from '../utils/logger.js';
// Create reusable transporter
let transporter = null;
const initializeTransporter = () => {
    if (transporter)
        return transporter;
    console.log('📧 Initializing Gmail transporter...');
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.email.user,
            pass: config.email.pass,
        },
    });
    return transporter;
};
export const sendOtpEmail = async (email, otp) => {
    console.log('📧 ═══════════════════════════════════════');
    console.log('📧 ATTEMPTING TO SEND OTP EMAIL');
    console.log('📧 To:', email);
    console.log('📧 From:', config.email.user);
    console.log('📧 Email User exists:', !!config.email.user);
    console.log('📧 Email Password exists:', !!config.email.pass);
    console.log('📧 OTP:', otp);
    console.log('📧 ═══════════════════════════════════════');
    // Validate configuration
    if (!config.email.user) {
        console.error('❌ EMAIL_USER is not configured in .env file');
        throw new Error('Email service not configured. Please contact administrator.');
    }
    if (!config.email.pass) {
        console.error('❌ EMAIL_PASSWORD is not configured in .env file');
        throw new Error('Email service not configured. Please contact administrator.');
    }
    // Initialize transporter
    const emailTransporter = initializeTransporter();
    const mailOptions = {
        from: {
            name: 'FindMyRoom',
            address: config.email.user,
        },
        to: email,
        subject: 'Password Reset OTP - FindMyRoom',
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">You requested to reset your password. Use the OTP below to proceed:</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; border: 2px solid #667eea;">
            <h1 style="color: #667eea; letter-spacing: 8px; font-size: 36px; margin: 0;">${otp}</h1>
          </div>
          
          <p style="font-size: 14px; color: #666;">This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        
        <div style="background-color: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 FindMyRoom - Room Rental Service</p>
        </div>
      </div>
    `,
        text: `Password Reset Request\n\nYour OTP for password reset is: ${otp}\n\nThis OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this, please ignore this email.`
    };
    try {
        console.log('📧 Sending email via Gmail...');
        const info = await emailTransporter.sendMail(mailOptions);
        console.log('✅ ═══════════════════════════════════════');
        console.log('✅ OTP EMAIL SENT SUCCESSFULLY!');
        console.log('✅ Message ID:', info.messageId);
        console.log('✅ To:', email);
        console.log('✅ ═══════════════════════════════════════');
        logger.info('OTP email sent successfully', { to: email, messageId: info.messageId });
    }
    catch (error) {
        console.error('❌ ═══════════════════════════════════════');
        console.error('❌ FAILED TO SEND OTP EMAIL');
        console.error('❌ Error:', error.message);
        console.error('❌ Error Code:', error.code);
        if (error.response) {
            console.error('❌ SMTP Response:', error.response);
        }
        console.error('❌ ═══════════════════════════════════════');
        logger.error('Failed to send OTP email', {
            to: email,
            error: error.message,
            code: error.code
        });
        // Provide specific error messages
        if (error.code === 'EAUTH') {
            throw new Error('Gmail authentication failed. Please check your EMAIL_USER and EMAIL_PASSWORD in .env file.');
        }
        else if (error.code === 'ESOCKET') {
            throw new Error('Network error. Please check your internet connection.');
        }
        else if (error.code === 'ECONNECTION') {
            throw new Error('Failed to connect to Gmail servers.');
        }
        throw new Error('Failed to send OTP email. Please try again later.');
    }
};
// Helper function to test email configuration on startup
export const testEmailConfig = async () => {
    console.log('\n📧 ═══════════════════════════════════════');
    console.log('📧 EMAIL SERVICE CONFIGURATION CHECK');
    console.log('📧 ═══════════════════════════════════════');
    console.log('📧 Email User:', config.email.user ? '✅ Configured' : '❌ MISSING');
    console.log('📧 Email Password:', config.email.pass ? '✅ Configured' : '❌ MISSING');
    console.log('📧 ═══════════════════════════════════════\n');
    if (!config.email.user || !config.email.pass) {
        console.error('⚠  WARNING: Email service is not properly configured!');
        console.error('⚠  Add EMAIL_USER and EMAIL_PASSWORD to your .env file');
        return;
    }
    try {
        console.log('📧 Testing Gmail connection...');
        const emailTransporter = initializeTransporter();
        await emailTransporter.verify();
        console.log('✅ Gmail connection successful!\n');
    }
    catch (error) {
        console.error('❌ Gmail connection failed!');
        console.error('❌ Error:', error.message);
        console.error('⚠  Please check your EMAIL_USER and EMAIL_PASSWORD\n');
    }
};

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({ // Fixed: removed 'er' from 'createTransporter'
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Welcome to PathPilot - Your Career Journey Begins!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to PathPilot!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for joining PathPilot, your AI-powered career navigator.</p>
          <p>Here's what you can do next:</p>
          <ul>
            <li>Complete your career assessment</li>
            <li>Explore personalized recommendations</li>
            <li>Connect with mentors</li>
          </ul>
          <p>Best regards,<br>The PathPilot Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully');
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Reset Your PathPilot Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>You requested a password reset for your PathPilot account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
          <p>Best regards,<br>The PathPilot Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Send assessment completion email
  async sendAssessmentCompletionEmail(email, name, assessmentTitle, results) {
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `Assessment Complete: ${assessmentTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Assessment Completed!</h2>
          <p>Hi ${name},</p>
          <p>You've successfully completed the <strong>${assessmentTitle}</strong>!</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Overall Score:</strong> ${results.overall}%</p>
            <p><strong>Top Strength:</strong> ${this.getTopStrength(results)}</p>
            <p><strong>Recommended Focus Area:</strong> ${this.getWeakestArea(results)}</p>
          </div>
          <p>Based on your results, we've generated personalized recommendations for you.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Detailed Results</a>
          <p>Keep exploring and growing!</p>
          <p>Best regards,<br>The PathPilot Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Assessment completion email sent successfully');
    } catch (error) {
      console.error('Error sending assessment completion email:', error);
      throw error;
    }
  }

  // Helper methods
  getTopStrength(results) {
    const strengths = Object.entries(results).filter(([key]) => key !== 'overall');
    return strengths.reduce((max, [key, value]) => value > max.value ? { key, value } : max, { value: 0 }).key;
  }

  getWeakestArea(results) {
    const areas = Object.entries(results).filter(([key]) => key !== 'overall');
    return areas.reduce((min, [key, value]) => value < min.value ? { key, value } : min, { value: 100 }).key;
  }
}

module.exports = new EmailService();

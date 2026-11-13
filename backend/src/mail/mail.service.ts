import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private readonly mailFrom: string;

  constructor(private readonly configService: ConfigService) {
    this.mailFrom =
      this.configService.get<string>('MAIL_FROM') ||
      'BrewLab <notifications@brewlab.internal>';

    const host = this.configService.get<string>('MAIL_HOST') || 'smtp.ethereal.email';
    const port = this.configService.get<number>('MAIL_PORT') || 587;
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        auth: { user, pass },
      });
    } else {
      // In development / testing without credentials, create a stream transport or ethereal test account
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.logger.log('Mail service initialized in mock/json mode (no SMTP credentials configured).');
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const subject = 'Welcome to BrewLab! ☕';
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to BrewLab, ${userName}!</h2>
        <p>Thank you for joining our community of specialty coffee roasters and manual brewers.</p>
        <p>Explore single-origin coffees, calculate precise pour ratios, and share your brew recipes with fellow baristas.</p>
        <br/>
        <p>Happy brewing,<br/>The BrewLab Team</p>
      </div>
    `;

    return this.sendMail(to, subject, html);
  }

  async sendLowStockAlert(
    roasterEmail: string,
    roasterName: string,
    beanName: string,
    currentStockGrams: number,
    thresholdGrams: number,
  ): Promise<boolean> {
    const subject = `⚠️ Low Stock Alert: ${beanName}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #c0392b;">Low Stock Warning</h2>
        <p>Hello ${roasterName},</p>
        <p>The inventory for <strong>${beanName}</strong> has dropped below your configured threshold.</p>
        <ul>
          <li><strong>Current Stock:</strong> ${currentStockGrams} grams</li>
          <li><strong>Alert Threshold:</strong> ${thresholdGrams} grams</li>
        </ul>
        <p>Please roast a fresh batch or restock this bean in your roastery dashboard.</p>
        <br/>
        <p>Best regards,<br/>BrewLab Inventory Monitor</p>
      </div>
    `;

    return this.sendMail(roasterEmail, subject, html);
  }

  async sendWeeklyBrewDigest(to: string, recipeTitles: string[]): Promise<boolean> {
    const subject = '☕ Weekly Brew Digest: Top Rated Coffee Guides';
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Top Manual Brew Guides of the Week</h2>
        <p>Here are the highest-rated recipes from the community this week:</p>
        <ul>
          ${recipeTitles.map((title) => `<li>${title}</li>`).join('')}
        </ul>
        <br/>
        <p>Brew on,<br/>BrewLab Team</p>
      </div>
    `;

    return this.sendMail(to, subject, html);
  }

  private async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.mailFrom,
        to,
        subject,
        html,
      });

      this.logger.log(`Email dispatched to ${to} | Subject: "${subject}"`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }
}

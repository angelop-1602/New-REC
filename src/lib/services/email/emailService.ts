/**
 * Email notification service for REC System
 * Handles sending emails to reviewers, proponents, and members
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  /**
   * Send an email notification
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to send email',
        };
      }

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if email service is configured
   */
  static async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/email/send');
      const data = await response.json();
      return data.configured === true;
    } catch (error) {
      console.error('Error checking email configuration:', error);
      return false;
    }
  }

  /**
   * Send notification to reviewer about protocol assignment
   */
  static async notifyReviewerAssignment(
    reviewerEmail: string,
    reviewerName: string,
    protocolId: string,
    protocolCode: string,
    protocolTitle: string,
    reviewerCode?: string,
    deadline?: string
  ): Promise<EmailResult> {
    const subject = `New Protocol Assignment: ${protocolCode}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-rec-system-2025.web.app';
    const protocolUrl = `${baseUrl}/rec/reviewers/protocol/${protocolId}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #036635; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #036635; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Protocol Assignment</h1>
            </div>
            <div class="content">
              <p>Dear ${reviewerName},</p>
              <p>You have been assigned to review a new protocol:</p>
              <ul>
                ${reviewerCode ? `<li><strong>Reviewer Code:</strong> ${reviewerCode}</li>` : ''}
                <li><strong>Protocol Code:</strong> ${protocolCode}</li>
                <li><strong>Protocol Title:</strong> ${protocolTitle}</li>
                ${deadline ? `<li><strong>Deadline:</strong> ${deadline}</li>` : ''}
              </ul>
              <p>Please log in to the REC System to access the protocol and begin your review.</p>
              <a href="${protocolUrl}" class="button">View Assigned Protocol</a>
              <p>If you have any questions, please contact the REC Chairperson.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the REC System. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: reviewerEmail,
      subject,
      html,
    });
  }

  /**
   * Send test notification to reviewer
   */
  static async sendTestNotification(
    reviewerEmail: string,
    reviewerName: string
  ): Promise<EmailResult> {
    const subject = 'Test Email - REC System Notification';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #036635; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Test Email Notification</h1>
            </div>
            <div class="content">
              <p>Dear ${reviewerName},</p>
              <p>This is a test email from the REC System to verify that email notifications are working correctly.</p>
              <p>If you received this email, your email address has been successfully configured in the system.</p>
              <p>You will receive notifications about:</p>
              <ul>
                <li>New protocol assignments</li>
                <li>Review deadlines and reminders</li>
                <li>Protocol status updates</li>
                <li>Important system announcements</li>
              </ul>
            </div>
            <div class="footer">
              <p>This is a test message from the REC System. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: reviewerEmail,
      subject,
      html,
    });
  }
}


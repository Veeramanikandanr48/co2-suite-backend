import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IMailDetails } from '../base-interface.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(obj: IMailDetails) {
    try {
      await this.mailerService.sendMail({
        to: obj.email,
        from: 'admin@co2suite.ai',
        subject: obj.subject,
        template: obj.template,
        context: {
          name: obj.name,
          url: obj.context.url,
          token: obj.context.token,
          otp: obj.context?.otp,
          expireTime: obj.context?.expires,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${obj.email}`, err.stack);
      throw new BadRequestException(
        'Failed to send email. Please try again later.',
      );
    }
  }
}

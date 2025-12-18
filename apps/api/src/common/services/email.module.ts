import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from './email.service';
import { DEFAULT_EMAIL_CONFIG } from '../config/constants';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>(
            'SMTP_HOST',
            DEFAULT_EMAIL_CONFIG.HOST
          ),
          port: configService.get<number>('SMTP_PORT', 587),
          secure: configService.get<string>('SMTP_SECURE', 'false') === 'true', // true for 465, false for other ports
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>(
            'SYSTEM_EMAIL_FROM',
            configService.get<string>(
              'SMTP_FROM',
              '"JasaWeb" <noreply@jasaweb.com>'
            )
          ),
        },
        template: {
          dir: process.cwd() + '/templates/',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

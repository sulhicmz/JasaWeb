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
      useFactory: async (configService: ConfigService) => {
        const host =
          configService.get<string>('SMTP_HOST') ?? DEFAULT_EMAIL_CONFIG.HOST;
        const user = configService.get<string>('SMTP_USER');
        const pass = configService.get<string>('SMTP_PASS');

        return {
          transport: {
            host,
            port: configService.get<number>('SMTP_PORT', 587),
            secure:
              configService.get<string>('SMTP_SECURE', 'false') === 'true',
            auth:
              user && pass
                ? {
                    user,
                    pass,
                  }
                : undefined,
          },
          defaults: {
            from: configService.get<string>(
              'EMAIL_FROM',
              `"${process.env.EMAIL_FROM_NAME || 'JasaWeb'}" <${process.env.NOREPLY_EMAIL || 'noreply@jasaweb.dev'}>`
            ),
          },
          template: {
            dir: process.cwd() + '/templates/',
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

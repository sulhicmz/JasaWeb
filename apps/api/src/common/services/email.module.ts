import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_SERVER_HOST', 'localhost'),
          port: configService.get<number>('EMAIL_SERVER_PORT', 587),
          secure: configService.get<string>('EMAIL_SERVER_SECURE', 'false') === 'true', // true for 465, false for other ports
          auth: {
            user: configService.get<string>('EMAIL_SERVER_USER'),
            pass: configService.get<string>('EMAIL_SERVER_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('EMAIL_FROM', '"JasaWeb" <noreply@jasaweb.com>'),
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
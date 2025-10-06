import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { EmailService } from '../common/services/email.service';

@Module({
  controllers: [TicketController],
  providers: [EmailService],
})
export class TicketModule {}
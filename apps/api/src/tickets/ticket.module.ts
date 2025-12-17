import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { EmailService } from '../common/services/email.service';

@Module({
  controllers: [TicketController],
  providers: [TicketService, EmailService],
  exports: [TicketService],
})
export class TicketModule {}

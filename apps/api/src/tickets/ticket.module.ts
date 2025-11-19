import { Module } from '@nestjs/common';
import { EmailService } from '../common/services/email.service';
import { TicketController } from './ticket.controller';

@Module({
  controllers: [TicketController],
  providers: [EmailService],
})
export class TicketModule {}

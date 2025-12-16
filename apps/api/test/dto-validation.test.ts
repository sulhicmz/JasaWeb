import { validate } from 'class-validator';
import { CreateProjectDto } from '../src/projects/dto/create-project.dto';
import { CreateTicketDto } from '../src/tickets/dto/create-ticket.dto';
import { CreateInvoiceDto } from '../src/invoices/dto/create-invoice.dto';
import {
  ProjectStatus,
  TicketType,
  TicketPriority,
  Currency,
} from '../src/common/dto/base.dto';

describe('DTO Validation Tests', () => {
  describe('CreateProjectDto', () => {
    it('should validate a valid project', async () => {
      const dto = new CreateProjectDto();
      dto.name = 'Test Project';
      dto.description = 'A test project description';
      dto.status = ProjectStatus.PLANNING;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid project name', async () => {
      const dto = new CreateProjectDto();
      dto.name = 'ab'; // Too short

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });
  });

  describe('CreateTicketDto', () => {
    it('should validate a valid ticket', async () => {
      const dto = new CreateTicketDto();
      dto.title = 'Test Ticket';
      dto.description = 'A test ticket description with enough characters';
      dto.type = TicketType.BUG;
      dto.priority = TicketPriority.MEDIUM;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid priority', async () => {
      const dto = new CreateTicketDto();
      dto.title = 'Test Ticket';
      dto.description = 'A test ticket description with enough characters';
      dto.type = TicketType.BUG;
      dto.priority = 'invalid' as any; // Invalid priority

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('CreateInvoiceDto', () => {
    it('should validate a valid invoice', async () => {
      const dto = new CreateInvoiceDto();
      dto.amount = 100.5;
      dto.currency = Currency.USD;
      dto.issuedAt = new Date().toISOString();
      dto.dueAt = new Date().toISOString();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject negative amount', async () => {
      const dto = new CreateInvoiceDto();
      dto.amount = -10; // Negative amount
      dto.currency = Currency.USD;
      dto.issuedAt = new Date().toISOString();
      dto.dueAt = new Date().toISOString();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });
});

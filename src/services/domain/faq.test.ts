/**
 * FaqService Tests
 * Domain service for FAQ business logic
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaqService, getFaqService } from './faq';

// Mock Prisma client
const mockPrisma = {
  faq: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
};

// Mock getPrisma function
vi.mock('../../lib/prisma', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const mockRuntime = { env: { HYPERDRIVE: { connectionString: 'test' } } };

describe('FaqService', () => {
  let faqService: FaqService;

  beforeEach(() => {
    vi.clearAllMocks();
    faqService = new FaqService(mockRuntime);
  });

  describe('getActiveFaqs', () => {
    it('should fetch only active FAQs ordered by sortOrder', async () => {
      const mockFaqs = [
        { id: '1', question: 'Q1', answer: 'A1', sortOrder: 1, isActive: true },
        { id: '2', question: 'Q2', answer: 'A2', sortOrder: 2, isActive: true },
      ];

      mockPrisma.faq.findMany.mockResolvedValue(mockFaqs);

      const result = await faqService.getActiveFaqs();

      expect(mockPrisma.faq.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
          isActive: true,
        },
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      expect(result).toEqual(mockFaqs);
    });
  });

  describe('getAllFaqs', () => {
    it('should fetch all FAQs ordered by sortOrder', async () => {
      const mockFaqs = [
        { id: '1', question: 'Q1', answer: 'A1', sortOrder: 1, isActive: true },
        { id: '2', question: 'Q2', answer: 'A2', sortOrder: 2, isActive: false },
      ];

      mockPrisma.faq.findMany.mockResolvedValue(mockFaqs);

      const result = await faqService.getAllFaqs();

      expect(mockPrisma.faq.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
          isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
      });

      expect(result).toEqual(mockFaqs);
    });
  });

  describe('createFaq', () => {
    it('should create a new FAQ', async () => {
      const newFaq = {
        question: 'New Question',
        answer: 'New Answer',
        sortOrder: 3,
        isActive: true,
      };

      const createdFaq = { id: '3', ...newFaq };

      mockPrisma.faq.create.mockResolvedValue(createdFaq);

      const result = await faqService.createFaq(newFaq);

      expect(mockPrisma.faq.create).toHaveBeenCalledWith({
        data: newFaq,
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
          isActive: true,
        },
      });

      expect(result).toEqual(createdFaq);
    });
  });

  describe('updateFaq', () => {
    it('should update an existing FAQ', async () => {
      const id = '1';
      const updateData = { question: 'Updated Question' };

      const updatedFaq = {
        id,
        question: 'Updated Question',
        answer: 'A1',
        sortOrder: 1,
        isActive: true,
      };

      mockPrisma.faq.update.mockResolvedValue(updatedFaq);

      const result = await faqService.updateFaq(id, updateData);

      expect(mockPrisma.faq.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData,
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
          isActive: true,
        },
      });

      expect(result).toEqual(updatedFaq);
    });
  });

  describe('deleteFaq', () => {
    it('should delete an FAQ', async () => {
      const id = '1';

      mockPrisma.faq.delete.mockResolvedValue(undefined);

      await faqService.deleteFaq(id);

      expect(mockPrisma.faq.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('toggleFaqStatus', () => {
    it('should toggle FAQ active status from true to false', async () => {
      const id = '1';
      const currentFaq = { isActive: true };
      const updatedFaq = {
        id,
        question: 'Q1',
        answer: 'A1',
        sortOrder: 1,
        isActive: false,
      };

      mockPrisma.faq.findUnique.mockResolvedValue(currentFaq);
      mockPrisma.faq.update.mockResolvedValue(updatedFaq);

      const result = await faqService.toggleFaqStatus(id);

      expect(mockPrisma.faq.findUnique).toHaveBeenCalledWith({
        where: { id },
        select: { isActive: true },
      });

      expect(mockPrisma.faq.update).toHaveBeenCalledWith({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
          isActive: true,
        },
      });

      expect(result).toEqual(updatedFaq);
    });

    it('should toggle FAQ active status from false to true', async () => {
      const id = '1';
      const currentFaq = { isActive: false };
      const updatedFaq = {
        id,
        question: 'Q1',
        answer: 'A1',
        sortOrder: 1,
        isActive: true,
      };

      mockPrisma.faq.findUnique.mockResolvedValue(currentFaq);
      mockPrisma.faq.update.mockResolvedValue(updatedFaq);

      const result = await faqService.toggleFaqStatus(id);

      expect(mockPrisma.faq.update).toHaveBeenCalledWith({
        where: { id },
        data: { isActive: true },
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
          isActive: true,
        },
      });

      expect(result).toEqual(updatedFaq);
    });

    it('should throw error if FAQ not found', async () => {
      const id = 'nonexistent';

      mockPrisma.faq.findUnique.mockResolvedValue(null);

      await expect(faqService.toggleFaqStatus(id)).rejects.toThrow('FAQ not found');

      expect(mockPrisma.faq.findUnique).toHaveBeenCalledWith({
        where: { id },
        select: { isActive: true },
      });

      expect(mockPrisma.faq.update).not.toHaveBeenCalled();
    });
  });
});

describe('getFaqService', () => {
  it('should return a FaqService instance', () => {
    const service = getFaqService(mockRuntime);

    expect(service).toBeInstanceOf(FaqService);
  });

  it('should initialize service with provided runtime', () => {
    const service = getFaqService(mockRuntime);

    expect(service).toBeDefined();
  });
});
import { getPrisma } from '../../lib/prisma';

/**
 * FAQ Service
 * Domain service for FAQ-related business logic
 */
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

export class FaqService {
  private prisma;

  constructor(runtime: any) {
    this.prisma = getPrisma(runtime);
  }

  /**
   * Get all active FAQs ordered by sort order
   */
  async getActiveFaqs(): Promise<FAQ[]> {
    return await this.prisma.faq.findMany({
      select: {
        id: true,
        question: true,
        answer: true,
        sortOrder: true,
        isActive: true,
      },
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Get all FAQs (including inactive ones) for admin management
   */
  async getAllFaqs(): Promise<FAQ[]> {
    return await this.prisma.faq.findMany({
      select: {
        id: true,
        question: true,
        answer: true,
        sortOrder: true,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Create a new FAQ
   */
  async createFaq(data: Omit<FAQ, 'id'>): Promise<FAQ> {
    return await this.prisma.faq.create({
      data,
      select: {
        id: true,
        question: true,
        answer: true,
        sortOrder: true,
        isActive: true,
      }
    });
  }

  /**
   * Update an existing FAQ
   */
  async updateFaq(id: string, data: Partial<Omit<FAQ, 'id'>>): Promise<FAQ> {
    return await this.prisma.faq.update({
      where: { id },
      data,
      select: {
        id: true,
        question: true,
        answer: true,
        sortOrder: true,
        isActive: true,
      }
    });
  }

  /**
   * Delete an FAQ
   */
  async deleteFaq(id: string): Promise<void> {
    await this.prisma.faq.delete({
      where: { id }
    });
  }

  /**
   * Toggle FAQ active status
   */
  async toggleFaqStatus(id: string): Promise<FAQ> {
    const faq = await this.prisma.faq.findUnique({
      where: { id },
      select: { isActive: true }
    });

    if (!faq) {
      throw new Error('FAQ not found');
    }

    return await this.updateFaq(id, { isActive: !faq.isActive });
  }
}

/**
 * Get FAQ service instance
 */
export function getFaqService(runtime: any): FaqService {
  return new FaqService(runtime);
}
/**
 * Pricing Service - Database-driven pricing management
 * Extracted from hardcoded config.ts approach for flexibility and admin management
 */
import type { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';

export interface PricingPlan {
  id: string;
  identifier: string;
  name: string;
  price: number;
  priceFormatted: string;
  description: string;
  features: string[];
  popular: boolean;
  color: 'primary' | 'success' | 'warning';
  sortOrder: number;
  isActive: boolean;
}

export class PricingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all active pricing plans
   */
  async getActivePricingPlans(): Promise<PricingPlan[]> {
    const plans = await this.prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    return plans.map(plan => ({
      id: plan.id,
      identifier: plan.identifier,
      name: plan.name,
      price: Number(plan.price),
      priceFormatted: this.formatPrice(Number(plan.price)),
      description: plan.description,
      features: plan.features as string[],
      popular: plan.popular,
      color: plan.color,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    }));
  }

  /**
   * Get pricing plan by identifier
   */
  async getPricingPlanByIdentifier(identifier: string): Promise<PricingPlan | null> {
    const plan = await this.prisma.pricingPlan.findFirst({
      where: { 
        identifier,
        isActive: true 
      }
    });

    if (!plan) return null;

    return {
      id: plan.id,
      identifier: plan.identifier,
      name: plan.name,
      price: Number(plan.price),
      priceFormatted: this.formatPrice(Number(plan.price)),
      description: plan.description,
      features: plan.features as string[],
      popular: plan.popular,
      color: plan.color,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    };
  }

  /**
   * Get pricing plan price only (for invoice creation)
   */
  async getPricingPrice(identifier: string): Promise<number | null> {
    const plan = await this.prisma.pricingPlan.findFirst({
      where: { 
        identifier,
        isActive: true 
      },
      select: { price: true }
    });

    return plan ? Number(plan.price) : null;
  }

  /**
   * Create pricing plan
   */
  async createPricingPlan(data: Omit<PricingPlan, 'id' | 'priceFormatted' | 'isActive'>): Promise<PricingPlan> {
    const plan = await this.prisma.pricingPlan.create({
      data: {
        identifier: data.identifier,
        name: data.name,
        price: data.price,
        description: data.description,
        features: data.features,
        popular: data.popular,
        color: data.color,
        sortOrder: data.sortOrder,
      }
    });

    return {
      id: plan.id,
      identifier: plan.identifier,
      name: plan.name,
      price: Number(plan.price),
      priceFormatted: this.formatPrice(Number(plan.price)),
      description: plan.description,
      features: plan.features as string[],
      popular: plan.popular,
      color: plan.color,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    };
  }

  /**
   * Update pricing plan
   */
  async updatePricingPlan(id: string, data: Partial<Omit<PricingPlan, 'id' | 'priceFormatted'>>): Promise<PricingPlan> {
    const plan = await this.prisma.pricingPlan.update({
      where: { id },
      data: {
        identifier: data.identifier,
        name: data.name,
        price: data.price,
        description: data.description,
        features: data.features,
        popular: data.popular,
        color: data.color,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      }
    });

    return {
      id: plan.id,
      identifier: plan.identifier,
      name: plan.name,
      price: Number(plan.price),
      priceFormatted: this.formatPrice(Number(plan.price)),
      description: plan.description,
      features: plan.features as string[],
      popular: plan.popular,
      color: plan.color,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    };
  }

  /**
   * Delete pricing plan (soft delete by setting isActive to false)
   */
  async deletePricingPlan(id: string): Promise<void> {
    await this.prisma.pricingPlan.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Format price to Indonesian Rupiah
   */
  private formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

// Create singleton instance
export function getPricingService(env: any): PricingService {
  const prisma = getPrisma(env);
  return new PricingService(prisma);
}
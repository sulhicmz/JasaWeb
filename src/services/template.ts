/**
 * Template Service
 * Business logic for template filtering and display
 * Extracted from inline JavaScript in template.astro
 */
import type { TemplateItem, TemplateCategory } from '../lib/config';
import { templateCategories } from '../lib/config';

export class TemplateService {
  /**
   * Get all template categories
   */
  static getCategories() {
    return templateCategories;
  }

  /**
   * Filter templates by category
   */
  static filterByCategory(templates: TemplateItem[], category: TemplateCategory): TemplateItem[] {
    if (category === 'all') return templates;
    return templates.filter(template => template.category === category);
  }

  /**
   * Generate client-side filtering script
   * Returns sanitized JavaScript code for category filtering
   */
  static generateFilterScript(): string {
    return `
      const filterBtns = document.querySelectorAll('.filter-btn');
      const cards = document.querySelectorAll('.template-card');

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          const category = btn.dataset.category;
          
          cards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
              card.classList.remove('hidden');
            } else {
              card.classList.add('hidden');
            }
          });
        });
      });
    `;
  }
}
import { describe, it, expect } from 'vitest';
import {
  isProjectData,
  isProjectType,
  isProjectStatus,
  isProjectCredentials,
  type ProjectData,
  type ProjectType,
  type ProjectStatus,
  type ProjectCredentials
} from './project.schema';

describe('Project Schema Type Guards', () => {
  describe('isProjectData', () => {
    it('should identify valid project data', () => {
      const validProject: ProjectData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987f6543-e21c-43d6-b987-543210987654',
        name: 'Company Website',
        type: 'company',
        status: 'in_progress',
        url: 'https://example.com',
        credentials: {
          admin_url: 'https://admin.example.com',
          username: 'admin',
          password: 'secret'
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z'
      };
      expect(isProjectData(validProject)).toBe(true);
    });

    it('should reject invalid project type', () => {
      const invalidProject = {
        id: '123',
        userId: '456',
        name: 'Test',
        type: 'invalid',
        status: 'in_progress',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };
      expect(isProjectData(invalidProject)).toBe(false);
    });

    it('should reject invalid project status', () => {
      const invalidProject = {
        id: '123',
        userId: '456',
        name: 'Test',
        type: 'company',
        status: 'invalid',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };
      expect(isProjectData(invalidProject)).toBe(false);
    });

    it('should accept project without URL and credentials', () => {
      const validProject: ProjectData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987f6543-e21c-43d6-b987-543210987654',
        name: 'Company Website',
        type: 'company',
        status: 'pending_payment',
        url: null,
        credentials: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };
      expect(isProjectData(validProject)).toBe(true);
    });
  });

  describe('isProjectType', () => {
    it('should accept sekolah type', () => {
      expect(isProjectType('sekolah')).toBe(true);
    });

    it('should accept berita type', () => {
      expect(isProjectType('berita')).toBe(true);
    });

    it('should accept company type', () => {
      expect(isProjectType('company')).toBe(true);
    });

    it('should reject invalid types', () => {
      expect(isProjectType('ecommerce')).toBe(false);
      expect(isProjectType('blog')).toBe(false);
      expect(isProjectType('')).toBe(false);
    });
  });

  describe('isProjectStatus', () => {
    it('should accept pending_payment status', () => {
      expect(isProjectStatus('pending_payment')).toBe(true);
    });

    it('should accept in_progress status', () => {
      expect(isProjectStatus('in_progress')).toBe(true);
    });

    it('should accept review status', () => {
      expect(isProjectStatus('review')).toBe(true);
    });

    it('should accept completed status', () => {
      expect(isProjectStatus('completed')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(isProjectStatus('cancelled')).toBe(false);
      expect(isProjectStatus('paid')).toBe(false);
      expect(isProjectStatus('')).toBe(false);
    });
  });

  describe('isProjectCredentials', () => {
    it('should identify valid credentials object', () => {
      const validCredentials: ProjectCredentials = {
        admin_url: 'https://admin.example.com',
        username: 'admin',
        password: 'secret'
      };
      expect(isProjectCredentials(validCredentials)).toBe(true);
    });

    it('should accept partial credentials', () => {
      const partialCredentials: ProjectCredentials = {
        admin_url: 'https://admin.example.com',
        username: null,
        password: null
      };
      expect(isProjectCredentials(partialCredentials)).toBe(true);
    });

    it('should reject non-object credentials', () => {
      expect(isProjectCredentials(null)).toBe(false);
      expect(isProjectCredentials('string')).toBe(false);
      expect(isProjectCredentials(123)).toBe(false);
    });
  });

  describe('Schema Consistency', () => {
    it('should ensure project data matches all required fields', () => {
      const project: ProjectData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987f6543-e21c-43d6-b987-543210987654',
        name: 'Company Website',
        type: 'company',
        status: 'in_progress',
        url: null,
        credentials: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };

      expect(isProjectData(project)).toBe(true);
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('userId');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('type');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('url');
      expect(project).toHaveProperty('credentials');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');
    });

    it('should validate project types enum values', () => {
      const validTypes: ProjectType[] = ['sekolah', 'berita', 'company'];
      validTypes.forEach(type => {
        expect(isProjectType(type)).toBe(true);
      });
    });

    it('should validate project status enum values', () => {
      const validStatuses: ProjectStatus[] = ['pending_payment', 'in_progress', 'review', 'completed'];
      validStatuses.forEach(status => {
        expect(isProjectStatus(status)).toBe(true);
      });
    });
  });
});

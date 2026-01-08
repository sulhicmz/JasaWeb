import type { OpenAPIV3 } from 'openapi-types';

export type ProjectType = 'sekolah' | 'berita' | 'company';
export type ProjectStatus = 'pending_payment' | 'in_progress' | 'review' | 'completed';

export interface ProjectCredentials {
  admin_url: string | null;
  username: string | null;
  password: string | null;
}

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  url: string | null;
  credentials: ProjectCredentials | null;
  createdAt: string;
  updatedAt: string;
}

export const projectSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'Company Website' },
    type: { type: 'string', enum: ['sekolah', 'berita', 'company'], example: 'company' },
    status: { 
      type: 'string', 
      enum: ['pending_payment', 'in_progress', 'review', 'completed'], 
      example: 'in_progress' 
    },
    url: { type: 'string', nullable: true, example: 'https://example.com' },
    credentials: {
      type: 'object',
      nullable: true,
      properties: {
        admin_url: { type: 'string', nullable: true },
        username: { type: 'string', nullable: true },
        password: { type: 'string', nullable: true }
      }
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'userId', 'name', 'type', 'status', 'createdAt', 'updatedAt']
};

export function isProjectType(type: string): type is ProjectType {
  return ['sekolah', 'berita', 'company'].includes(type);
}

export function isProjectStatus(status: string): status is ProjectStatus {
  return ['pending_payment', 'in_progress', 'review', 'completed'].includes(status);
}

export function isProjectCredentials(data: unknown): data is ProjectCredentials {
  return typeof data === 'object' && data !== null &&
    ('admin_url' in data || 'username' in data || 'password' in data);
}

export function isProjectData(data: unknown): data is ProjectData {
  return typeof data === 'object' && data !== null &&
    'id' in data &&
    'userId' in data &&
    'name' in data &&
    'type' in data &&
    'status' in data &&
    'createdAt' in data &&
    'updatedAt' in data &&
    isProjectType((data as ProjectData).type) &&
    isProjectStatus((data as ProjectData).status);
}

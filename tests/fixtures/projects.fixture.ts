export const createMockProject = (overrides = {}) => ({
  id: `project-${Date.now()}`,
  name: 'Test Project',
  status: 'active',
  startAt: new Date('2024-01-01'),
  dueAt: new Date('2024-12-31'),
  organizationId: 'org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProjectWithRelations = (overrides = {}) => ({
  ...createMockProject(overrides),
  milestones: [],
  files: [],
  approvals: [],
  tasks: [],
  tickets: [],
  invoices: [],
});

export const mockProjects = [
  createMockProject({ id: 'project-1', name: 'Project Alpha', status: 'active' }),
  createMockProject({ id: 'project-2', name: 'Project Beta', status: 'completed' }),
  createMockProject({ id: 'project-3', name: 'Project Gamma', status: 'draft' }),
];

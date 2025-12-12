export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueAt: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  organizationId: string;
  projectId?: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'support' | 'question';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assigneeId?: string;
  reporterId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithRelations {
  id: string;
  organizationId: string;
  name: string;
  status: string;
  startAt: Date | null;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  milestones?: Milestone[];
  tickets?: Ticket[];
}

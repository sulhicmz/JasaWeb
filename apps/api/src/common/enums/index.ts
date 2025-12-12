import { SetMetadata } from '@nestjs/common';

export enum Role {
  OrgOwner = 'owner',
  OrgAdmin = 'admin',
  Finance = 'finance',
  Reviewer = 'reviewer',
  Member = 'member',
  Guest = 'guest',
}

export enum ProjectStatus {
  Draft = 'draft',
  InProgress = 'progress',
  Review = 'review',
  Completed = 'completed',
  Paused = 'paused',
  Cancelled = 'cancelled',
}

export enum MilestoneStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Completed = 'completed',
  Overdue = 'overdue',
}

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Review = 'review',
  Completed = 'completed',
}

export enum TicketType {
  Bug = 'bug',
  Feature = 'feature',
  Improvement = 'improvement',
  Question = 'question',
  Task = 'task',
}

export enum TicketPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum TicketStatus {
  Open = 'open',
  InProgress = 'in_progress',
  InReview = 'in_review',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum InvoiceStatus {
  Draft = 'draft',
  Issued = 'issued',
  Paid = 'paid',
  Overdue = 'overdue',
  Cancelled = 'cancelled',
}

export enum ApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum ApprovalItemType {
  Page = 'page',
  Content = 'content',
  Design = 'design',
  Feature = 'feature',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  IDR = 'IDR',
  GBP = 'GBP',
  JPY = 'JPY',
}

export enum KbArticleStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

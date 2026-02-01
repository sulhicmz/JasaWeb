import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import { PrismaClient } from '@prisma/client';
import DataLoader from './dataLoader';
import type { 
  User
} from '@prisma/client';

// Custom scalar types
export const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value: any) {
    return value ? new Date(value) : null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

export const Decimal = new GraphQLScalarType({
  name: 'Decimal',
  description: 'Decimal custom scalar type',
  serialize(value: any) {
    return value ? parseFloat(value.toString()) : null;
  },
  parseValue(value: any) {
    return value ? parseFloat(value.toString()) : value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return parseFloat(ast.value);
    }
    return null;
  },
});

export const JSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(_ast) {
    // For simplicity, return null for literal parsing
    // In a real implementation, you'd parse the AST
    return null;
  },
});

// Context interface
export interface GraphQLContext {
  prisma: PrismaClient;
  dataLoader: DataLoader;
  user?: User;
}

// Base resolvers
export const baseResolvers = {
  DateTime,
  Decimal,
  JSON,
};

// User resolvers
export const userResolvers = {
  Query: {
    user: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.user(id);
    },
    users: async (
      _parent: any, 
      { where, orderBy, limit, offset }: { where?: any, orderBy?: any, limit?: number, offset?: number }, 
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.users(where, orderBy, limit, offset);
    },
    usersCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.usersCount(where);
    },
  },
  Mutation: {
    createUser: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const user = await prisma.user.create({ data });
      dataLoader.clearCache('user');
      dataLoader.clearCache('users');
      return user;
    },
    updateUser: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const user = await prisma.user.update({ where: { id }, data });
      dataLoader.clearCache('user');
      dataLoader.clearCache('users');
      return user;
    },
    deleteUser: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const user = await prisma.user.delete({ where: { id } });
      dataLoader.clearCache('user');
      dataLoader.clearCache('users');
      return user;
    },
  },
};

// Project resolvers
export const projectResolvers = {
  Query: {
    project: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.project(id);
    },
    projects: async (
      _parent: any,
      { where, orderBy, limit, offset }: { where?: any, orderBy?: any, limit?: number, offset?: number },
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.projects(where, orderBy, limit, offset);
    },
    projectsCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.projectsCount(where);
    },
  },
  Mutation: {
    createProject: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const project = await prisma.project.create({ data });
      dataLoader.clearCache('project');
      dataLoader.clearCache('projects');
      dataLoader.clearCache('user');
      return project;
    },
    updateProject: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const project = await prisma.project.update({ where: { id }, data });
      dataLoader.clearCache('project');
      dataLoader.clearCache('projects');
      dataLoader.clearCache('user');
      return project;
    },
    deleteProject: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const project = await prisma.project.delete({ where: { id } });
      dataLoader.clearCache('project');
      dataLoader.clearCache('projects');
      dataLoader.clearCache('user');
      return project;
    },
  },
};

// Invoice resolvers
export const invoiceResolvers = {
  Query: {
    invoice: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.invoice(id);
    },
    invoices: async (
      _parent: any,
      { where, orderBy, limit, offset }: { where?: any, orderBy?: any, limit?: number, offset?: number },
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.invoices(where, orderBy, limit, offset);
    },
    invoicesCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.invoicesCount(where);
    },
  },
  Mutation: {
    createInvoice: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const invoice = await prisma.invoice.create({ data });
      dataLoader.clearCache('invoice');
      dataLoader.clearCache('invoices');
      dataLoader.clearCache('project');
      return invoice;
    },
    updateInvoice: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const invoice = await prisma.invoice.update({ where: { id }, data });
      dataLoader.clearCache('invoice');
      dataLoader.clearCache('invoices');
      dataLoader.clearCache('project');
      return invoice;
    },
    deleteInvoice: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const invoice = await prisma.invoice.delete({ where: { id } });
      dataLoader.clearCache('invoice');
      dataLoader.clearCache('invoices');
      dataLoader.clearCache('project');
      return invoice;
    },
  },
};

// Template resolvers
export const templateResolvers = {
  Query: {
    template: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.template(id);
    },
    templates: async (
      _parent: any,
      { where, orderBy, limit, offset }: { where?: any, orderBy?: any, limit?: number, offset?: number },
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.templates(where, orderBy, limit, offset);
    },
    templatesCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.templatesCount(where);
    },
  },
  Mutation: {
    createTemplate: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const template = await prisma.template.create({ data });
      dataLoader.clearCache('template');
      dataLoader.clearCache('templates');
      return template;
    },
    updateTemplate: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const template = await prisma.template.update({ where: { id }, data });
      dataLoader.clearCache('template');
      dataLoader.clearCache('templates');
      return template;
    },
    deleteTemplate: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const template = await prisma.template.delete({ where: { id } });
      dataLoader.clearCache('template');
      dataLoader.clearCache('templates');
      return template;
    },
  },
};

// Post resolvers
export const postResolvers = {
  Query: {
    post: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.post(id);
    },
    posts: async (
      _parent: any,
      { where, orderBy, limit, offset }: { where?: any, orderBy?: any, limit?: number, offset?: number },
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.posts(where, orderBy, limit, offset);
    },
    postsCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.postsCount(where);
    },
  },
  Mutation: {
    createPost: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const post = await prisma.post.create({ data });
      dataLoader.clearCache('post');
      dataLoader.clearCache('posts');
      return post;
    },
    updatePost: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const post = await prisma.post.update({ where: { id }, data });
      dataLoader.clearCache('post');
      dataLoader.clearCache('posts');
      return post;
    },
    deletePost: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const post = await prisma.post.delete({ where: { id } });
      dataLoader.clearCache('post');
      dataLoader.clearCache('posts');
      return post;
    },
  },
};

// Page resolvers
export const pageResolvers = {
  Query: {
    page: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.page(id);
    },
    pages: async (
      _parent: any,
      { where, orderBy, limit, offset }: { where?: any, orderBy?: any, limit?: number, offset?: number },
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.pages(where, orderBy, limit, offset);
    },
    pagesCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.pagesCount(where);
    },
  },
  Mutation: {
    createPage: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const page = await prisma.page.create({ data });
      dataLoader.clearCache('page');
      dataLoader.clearCache('pages');
      return page;
    },
    updatePage: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const page = await prisma.page.update({ where: { id }, data });
      dataLoader.clearCache('page');
      dataLoader.clearCache('pages');
      return page;
    },
    deletePage: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const page = await prisma.page.delete({ where: { id } });
      dataLoader.clearCache('page');
      dataLoader.clearCache('pages');
      return page;
    },
  },
};

// PricingPlan resolvers
export const pricingPlanResolvers = {
  Query: {
    pricingPlan: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.pricingPlan(id);
    },
    pricingPlans: async (
      _parent: any,
      { where, orderBy, limit, offset }: { where?: any, orderBy?: any, limit?: number, offset?: number },
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.pricingPlans(where, orderBy, limit, offset);
    },
    pricingPlansCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.pricingPlansCount(where);
    },
  },
  Mutation: {
    createPricingPlan: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const pricingPlan = await prisma.pricingPlan.create({ data });
      dataLoader.clearCache('pricingPlan');
      dataLoader.clearCache('pricingPlans');
      return pricingPlan;
    },
    updatePricingPlan: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const pricingPlan = await prisma.pricingPlan.update({ where: { id }, data });
      dataLoader.clearCache('pricingPlan');
      dataLoader.clearCache('pricingPlans');
      return pricingPlan;
    },
    deletePricingPlan: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const pricingPlan = await prisma.pricingPlan.delete({ where: { id } });
      dataLoader.clearCache('pricingPlan');
      dataLoader.clearCache('pricingPlans');
      return pricingPlan;
    },
  },
};

// WebSocketConnection resolvers
export const webSocketConnectionResolvers = {
  Query: {
    webSocketConnection: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.webSocketConnection(id);
    },
    webSocketConnections: async (
      _parent: any,
      { where, limit, offset }: { where?: any, limit?: number, offset?: number },
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.webSocketConnections(where, limit, offset);
    },
    webSocketConnectionsCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.webSocketConnectionsCount(where);
    },
  },
  Mutation: {
    createWebSocketConnection: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const connection = await prisma.webSocketConnection.create({ data });
      dataLoader.clearCache('webSocketConnection');
      dataLoader.clearCache('webSocketConnections');
      return connection;
    },
    updateWebSocketConnection: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const connection = await prisma.webSocketConnection.update({ where: { id }, data });
      dataLoader.clearCache('webSocketConnection');
      dataLoader.clearCache('webSocketConnections');
      return connection;
    },
    deleteWebSocketConnection: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const connection = await prisma.webSocketConnection.delete({ where: { id } });
      dataLoader.clearCache('webSocketConnection');
      dataLoader.clearCache('webSocketConnections');
      return connection;
    },
  },
};

// RealTimeNotification resolvers
export const realTimeNotificationResolvers = {
  Query: {
    realTimeNotification: async (_parent: any, { id }: { id: string }, { dataLoader }: GraphQLContext) => {
      return dataLoader.realTimeNotification(id);
    },
    realTimeNotifications: async (
      _parent: any,
      { where, limit, offset }: { where?: any, limit?: number, offset?: number },
      { dataLoader }: GraphQLContext
    ) => {
      return dataLoader.realTimeNotifications(where, limit, offset);
    },
    realTimeNotificationsCount: async (_parent: any, { where }: { where?: any }, { dataLoader }: GraphQLContext) => {
      return dataLoader.realTimeNotificationsCount(where);
    },
  },
  Mutation: {
    createRealTimeNotification: async (
      _parent: any,
      { data }: { data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const notification = await prisma.realTimeNotification.create({ data });
      dataLoader.clearCache('realTimeNotification');
      dataLoader.clearCache('realTimeNotifications');
      return notification;
    },
    updateRealTimeNotification: async (
      _parent: any,
      { id, data }: { id: string, data: any },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const notification = await prisma.realTimeNotification.update({ where: { id }, data });
      dataLoader.clearCache('realTimeNotification');
      dataLoader.clearCache('realTimeNotifications');
      return notification;
    },
    deleteRealTimeNotification: async (
      _parent: any,
      { id }: { id: string },
      { prisma, dataLoader }: GraphQLContext
    ) => {
      const notification = await prisma.realTimeNotification.delete({ where: { id } });
      dataLoader.clearCache('realTimeNotification');
      dataLoader.clearCache('realTimeNotifications');
      return notification;
    },
  },
};

// Subscription resolvers (placeholder for real-time features)
export const subscriptionResolvers = {
  Subscription: {
    userUpdated: {
      subscribe: (_parent: any, _args: any, _context: GraphQLContext) => {
        // Placeholder for pub/sub implementation
        throw new Error('Subscriptions not yet implemented');
      },
    },
    projectUpdated: {
      subscribe: (_parent: any, _args: any, _context: GraphQLContext) => {
        // Placeholder for pub/sub implementation
        throw new Error('Subscriptions not yet implemented');
      },
    },
    invoiceUpdated: {
      subscribe: (_parent: any, _args: any, _context: GraphQLContext) => {
        // Placeholder for pub/sub implementation
        throw new Error('Subscriptions not yet implemented');
      },
    },
  },
};

// Combine all resolvers
export const resolvers = {
  ...baseResolvers,
  ...userResolvers,
  ...projectResolvers,
  ...invoiceResolvers,
  ...templateResolvers,
  ...postResolvers,
  ...pageResolvers,
  ...pricingPlanResolvers,
  ...webSocketConnectionResolvers,
  ...realTimeNotificationResolvers,
  ...subscriptionResolvers,
};

export default resolvers;
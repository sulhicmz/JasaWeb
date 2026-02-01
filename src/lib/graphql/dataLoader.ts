import { PrismaClient } from '@prisma/client';
import type {
  User,
  Project,
  Invoice,
  Post,
  Page,
  Template,
  PricingPlan,
  WebSocketConnection,
  RealTimeNotification
} from '@prisma/client';

export class DataLoader {
  private prisma: PrismaClient;
  private cache = new Map<string, Promise<any>>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // User data loaders
  async user(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.user.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async users(where: any = {}, orderBy: any = {}, limit?: number, offset?: number): Promise<User[]> {
    const cacheKey = `users:${JSON.stringify({ where, orderBy, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.user.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async usersCount(where: any = {}): Promise<number> {
    const cacheKey = `usersCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.user.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // Project data loaders
  async project(id: string): Promise<Project | null> {
    const cacheKey = `project:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async projects(
    where: any = {},
    orderBy: any = {},
    limit?: number,
    offset?: number
  ): Promise<Project[]> {
    const cacheKey = `projects:${JSON.stringify({ where, orderBy, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.project.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async projectsCount(where: any = {}): Promise<number> {
    const cacheKey = `projectsCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.project.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // Invoice data loaders
  async invoice(id: string): Promise<Invoice | null> {
    const cacheKey = `invoice:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.invoice.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            userId: true
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async invoices(
    where: any = {},
    orderBy: any = {},
    limit?: number,
    offset?: number
  ): Promise<Invoice[]> {
    const cacheKey = `invoices:${JSON.stringify({ where, orderBy, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.invoice.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            userId: true
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async invoicesCount(where: any = {}): Promise<number> {
    const cacheKey = `invoicesCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.invoice.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // Template data loaders
  async template(id: string): Promise<Template | null> {
    const cacheKey = `template:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.template.findUnique({
      where: { id }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async templates(
    where: any = {},
    orderBy: any = {},
    limit?: number,
    offset?: number
  ): Promise<Template[]> {
    const cacheKey = `templates:${JSON.stringify({ where, orderBy, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.template.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async templatesCount(where: any = {}): Promise<number> {
    const cacheKey = `templatesCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.template.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // Post data loaders
  async post(id: string): Promise<Post | null> {
    const cacheKey = `post:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.post.findUnique({
      where: { id }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async posts(
    where: any = {},
    orderBy: any = {},
    limit?: number,
    offset?: number
  ): Promise<Post[]> {
    const cacheKey = `posts:${JSON.stringify({ where, orderBy, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.post.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async postsCount(where: any = {}): Promise<number> {
    const cacheKey = `postsCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.post.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // Page data loaders
  async page(id: string): Promise<Page | null> {
    const cacheKey = `page:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.page.findUnique({
      where: { id }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async pages(
    where: any = {},
    orderBy: any = {},
    limit?: number,
    offset?: number
  ): Promise<Page[]> {
    const cacheKey = `pages:${JSON.stringify({ where, orderBy, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.page.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async pagesCount(where: any = {}): Promise<number> {
    const cacheKey = `pagesCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.page.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // PricingPlan data loaders
  async pricingPlan(id: string): Promise<PricingPlan | null> {
    const cacheKey = `pricingPlan:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.pricingPlan.findUnique({
      where: { id }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async pricingPlans(
    where: any = {},
    orderBy: any = {},
    limit?: number,
    offset?: number
  ): Promise<PricingPlan[]> {
    const cacheKey = `pricingPlans:${JSON.stringify({ where, orderBy, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.pricingPlan.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async pricingPlansCount(where: any = {}): Promise<number> {
    const cacheKey = `pricingPlansCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.pricingPlan.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // WebSocketConnection data loaders
  async webSocketConnection(id: string): Promise<WebSocketConnection | null> {
    const cacheKey = `webSocketConnection:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.webSocketConnection.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async webSocketConnections(
    where: any = {},
    limit?: number,
    offset?: number
  ): Promise<WebSocketConnection[]> {
    const cacheKey = `webSocketConnections:${JSON.stringify({ where, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.webSocketConnection.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async webSocketConnectionsCount(where: any = {}): Promise<number> {
    const cacheKey = `webSocketConnectionsCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.webSocketConnection.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // RealTimeNotification data loaders
  async realTimeNotification(id: string): Promise<RealTimeNotification | null> {
    const cacheKey = `realTimeNotification:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.realTimeNotification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async realTimeNotifications(
    where: any = {},
    limit?: number,
    offset?: number
  ): Promise<RealTimeNotification[]> {
    const cacheKey = `realTimeNotifications:${JSON.stringify({ where, limit, offset })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.realTimeNotification.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async realTimeNotificationsCount(where: any = {}): Promise<number> {
    const cacheKey = `realTimeNotificationsCount:${JSON.stringify(where)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const promise = this.prisma.realTimeNotification.count({ where });
    this.cache.set(cacheKey, promise);
    return promise;
  }

  // Clear cache for a specific type
  clearCache(type: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(`${type}:`));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache.clear();
  }
}

export default DataLoader;
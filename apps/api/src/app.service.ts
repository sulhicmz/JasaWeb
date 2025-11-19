import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Welcome to JasaWeb API!',
      version: '1.0.0',
      documentation: '/api/docs',
      endpoints: {
        auth: '/auth',
        projects: '/projects',
        users: '/users',
        health: '/health',
        analytics: '/analytics',
        files: '/files',
        invoices: '/invoices',
        milestones: '/milestones',
        tickets: '/tickets',
        approvals: '/approvals',
      },
    };
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}

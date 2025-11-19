import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ComprehensiveExceptionFilter } from './common/filters/comprehensive-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { ErrorHandlingService } from './common/services/error-handling.service';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security: Apply Helmet middleware for HTTP security headers
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
              },
            }
          : false,
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    })
  );

  // Enable compression
  app.use(compression());

  // Enhanced CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4321'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    credentials: true,
    maxAge: 3600,
  });

  // Disable X-Powered-By header
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Get the error handling service to inject into the filter
  const errorHandlingService = app.get(ErrorHandlingService);

  // Apply global exception filters
  app.useGlobalFilters(
    new ComprehensiveExceptionFilter(errorHandlingService),
    new ValidationExceptionFilter()
  );

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('JasaWeb API')
    .setDescription(
      `
    ## Overview
    The JasaWeb API provides comprehensive endpoints for managing client projects, collaborations, and business operations.
    
    ## Authentication
    Most endpoints require JWT authentication. Include the token in the Authorization header:
    \`Authorization: Bearer <your-jwt-token>\`
    
    ## Multi-Tenancy
    This API supports multi-tenant architecture. Include the organization ID in the X-Tenant-ID header.
    
    ## Rate Limiting
    API endpoints are rate-limited to ensure fair usage. Excessive requests will be throttled.
    
    ## Error Handling
    The API uses standard HTTP status codes and returns detailed error messages in JSON format.
    `
    )
    .setVersion('1.0.0')
    .setContact(
      'JasaWeb Support',
      'https://jasaweb.com/support',
      'support@jasaweb.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-ID',
        description: 'Organization ID for multi-tenancy',
        in: 'header',
      },
      'tenant-id'
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .addTag('Projects', 'Project management and tracking')
    .addTag('Analytics', 'Analytics and reporting')
    .addTag('Files', 'File upload and management')
    .addTag('Health', 'System health checks')
    .addTag('Invoices', 'Invoice management')
    .addTag('Milestones', 'Project milestone tracking')
    .addTag('Tickets', 'Support ticket management')
    .addTag('Approvals', 'Approval workflow management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'JasaWeb API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM2NjZkNiIvPgo8cGF0aCBkPSJNMjAgMTBMMjUgMTVMMjAgMjBMMTUgMTVMMjAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjAgMjBMMjUgMjVMMjAgMzBMMTUgMjVMMjAgMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'); }
      .swagger-ui .topbar { background-color: #3666d6; }
      .swagger-ui .topbar-wrapper .link { color: white; }
    `,
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

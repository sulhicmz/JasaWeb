import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ComprehensiveExceptionFilter } from './common/filters/comprehensive-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { ErrorHandlingService } from './common/services/error-handling.service';
import {
  validateEnvironmentVariables,
  EnvValidationError,
} from '@jasaweb/config/env-validation';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate all environment variables using comprehensive validation
  try {
    validateEnvironmentVariables();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      logger.error(`Environment validation failed: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }

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
    origin: (
      process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4321']
    ).map((o) => o.trim()),
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
    .setDescription('API for JasaWeb client portal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

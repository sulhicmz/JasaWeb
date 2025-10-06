import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ComprehensiveExceptionFilter } from './common/filters/comprehensive-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { ErrorHandlingService } from './common/services/error-handling.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS if needed
  app.enableCors();
  
  // Use global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Get the error handling service to inject into the filter
  const errorHandlingService = app.get(ErrorHandlingService);
  
  // Apply global exception filters
  app.useGlobalFilters(
    new ComprehensiveExceptionFilter(errorHandlingService),
    new ValidationExceptionFilter(),
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
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
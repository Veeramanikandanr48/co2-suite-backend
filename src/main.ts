import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { seedRbac } from './database/seeds/rbac.seed';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Parse cookies for HttpOnly auth tokens
  app.use(cookieParser());

  // Security Headers via Helmet
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false, // Handled dynamically in Next.js middleware
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('CO2 API')
      .setDescription('CO2 API')
      .setVersion('1.0')
      .addTag('CO2')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-doc', app, document);
  }

  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
    : true;

  app.enableCors({
    credentials: true,
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Timestamp',
      'X-Request-Nonce',
      'X-Request-Signature',
      'X-Request-ID',
      'X-Skip-Toast',
      'X-Skip-Auth',
      'X-Skip-Crypto',
    ],
  });

  // Automatically execute idempotent RBAC seed on application startup
  try {
    const dataSource = app.get(DataSource);
    await seedRbac(dataSource);
  } catch (error) {
    console.error('❌ Failed to run RBAC seed on startup:', error?.message || error);
  }

  await app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
}
bootstrap();
// NestJS server reloaded with PUT /api/v1/organizations/:id support


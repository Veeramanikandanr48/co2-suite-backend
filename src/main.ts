import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { seedRbac } from './database/seeds/rbac.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

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
      .setTitle('MES Report API')
      .setDescription('MES Report API')
      .setVersion('1.0')
      .addTag('MES')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-doc', app, document);
  }

  app.enableCors({
    credentials: true,
    origin: true,
  });

  // Automatically execute idempotent RBAC seed on application startup
  try {
    const dataSource = app.get(DataSource);
    await seedRbac(dataSource);
  } catch (error) {
    console.error('❌ Failed to run RBAC seed on startup:', error?.message || error);
  }

  await app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
  });
}
bootstrap();

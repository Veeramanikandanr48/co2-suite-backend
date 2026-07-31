import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const config = new DocumentBuilder()
    .setTitle('CO2 Suite Backend API')
    .setDescription('API documentation for CO2 Suite backend services')
    .setVersion('1.0')
    .addTag('Registration', 'User registration and auth endpoints')
    .addTag('Masters', 'Master data endpoints')
    .addTag('Notifications', 'Notification endpoints')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  app.enableCors({
    credentials: true,
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
      : true,
  });
  await app.listen(process.env.PORT || 3000, () => {
    logger.log(`Server running on port ${process.env.PORT || 3000}`);
  });
}
bootstrap();

import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });

const config = {
  type: 'postgres',
  host: `${process.env.PG_DATABASE_HOST}`,
  port: `5432`,
  username: `${process.env.PG_DATABASE_USER}`,
  password: `${process.env.PG_DATABASE_PASSWORD}`,
  database: `${process.env.PG_DATABASE_NAME}`,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Ensure it includes the entity
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  migrationsRun: false,
  synchronize: true,
  logger: 'advanced-console',
  cli: {
    migrationsDir: 'src/migrations',
  },
  //  ssl: {
  //   rejectUnauthorized: false
  //  }
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);

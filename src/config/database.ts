import { Sequelize } from 'sequelize';
import { env } from './env';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions:
    env.NODE_ENV === 'production'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
});

import { drizzle } from 'drizzle-orm/node-postgres';
import { requiredEnv } from '../modules/@common/Env.js';

export const db = drizzle(requiredEnv('DATABASE_URL'), { logger: true });

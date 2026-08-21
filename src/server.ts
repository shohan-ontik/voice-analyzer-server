import { app } from './app';
import { env } from './config/env';
import { sequelize } from './models';

async function main() {
  await sequelize.authenticate();
  app.listen(env.PORT, () => {
    console.log(`voice-analyzer-api listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

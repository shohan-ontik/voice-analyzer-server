import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { openApiDocument } from './docs/openapi';

export const app = express();

// Swagger UI needs inline scripts/styles that helmet's default CSP blocks,
// so this path gets its own CSP-disabled helmet ahead of the strict global
// one below. Docs are unauthenticated by design — they describe the
// contract, not any account's data.
app.use('/api/v1/docs', helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);
app.use(express.json());
app.use(pinoHttp());

app.get('/api/v1/openapi.json', (_req, res) => res.json(openApiDocument));

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

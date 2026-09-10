// Hand-maintained OpenAPI 3.0 document for this service. There is no
// schema-generation pipeline (no zod-to-openapi, no swagger-jsdoc) — this is
// the single source of truth for the public contract and must be updated by
// hand alongside routes/validators/services when either changes.
//
// Served at GET /api/v1/openapi.json and browsable at GET /api/v1/docs
// (see src/app.ts).

const errorResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
});

const bearerAuth = [{ bearerAuth: [] as string[] }];

const page = {
  page: { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  pageSize: { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'voice-analyzer-api',
    version: '0.1.0',
    description:
      "Express + Sequelize + PostgreSQL backend for the voice-analyzer product — single source of truth and auth provider for the `voice-analyzer` practice app and the `voice-analyzer-admin` admin panel.\n\n" +
      'Every error response uses the shape `{ "error": { "message": string, "details"?: unknown } }` — see the `Error` schema. There is no self-signup: accounts are created by an admin via `POST /admin/users`, which returns a one-time temporary password.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth', description: 'Login and the caller\'s own account.' },
    { name: 'Admin: Users', description: 'Admin-only user management.' },
    { name: 'Admin: Stats', description: 'Admin-only dashboard totals.' },
    { name: 'Topics', description: 'Practice scenario topics (name + reference facts).' },
    { name: 'Score Categories', description: 'The rubric categories a pitch is scored against.' },
    { name: 'Practice Sessions', description: "The caller's own scored practice attempts." },
    { name: 'Modules', description: 'Trainee-facing training modules, chapters, and exams.' },
    { name: 'Admin: Modules', description: 'Admin CRUD for modules, chapters, materials, and exams.' },
    { name: 'Media', description: 'Streams uploaded/demo learning-material files.' },
  ],
  security: bearerAuth,
  paths: {
    '/healthz': {
      get: {
        tags: ['Auth'],
        summary: 'Liveness + database check',
        description: 'Calls `sequelize.authenticate()` to confirm the database connection is actually up, not just that the process is running.',
        security: [],
        responses: {
          200: {
            description: 'Service and database are both up.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean', example: true }, database: { type: 'string', enum: ['up'] } },
                  required: ['ok', 'database'],
                },
              },
            },
          },
          503: {
            description: 'Service is running but the database is unreachable.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean', example: false }, database: { type: 'string', enum: ['down'] } },
                  required: ['ok', 'database'],
                },
              },
            },
          },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email + password',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Authenticated.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Invalid email or password.'),
          403: errorResponse('This account has been suspended.'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: "Get the caller's own account",
        responses: {
          200: { description: 'OK.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppUser' } } } },
          401: errorResponse('Missing/invalid/expired token, or the user no longer exists.'),
        },
      },
    },
    '/auth/me/password': {
      patch: {
        tags: ['Auth'],
        summary: "Change the caller's own password",
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
        },
        responses: {
          200: {
            description: 'Password changed.',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } } } },
          },
          400: errorResponse('Current password is incorrect, or the request body is invalid.'),
          401: errorResponse('Missing/invalid/expired token.'),
        },
      },
    },

    '/admin/users': {
      post: {
        tags: ['Admin: Users'],
        summary: 'Create a user',
        description: 'Admin only. Returns the generated (or supplied) one-time temporary password — shown to the admin exactly once.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } },
        },
        responses: {
          201: {
            description: 'Created.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserResponse' } } },
          },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          409: errorResponse('A user with this email or employee ID already exists.'),
        },
      },
      get: {
        tags: ['Admin: Users'],
        summary: 'List users',
        description: 'Admin only.',
        parameters: [
          page.page,
          page.pageSize,
          { name: 'q', in: 'query', description: 'Case-insensitive match against email, name, or employee ID.', schema: { type: 'string' } },
          { name: 'isBanned', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PageInfo' },
                    { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/AppUser' } } } },
                  ],
                },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
        },
      },
    },
    '/admin/users/{id}/ban': {
      post: {
        tags: ['Admin: Users'],
        summary: 'Ban a user',
        description: "Admin only. Bumps the target's token version, invalidating all of their existing access tokens immediately.",
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        responses: {
          200: { description: 'Banned.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppUser' } } } },
          400: errorResponse('Caller attempted to ban their own account.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('User not found.'),
        },
      },
    },
    '/admin/users/{id}/unban': {
      post: {
        tags: ['Admin: Users'],
        summary: 'Unban a user',
        description: 'Admin only.',
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        responses: {
          200: { description: 'Unbanned.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppUser' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('User not found.'),
        },
      },
    },
    '/admin/users/{id}': {
      delete: {
        tags: ['Admin: Users'],
        summary: 'Delete a user',
        description:
          'Admin only. Permanently deletes the account. Cascades to their practice sessions and chapter progress (both CASCADE on userId) — this cannot be undone. A caller cannot delete their own account.',
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        responses: {
          204: { description: 'Deleted.' },
          400: errorResponse('Caller attempted to delete their own account.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('User not found.'),
        },
      },
    },

    '/admin/stats/summary': {
      get: {
        tags: ['Admin: Stats'],
        summary: 'Site-wide totals',
        description: 'Admin only.',
        responses: {
          200: { description: 'OK.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminStatsSummary' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
        },
      },
    },

    '/admin/topics': {
      post: {
        tags: ['Topics'],
        summary: 'Create a topic',
        description: 'Admin only.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTopicRequest' } } } },
        responses: {
          201: { description: 'Created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Topic' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
        },
      },
      get: {
        tags: ['Topics'],
        summary: 'List topics (admin — includes inactive)',
        description: 'Admin only.',
        parameters: [
          page.page,
          page.pageSize,
          { name: 'q', in: 'query', description: 'Case-insensitive match against name.', schema: { type: 'string' } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PageInfo' },
                    { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Topic' } } } },
                  ],
                },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
        },
      },
    },
    '/admin/topics/{id}': {
      patch: {
        tags: ['Topics'],
        summary: 'Update a topic',
        description: 'Admin only.',
        parameters: [{ $ref: '#/components/parameters/TopicId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTopicRequest' } } } },
        responses: {
          200: { description: 'Updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Topic' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Topic not found.'),
        },
      },
      delete: {
        tags: ['Topics'],
        summary: 'Delete a topic',
        description: 'Admin only.',
        parameters: [{ $ref: '#/components/parameters/TopicId' }],
        responses: {
          204: { description: 'Deleted.' },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Topic not found.'),
        },
      },
    },
    '/topics': {
      get: {
        tags: ['Topics'],
        summary: 'List active topics',
        description: "Any authenticated user — the practice app's scenario picker. Active topics only, no admin fields.",
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Topic' } } } },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
        },
      },
    },

    '/admin/score-categories': {
      post: {
        tags: ['Score Categories'],
        summary: 'Create a score category',
        description: 'Admin only.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateScoreCategoryRequest' } } } },
        responses: {
          201: { description: 'Created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreCategory' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          409: errorResponse('A category with this name already exists.'),
        },
      },
      get: {
        tags: ['Score Categories'],
        summary: 'List score categories (admin — includes inactive)',
        description: 'Admin only.',
        parameters: [
          page.page,
          page.pageSize,
          { name: 'q', in: 'query', description: 'Case-insensitive match against name.', schema: { type: 'string' } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PageInfo' },
                    { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/ScoreCategory' } } } },
                  ],
                },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
        },
      },
    },
    '/admin/score-categories/{id}': {
      patch: {
        tags: ['Score Categories'],
        summary: 'Update a score category',
        description: 'Admin only.',
        parameters: [{ $ref: '#/components/parameters/ScoreCategoryId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateScoreCategoryRequest' } } } },
        responses: {
          200: { description: 'Updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreCategory' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Category not found.'),
          409: errorResponse('A category with this name already exists.'),
        },
      },
      delete: {
        tags: ['Score Categories'],
        summary: 'Delete a score category',
        description: 'Admin only.',
        parameters: [{ $ref: '#/components/parameters/ScoreCategoryId' }],
        responses: {
          204: { description: 'Deleted.' },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Category not found.'),
        },
      },
    },
    '/score-categories': {
      get: {
        tags: ['Score Categories'],
        summary: 'List active score categories',
        description: "Any authenticated user — the practice app's scoring pipeline. Active categories only, no admin fields.",
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/ScoreCategory' } } } },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
        },
      },
    },

    '/practice-sessions': {
      post: {
        tags: ['Practice Sessions'],
        summary: 'Save a scored practice session',
        description:
          'The score itself is computed client-side (the voice-analyzer frontend calls Gemini directly) — this just persists the result against the caller.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePracticeSessionRequest' } } },
        },
        responses: {
          201: { description: 'Saved.', content: { 'application/json': { schema: { $ref: '#/components/schemas/PracticeSession' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
        },
      },
      get: {
        tags: ['Practice Sessions'],
        summary: "List the caller's own practice sessions",
        parameters: [page.page, page.pageSize, { name: 'topicId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PageInfo' },
                    { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/PracticeSession' } } } },
                  ],
                },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
        },
      },
    },
    '/practice-sessions/stats/summary': {
      get: {
        tags: ['Practice Sessions'],
        summary: "The caller's own stats summary",
        responses: {
          200: { description: 'OK.', content: { 'application/json': { schema: { $ref: '#/components/schemas/StatsSummary' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
        },
      },
    },
    '/practice-sessions/{id}': {
      get: {
        tags: ['Practice Sessions'],
        summary: 'Get one of the caller\'s own practice sessions',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'OK.', content: { 'application/json': { schema: { $ref: '#/components/schemas/PracticeSession' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
          404: errorResponse('Practice session not found, or belongs to another user.'),
        },
      },
    },

    '/modules': {
      get: {
        tags: ['Modules'],
        summary: 'List active modules with the caller\'s progress',
        description: 'Each chapter carries `completedAt` and the exam carries `bestScore`/`passed`, both derived for the calling user.',
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/TrainingModule' } } } },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
        },
      },
    },
    '/modules/{slug}': {
      get: {
        tags: ['Modules'],
        summary: 'Get one active module with the caller\'s progress',
        parameters: [{ $ref: '#/components/parameters/ModuleSlug' }],
        responses: {
          200: { description: 'OK.', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrainingModule' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
          404: errorResponse('Module not found (or not active).'),
        },
      },
    },
    '/modules/{slug}/chapters/{chapterSlug}/complete': {
      post: {
        tags: ['Modules'],
        summary: 'Mark a chapter complete for the caller',
        description: 'Idempotent — completing an already-completed chapter keeps its original `completedAt`.',
        parameters: [
          { $ref: '#/components/parameters/ModuleSlug' },
          { name: 'chapterSlug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { completed: { type: 'boolean', example: true }, completedAt: { type: 'string', format: 'date-time' } },
                },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
          404: errorResponse('Chapter not found in this module.'),
        },
      },
    },

    '/media/materials/{materialId}/video': {
      get: {
        tags: ['Media'],
        summary: 'Stream a video material',
        description: 'Supports byte-range requests (`Range` header) for seeking. Legacy materials with no uploaded file stream a shared demo video.',
        parameters: [{ $ref: '#/components/parameters/MaterialId' }, { $ref: '#/components/parameters/RangeHeader' }],
        responses: {
          200: { description: 'Full file.', content: { 'video/mp4': { schema: { type: 'string', format: 'binary' } } } },
          206: { description: 'Partial content (range request).', content: { 'video/mp4': { schema: { type: 'string', format: 'binary' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
          404: errorResponse('Material not found, not a video, or has no file.'),
          416: { description: 'Range not satisfiable.' },
        },
      },
    },
    '/media/materials/{materialId}/pdf': {
      get: {
        tags: ['Media'],
        summary: 'Stream a PDF material',
        parameters: [{ $ref: '#/components/parameters/MaterialId' }, { $ref: '#/components/parameters/RangeHeader' }],
        responses: {
          200: { description: 'Full file.', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
          206: { description: 'Partial content (range request).', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
          404: errorResponse('Material not found, not a PDF, or has no file.'),
          416: { description: 'Range not satisfiable.' },
        },
      },
    },
    '/media/materials/{materialId}/audio': {
      get: {
        tags: ['Media'],
        summary: 'Stream an audio material',
        description: 'Unlike video/pdf, there is no shared demo fallback — a legacy material with no uploaded file 404s.',
        parameters: [{ $ref: '#/components/parameters/MaterialId' }, { $ref: '#/components/parameters/RangeHeader' }],
        responses: {
          200: { description: 'Full file.', content: { 'audio/mpeg': { schema: { type: 'string', format: 'binary' } } } },
          206: { description: 'Partial content (range request).', content: { 'audio/mpeg': { schema: { type: 'string', format: 'binary' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
          404: errorResponse('Material not found, not audio, or has no file.'),
          416: { description: 'Range not satisfiable.' },
        },
      },
    },

    '/admin/modules': {
      get: {
        tags: ['Admin: Modules'],
        summary: 'List all modules (admin — includes inactive)',
        description: 'Admin only.',
        responses: {
          200: {
            description: 'OK.',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/AdminModuleSummary' } } } },
              },
            },
          },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
        },
      },
      post: {
        tags: ['Admin: Modules'],
        summary: 'Create a module',
        description: 'Admin only. Created inactive; a slug is auto-generated from the title.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateModuleRequest' } } } },
        responses: {
          201: { description: 'Created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminModuleBase' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
        },
      },
    },
    '/admin/modules/{id}': {
      get: {
        tags: ['Admin: Modules'],
        summary: 'Get one module with chapters and exam (admin)',
        description: 'Admin only.',
        parameters: [{ $ref: '#/components/parameters/ModuleId' }],
        responses: {
          200: { description: 'OK.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminModuleDetail' } } } },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module not found.'),
        },
      },
      patch: {
        tags: ['Admin: Modules'],
        summary: 'Update a module',
        description:
          'Admin only. Setting `isActive: true` requires the module to already have at least one chapter and an exam, or the request is rejected with 400.',
        parameters: [{ $ref: '#/components/parameters/ModuleId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateModuleRequest' } } } },
        responses: {
          200: { description: 'Updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminModuleBase' } } } },
          400: errorResponse("Invalid request body, or publishing was attempted before the module has a chapter and an exam."),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module not found.'),
        },
      },
      delete: {
        tags: ['Admin: Modules'],
        summary: 'Delete a module',
        description:
          'Admin only. Cascades to its chapters, materials (including deleting uploaded files from disk), and exam. Practice sessions that reference them keep their history — their chapterId/examId is set to null.',
        parameters: [{ $ref: '#/components/parameters/ModuleId' }],
        responses: {
          204: { description: 'Deleted.' },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module not found.'),
        },
      },
    },
    '/admin/modules/{id}/chapters': {
      post: {
        tags: ['Admin: Modules'],
        summary: 'Add a chapter to a module',
        description:
          'Admin only. A slug is auto-generated from the title. If `scenario` is omitted, a TODO placeholder is stored (the admin app normally generates one via AI before calling this).',
        parameters: [{ $ref: '#/components/parameters/ModuleId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateChapterRequest' } } } },
        responses: {
          201: { description: 'Created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ModuleChapterAdmin' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module not found.'),
        },
      },
    },
    '/admin/modules/{id}/chapters/{chapterId}': {
      patch: {
        tags: ['Admin: Modules'],
        summary: 'Update a chapter',
        description: 'Admin only.',
        parameters: [{ $ref: '#/components/parameters/ModuleId' }, { $ref: '#/components/parameters/ChapterId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateChapterRequest' } } } },
        responses: {
          200: { description: 'Updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ModuleChapterAdmin' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module or chapter not found.'),
        },
      },
      delete: {
        tags: ['Admin: Modules'],
        summary: 'Delete a chapter',
        description: 'Admin only. Deletes its materials (including uploaded files from disk) along with it.',
        parameters: [{ $ref: '#/components/parameters/ModuleId' }, { $ref: '#/components/parameters/ChapterId' }],
        responses: {
          204: { description: 'Deleted.' },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module or chapter not found.'),
        },
      },
    },
    '/admin/modules/{id}/chapters/{chapterId}/materials': {
      post: {
        tags: ['Admin: Modules'],
        summary: 'Upload a learning material to a chapter',
        description: 'Admin only. Accepts one file (`video/*`, `audio/*`, or `application/pdf`) up to `MAX_UPLOAD_SIZE_MB` (default 200MB).',
        parameters: [{ $ref: '#/components/parameters/ModuleId' }, { $ref: '#/components/parameters/ChapterId' }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'title'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  title: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Uploaded.', content: { 'application/json': { schema: { $ref: '#/components/schemas/LearningMaterialCreated' } } } },
          400: errorResponse('Missing file/title, unsupported file type, or file too large.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module or chapter not found.'),
        },
      },
    },
    '/admin/modules/{id}/chapters/{chapterId}/materials/{materialId}': {
      delete: {
        tags: ['Admin: Modules'],
        summary: 'Delete a learning material',
        description: 'Admin only. Deletes the uploaded file from disk, if any.',
        parameters: [
          { $ref: '#/components/parameters/ModuleId' },
          { $ref: '#/components/parameters/ChapterId' },
          { name: 'materialId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Deleted.' },
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module, chapter, or material not found.'),
        },
      },
    },
    '/admin/modules/{id}/exam': {
      put: {
        tags: ['Admin: Modules'],
        summary: "Create or update a module's exam",
        description: 'Admin only. A module has at most one exam; this creates it on first call and updates it thereafter.',
        parameters: [{ $ref: '#/components/parameters/ModuleId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpsertExamRequest' } } } },
        responses: {
          200: { description: 'Created or updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ExamAdminDetail' } } } },
          400: errorResponse('Invalid request body.'),
          401: errorResponse('Missing/invalid/expired token.'),
          403: errorResponse('Caller is not an admin.'),
          404: errorResponse('Module not found.'),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Obtained from `POST /auth/login`. Send as `Authorization: Bearer <accessToken>`.',
      },
    },
    parameters: {
      UserId: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      TopicId: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ScoreCategoryId: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ModuleId: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ChapterId: { name: 'chapterId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      MaterialId: { name: 'materialId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ModuleSlug: { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
      RangeHeader: {
        name: 'Range',
        in: 'header',
        description: 'Byte range, e.g. `bytes=0-1023`.',
        schema: { type: 'string' },
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: {},
            },
            required: ['message'],
          },
        },
        required: ['error'],
      },
      PageInfo: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
        required: ['total', 'page', 'pageSize'],
      },

      AppUser: {
        type: 'object',
        description: "Mirrors User#toSafeJSON() — never includes passwordHash or tokenVersion.",
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin'] },
          isBanned: { type: 'boolean' },
          mustChangePassword: { type: 'boolean' },
          lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
          employeeId: { type: 'string', nullable: true },
          department: { type: 'string', nullable: true },
          jobTitle: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'email', 'name', 'role', 'isBanned', 'mustChangePassword', 'lastLoginAt', 'employeeId', 'department', 'jobTitle', 'createdAt'],
      },
      LoginRequest: {
        type: 'object',
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
        required: ['email', 'password'],
      },
      LoginResponse: {
        type: 'object',
        properties: { accessToken: { type: 'string' }, user: { $ref: '#/components/schemas/AppUser' } },
        required: ['accessToken', 'user'],
      },
      ChangePasswordRequest: {
        type: 'object',
        properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } },
        required: ['currentPassword', 'newPassword'],
      },
      CreateUserRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1, maxLength: 255 },
          role: { type: 'string', enum: ['user', 'admin'], default: 'user' },
          tempPassword: { type: 'string', minLength: 8, description: 'Auto-generated if omitted.' },
          employeeId: { type: 'string', maxLength: 64 },
          department: { type: 'string', maxLength: 255 },
          jobTitle: { type: 'string', maxLength: 255 },
        },
        required: ['email', 'name'],
      },
      CreateUserResponse: {
        allOf: [
          { $ref: '#/components/schemas/AppUser' },
          {
            type: 'object',
            properties: { tempPassword: { type: 'string', description: 'One-time — not recoverable after this response.' } },
            required: ['tempPassword'],
          },
        ],
      },

      AdminStatsSummary: {
        type: 'object',
        properties: {
          totalUsers: { type: 'integer' },
          bannedUsers: { type: 'integer' },
          totalPracticeSessions: { type: 'integer' },
          sessionsThisWeek: { type: 'integer', description: 'Created in the last 7 days, across all users.' },
        },
        required: ['totalUsers', 'bannedUsers', 'totalPracticeSessions', 'sessionsThisWeek'],
      },

      Topic: {
        type: 'object',
        description: 'An admin-managed practice scenario: a display name plus the key facts (in Bangla) a pitch should cover — not a verbatim script.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          passage: { type: 'string' },
          isActive: { type: 'boolean' },
        },
        required: ['id', 'name', 'passage', 'isActive'],
      },
      CreateTopicRequest: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1, maxLength: 255 }, passage: { type: 'string', minLength: 1 } },
        required: ['name', 'passage'],
      },
      UpdateTopicRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          passage: { type: 'string', minLength: 1 },
          isActive: { type: 'boolean' },
        },
      },

      ScoreCategory: {
        type: 'object',
        description: 'An admin-managed scoring rubric category the AI marks a pitch on (e.g. "Confidence", "Pacing").',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          isActive: { type: 'boolean' },
        },
        required: ['id', 'name', 'isActive'],
      },
      CreateScoreCategoryRequest: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1, maxLength: 100 } },
        required: ['name'],
      },
      UpdateScoreCategoryRequest: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1, maxLength: 100 }, isActive: { type: 'boolean' } },
      },

      CategoryBreakdown: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          score: { type: 'number', minimum: 0, maximum: 100 },
          feedback: { type: 'string' },
          tips: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'score', 'feedback', 'tips'],
      },
      TranscriptSegment: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          kind: { type: 'string', enum: ['plain', 'filler', 'pronunciation'] },
        },
        required: ['text', 'kind'],
      },
      CreatePracticeSessionRequest: {
        type: 'object',
        properties: {
          topicId: { type: 'string', format: 'uuid', nullable: true },
          topicName: { type: 'string', minLength: 1 },
          overall: { type: 'number', minimum: 0, maximum: 100 },
          verdict: { type: 'string' },
          categories: { type: 'array', items: { $ref: '#/components/schemas/CategoryBreakdown' }, minItems: 1 },
          transcript: { type: 'array', items: { $ref: '#/components/schemas/TranscriptSegment' } },
        },
        required: ['topicName', 'overall', 'verdict', 'categories', 'transcript'],
      },
      PracticeSession: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          topicId: { type: 'string', format: 'uuid', nullable: true },
          topicName: { type: 'string' },
          chapterId: { type: 'string', format: 'uuid', nullable: true, description: 'Set when this session is a chapter roleplay attempt.' },
          examId: { type: 'string', format: 'uuid', nullable: true, description: 'Set when this session is a graded exam attempt.' },
          overallScore: { type: 'integer', minimum: 0, maximum: 100 },
          verdict: { type: 'string' },
          categories: { type: 'array', items: { $ref: '#/components/schemas/CategoryBreakdown' } },
          transcript: { type: 'array', items: { $ref: '#/components/schemas/TranscriptSegment' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'userId', 'topicId', 'topicName', 'overallScore', 'verdict', 'categories', 'transcript', 'createdAt', 'updatedAt'],
      },
      StatsSummary: {
        type: 'object',
        properties: {
          lastScore: { type: 'integer', nullable: true },
          lastSessionAt: { type: 'string', format: 'date-time', nullable: true },
          sessionsThisWeek: { type: 'integer' },
          averageScoreThisWeek: { type: 'integer', nullable: true },
          totalSessions: { type: 'integer' },
        },
        required: ['lastScore', 'lastSessionAt', 'sessionsThisWeek', 'averageScoreThisWeek', 'totalSessions'],
      },

      PitchScenario: {
        type: 'object',
        description: 'The AI roleplay scenario a rep practices against for a chapter.',
        properties: {
          clientInitials: { type: 'string', maxLength: 10 },
          clientName: { type: 'string', maxLength: 255 },
          clientTitle: { type: 'string', maxLength: 255 },
          objection: { type: 'string', maxLength: 2000 },
          objective: { type: 'string', maxLength: 2000 },
          criteria: { type: 'array', items: { type: 'string', maxLength: 500 }, maxItems: 10 },
        },
        required: ['clientInitials', 'clientName', 'clientTitle', 'objection', 'objective', 'criteria'],
      },
      LearningMaterial: {
        type: 'object',
        description: 'Trainee-facing shape (as returned nested in GET /modules and GET /modules/{slug}).',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['video', 'pdf', 'audio'] },
          title: { type: 'string' },
          meta: { type: 'string', description: 'e.g. "10 mins" for video/audio, "6 pages" for a PDF.' },
          filename: { type: 'string' },
        },
        required: ['id', 'type', 'title', 'meta', 'filename'],
      },
      LearningMaterialSummary: {
        type: 'object',
        description: 'Nested shape returned inside GET /admin/modules/{id} (no filename).',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['video', 'pdf', 'audio'] },
          title: { type: 'string' },
          meta: { type: 'string' },
        },
        required: ['id', 'type', 'title', 'meta'],
      },
      LearningMaterialCreated: {
        type: 'object',
        description: 'Full row, returned by the upload endpoint.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          chapterId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['video', 'pdf', 'audio'] },
          title: { type: 'string' },
          meta: { type: 'string' },
          filename: { type: 'string', description: "The uploaded file's original name." },
          order: { type: 'integer' },
          storageKey: { type: 'string', nullable: true, description: 'Name of the file on disk under UPLOAD_DIR.' },
          mimeType: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      ModuleChapter: {
        type: 'object',
        description: "Trainee-facing shape. `completedAt` is the only completion signal — null means not completed by the calling user.",
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          order: { type: 'integer' },
          scenario: { $ref: '#/components/schemas/PitchScenario' },
          materials: { type: 'array', items: { $ref: '#/components/schemas/LearningMaterial' } },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
        required: ['id', 'slug', 'title', 'description', 'order', 'scenario', 'materials', 'completedAt'],
      },
      ModuleChapterAdmin: {
        type: 'object',
        description: 'Raw row shape returned by the admin create/update chapter endpoints.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          moduleId: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          scenario: { $ref: '#/components/schemas/PitchScenario' },
          order: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ModuleExam: {
        type: 'object',
        description: '`bestScore`/`passed` are derived server-side from the caller\'s own PracticeSession attempts against this exam — not stored fields.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          moduleLabel: { type: 'string' },
          scenario: { type: 'string' },
          passMark: { type: 'integer' },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          bestScore: { type: 'integer', nullable: true },
          passed: { type: 'boolean' },
        },
        required: ['id', 'slug', 'title', 'moduleLabel', 'scenario', 'passMark', 'dueDate', 'bestScore', 'passed'],
        nullable: true,
      },
      TrainingModule: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          thumbnailUrl: { type: 'string', nullable: true },
          order: { type: 'integer' },
          chapters: { type: 'array', items: { $ref: '#/components/schemas/ModuleChapter' } },
          exam: { $ref: '#/components/schemas/ModuleExam' },
        },
        required: ['id', 'slug', 'title', 'description', 'thumbnailUrl', 'order', 'chapters', 'exam'],
      },

      AdminModuleBase: {
        type: 'object',
        description: 'Raw row shape returned by the admin create/update module endpoints.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          thumbnailUrl: { type: 'string', nullable: true },
          order: { type: 'integer' },
          isActive: { type: 'boolean' },
          publishDate: { type: 'string', format: 'date', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AdminModuleSummary: {
        type: 'object',
        description: 'Nested-count shape returned by GET /admin/modules.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          thumbnailUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          chapterCount: { type: 'integer' },
          examCount: { type: 'integer', enum: [0, 1] },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'slug', 'title', 'description', 'thumbnailUrl', 'isActive', 'chapterCount', 'examCount', 'updatedAt'],
      },
      ExamAdminDetail: {
        type: 'object',
        description: "Nested shape returned by GET /admin/modules/{id}'s `exam` field, and the full row returned by PUT /admin/modules/{id}/exam.",
        properties: {
          id: { type: 'string', format: 'uuid' },
          moduleId: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          moduleLabel: { type: 'string' },
          scenario: { type: 'string' },
          passMark: { type: 'integer' },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          deadlineDays: { type: 'integer', nullable: true, description: 'Days after enrollment this exam is due, as authored by the admin.' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AdminModuleDetail: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          thumbnailUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          publishDate: { type: 'string', format: 'date', nullable: true },
          chapters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                slug: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                order: { type: 'integer' },
                materials: { type: 'array', items: { $ref: '#/components/schemas/LearningMaterialSummary' } },
              },
            },
          },
          exam: {
            nullable: true,
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              passMark: { type: 'integer' },
              scenario: { type: 'string' },
              deadlineDays: { type: 'integer', nullable: true },
            },
          },
        },
      },
      CreateModuleRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          thumbnailUrl: { type: 'string', format: 'uri', maxLength: 1000 },
        },
        required: ['title'],
      },
      UpdateModuleRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          thumbnailUrl: { type: 'string', format: 'uri', maxLength: 1000 },
          isActive: { type: 'boolean' },
          publishDate: { type: 'string', format: 'date', nullable: true },
        },
      },
      CreateChapterRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          scenario: { $ref: '#/components/schemas/PitchScenario' },
        },
        required: ['title'],
      },
      UpdateChapterRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          scenario: { $ref: '#/components/schemas/PitchScenario' },
        },
      },
      UpsertExamRequest: {
        type: 'object',
        properties: {
          scenario: { type: 'string', maxLength: 10000 },
          deadlineDays: { type: 'integer', minimum: 0, maximum: 365, nullable: true },
          passMark: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
  },
};

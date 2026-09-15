# ---- deps: install node_modules (bcrypt needs a native build toolchain) ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript to dist/ ----
FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json .sequelizerc ./
COPY --from=build /app/dist ./dist

# sequelize-cli reads these directly (not compiled to dist)
COPY src/migrations ./src/migrations
COPY src/seeders ./src/seeders
COPY src/config/sequelize-cli.js ./src/config/sequelize-cli.js

# demo/fixture assets served by the API; storage/uploads is a runtime volume
COPY storage/demo-chapter-guide.pdf storage/demo-chapter-video.mp4 ./storage/
RUN mkdir -p storage/uploads

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]

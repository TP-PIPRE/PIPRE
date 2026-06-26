# BUILD
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_USE_LOCAL_BACKEND=false
ARG VITE_LOCAL_BACKEND_URL=http://localhost:8080
ENV VITE_USE_LOCAL_BACKEND=$VITE_USE_LOCAL_BACKEND
ENV VITE_LOCAL_BACKEND_URL=$VITE_LOCAL_BACKEND_URL

# Activar pnpm (mejor que instalar global)
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# RUNTIME
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

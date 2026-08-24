# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
ARG VITE_API_URL=/
ARG VITE_API_PREFIX=/api/v1
ARG VITE_SITE_URL=https://linkbajar.com
ARG VITE_SITE_NAME="Link Bajar"
ENV VITE_API_URL=$VITE_API_URL VITE_API_PREFIX=$VITE_API_PREFIX VITE_SITE_URL=$VITE_SITE_URL VITE_SITE_NAME=$VITE_SITE_NAME
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80

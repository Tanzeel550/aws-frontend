# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Same env var your EC2 script wrote to .env
# Overridable at build time: docker build --build-arg VITE_API_URL=/api .
ARG VITE_API_URL=/api
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env

RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config template — nginx's official entrypoint auto-runs
# envsubst on every file in /etc/nginx/templates/*.template at container
# startup, writing the result to /etc/nginx/conf.d/ (dropping .template).
# This lets you set BACKEND_URL as an ECS task env var instead of
# rebuilding the image every time the backend URL changes.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV BACKEND_URL=http://narkina-backend-lb-588993471.eu-north-1.elb.amazonaws.com/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
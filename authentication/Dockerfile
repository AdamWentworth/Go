# authentication Dockerfile

FROM node:20-alpine

WORKDIR /usr/src/app

# mongodump is used by backup tasks.
RUN apk add --no-cache mongodb-tools

COPY package*.json ./

ENV NODE_ENV=production
RUN npm ci --omit=dev \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY . .

EXPOSE 3002

CMD ["node", "app.js"]

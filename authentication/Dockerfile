# authentication Dockerfile

FROM node:20-alpine

WORKDIR /usr/src/app

# mongodump is used by backup tasks.
RUN apk add --no-cache mongodb-tools \
    && addgroup -S adam \
    && adduser -S -D -H -G adam adam

COPY package*.json ./

ENV NODE_ENV=production
RUN npm ci --omit=dev \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --chown=adam:adam . .

RUN mkdir -p /usr/src/app/backups \
    && chown -R adam:adam /usr/src/app

USER adam

EXPOSE 3002

CMD ["node", "app.js"]

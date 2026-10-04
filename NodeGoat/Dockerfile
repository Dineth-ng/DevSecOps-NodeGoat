# Stage 1 - Install production dependencies

FROM node:12-alpine AS dependencies

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production


# Stage 2 - Runtime container

FROM node:12-alpine

WORKDIR /home/node/app

COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Copy application files
COPY --chown=node:node . .

# Application port
EXPOSE 4000

# Run application as non-root user
USER node

CMD ["npm", "start"]
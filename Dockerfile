# build stage
FROM node:20 AS build
WORKDIR /app

# copy dependencies and install
COPY package*.json ./
RUN npm install

# copy all files
COPY . .

# build Angular
RUN npm run build

# production stage
FROM node:20 AS server
WORKDIR /app

# copy only necessary files
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY server.js .

EXPOSE 8080
CMD ["node", "server.js"]

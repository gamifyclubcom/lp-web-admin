FROM node:16-alpine
# ENV CI=true

WORKDIR /app
COPY package*.json ./
RUN npm install --force
COPY . .
RUN npm run build --force

CMD [ "node", "express/index.js" ]
FROM node:20-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN chmod +x node_modules/.bin/vite

EXPOSE 5173

CMD ["npm", "run", "dev"]
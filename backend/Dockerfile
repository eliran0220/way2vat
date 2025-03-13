FROM node:18-alpine3.16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY backend ./backend

WORKDIR /app/backend

EXPOSE 3000 9229

CMD ["npm", "start"]

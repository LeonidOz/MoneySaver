FROM node:22

WORKDIR /app

RUN npm install -g npm@11.4.2

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3020

CMD ["node", "index.js"]
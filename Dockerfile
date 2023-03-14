FROM node:16-alpine
RUN apt-get update && apt-get install -y graphicsmagick
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
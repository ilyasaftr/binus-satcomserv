FROM node:16-bullseye
RUN apt-get update -y && apt-get install -y graphicsmagick
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
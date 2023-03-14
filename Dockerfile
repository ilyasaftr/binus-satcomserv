FROM node:lts
RUN apt-get update -y && apt-get install -y graphicsmagick
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
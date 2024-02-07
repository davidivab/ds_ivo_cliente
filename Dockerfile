FROM node:14

RUN mkdir -p /home/app
RUN npm install --quiet

COPY . /home/app

EXPOSE 3001

CMD ["node", "/home/app/index.js"]
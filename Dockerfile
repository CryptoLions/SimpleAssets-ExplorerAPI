FROM node:12.13.1

ARG PORT=3045
ENV PORT=${PORT}

RUN apt-get update && apt-get install -y git git-core

WORKDIR /home/sa
COPY . /home/sa

RUN npm install -g pm2@2.10.4
RUN cd /home/sa && npm install

CMD ["pm2-runtime", "/home/sa/ecosystem.config.js"]

EXPOSE ${PORT}
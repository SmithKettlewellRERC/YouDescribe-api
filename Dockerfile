FROM node:14

WORKDIR /home/youdescribe-api
COPY ./ ./

ARG DB_HOST
ARG NODE_ENV

ENV DB_HOST ${DB_HOST}
ENV NODE_ENV ${NODE_ENV}

RUN npm install

EXPOSE 8080

CMD ["npm", "run", "prd"]
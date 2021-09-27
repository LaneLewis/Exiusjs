FROM node:15-alpine
WORKDIR /usr/src/app
COPY ./package*.json ./src
RUN apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
    && npm install \
    && apk del .gyp
EXPOSE 3050
COPY . ./
CMD ["node","./src/System_Operations.js"]
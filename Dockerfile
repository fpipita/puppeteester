FROM node:13-slim AS base

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build

RUN mkdir /src /node_modules
VOLUME /src
VOLUME /node_modules

EXPOSE 3000/tcp
EXPOSE 9229/tcp
EXPOSE 9222/tcp

RUN mkdir /puppeteester
WORKDIR /puppeteester
COPY . .
RUN yarn install

CMD ["yarn", "start"]

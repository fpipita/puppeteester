FROM node:current-buster

RUN curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome-unstable.list \
  && apt-get update \
  && apt-get install -y google-chrome-unstable \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

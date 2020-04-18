FROM node:13.13.0-buster
RUN apt-get update \
  && apt-get install -y bash-completion vim less \
  && curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome-unstable.list \
  && apt-get update \
  && apt-get install -y google-chrome-unstable \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

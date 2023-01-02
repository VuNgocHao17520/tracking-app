FROM base:latest

WORKDIR /app

CMD [ "npx", "expo", "start", "--tunnel" ]
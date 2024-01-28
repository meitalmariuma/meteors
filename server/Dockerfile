FROM node:slim
WORKDIR /server
COPY . .
RUN npm i
CMD ["npm", "run-script", "dev"]
EXPOSE 5000
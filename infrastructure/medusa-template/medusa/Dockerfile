FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx medusa build
WORKDIR /app/.medusa/server
RUN ln -s /app/node_modules ./node_modules
RUN cp -r /app/.medusa/server/public/admin /admin-static
EXPOSE 9000
CMD ["sh", "-c", "cp -r /admin-static/* /app/.medusa/server/public/admin/ 2>/dev/null; npx medusa db:migrate && npx medusa start"]

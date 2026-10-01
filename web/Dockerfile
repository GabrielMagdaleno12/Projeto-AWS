# Imagem base leve com Node.js 20
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Dependências primeiro, para aproveitar o cache de camadas
COPY package*.json ./
RUN npm ci --omit=dev

# Código e arquivos estáticos da página
COPY . .

USER node

# Porta da aplicação web
EXPOSE 8080

# Endereço do back-end. Na AWS, passe o IP privado com: -e BACKEND_URL=http://10.0.x.x:25000
ENV BACKEND_URL=http://localhost:25000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

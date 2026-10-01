# Imagem base leve com Node.js 20
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Copia só os arquivos de dependências primeiro:
# enquanto eles não mudam, o Docker reaproveita o cache desta camada.
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o código da aplicação
COPY . .

# Executa como usuário comum (sem privilégios de root)
USER node

# Porta do back-end
EXPOSE 25000

# O Docker marca o container como "healthy" quando /health responde
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:25000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

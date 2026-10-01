# Projeto 01 - Deploy de aplicação web com Docker na AWS

Duas aplicações Node.js (Express), cada uma em seu container:

| Parte | Porta | Onde roda | Quem acessa |
|---|---|---|---|
| `web/` (página + proxy) | 8080 | EC2 na sub-rede pública | Internet |
| `backend/` (API) | 25000 | EC2 na sub-rede privada | Somente o `web-sg` |

O navegador nunca chama o back-end. A página pede `/api/dados` ao servidor web, e o servidor web consulta o back-end pelo IP privado.

## Rotas

- Back-end: `GET /dados` (dados da página), `GET /health`
- Web: `GET /` (página), `GET /api/dados` (consulta o back-end), `GET /health`

## Testar no seu computador

```bash
docker compose up --build
```
Abra http://localhost:8080.

## Deploy na AWS

Suba este repositório no GitHub (público) e, em cada VM:

**Back-end** (acessado por SSH a partir da web):
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPO.git
cd SEU_REPO/backend
docker build -t backend .
docker run -d --name backend --restart always -p 25000:25000 backend
docker ps
```

**Web:**
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPO.git
cd SEU_REPO/web
docker build -t web .
docker run -d --name web --restart always -p 8080:8080 \
  -e BACKEND_URL=http://IP_PRIVADO_DO_BACKEND:25000 web
docker ps
```

Para atualizar depois de mudar o código: `git pull`, `docker rm -f web` (ou `backend`), `docker build` e `docker run` de novo.

## Testes (guarde os prints)

1. `http://IP_PUBLICO_WEB:8080` mostra a página com os dados e as luzes verdes.
2. Na VM web: `curl http://IP_PRIVADO_BACKEND:25000/dados` responde JSON.
3. No seu computador: `curl --max-time 5 http://IP_PRIVADO_BACKEND:25000/dados` não conecta (IP privado, sem rota pela internet).
4. `docker ps` nas duas VMs mostra o container com status `healthy`.
5. Teste do isolamento pelo SG: tente `curl http://IP_PRIVADO_BACKEND:25000/dados` de uma terceira máquina fora do `web-sg`; deve dar timeout.
6. Pare o container do back-end (`docker stop backend`) e recarregue a página: ela mostra o erro em vermelho. Depois `docker start backend`.

## Solução de problemas

- **Página abre, mas fica vermelha no back-end:** confira o `BACKEND_URL` (IP privado certo, porta 25000) e a regra de entrada 25000 do `backend-sg` com origem `web-sg`.
- **Não abre a página:** confira a regra 8080 do `web-sg` e se está usando `http://`.
- **O IP mudou depois de parar e iniciar a VM:** atualize o `BACKEND_URL` e recrie o container web.

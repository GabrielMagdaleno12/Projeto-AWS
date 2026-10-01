// Back-end do Projeto 01.
// Roda na porta 25000 e só deve ser acessível pela máquina web (garantido pelo backend-sg).
const express = require('express');
const os = require('os');

const PORT = Number(process.env.PORT) || 25000;
const iniciadoEm = Date.now();

const app = express();
app.disable('x-powered-by');

// Descrição da infraestrutura desta implantação (aparece na página web).
const infraestrutura = [
  { nome: 'VPC projeto01', detalhe: 'Rede 10.0.0.0/16 com uma sub-rede pública e uma privada' },
  { nome: 'Sub-rede pública', detalhe: 'Máquina web, com IP público, porta 8080' },
  { nome: 'Sub-rede privada', detalhe: 'Máquina do back-end, sem IP público, porta 25000' },
  { nome: 'web-sg', detalhe: 'Libera a porta 8080 para a internet e o SSH só para o administrador' },
  { nome: 'backend-sg', detalhe: 'Libera a porta 25000 e o SSH somente para o web-sg' },
];

// Remove o prefixo IPv6 que o Node coloca em endereços IPv4 (::ffff:10.0.2.80).
const limparIp = (ip = '') => ip.replace(/^::ffff:/, '');

// Verificação de saúde, usada pelo HEALTHCHECK do Docker.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota principal: fornece os dados para montar a página web.
app.get('/dados', (req, res) => {
  res.json({
    mensagem: 'Olá! Esta resposta foi gerada pelo back-end na porta 25000.',
    servidor: os.hostname(),
    hora: new Date().toISOString(),
    uptime_segundos: Math.round((Date.now() - iniciadoEm) / 1000),
    requisicao_de: limparIp(req.socket.remoteAddress),
    versao_node: process.version,
    infraestrutura,
  });
});

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// 0.0.0.0 é necessário para o container aceitar conexões de fora dele.
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Back-end ouvindo na porta ${PORT}`);
});

// Encerramento limpo quando o Docker para o container.
for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => server.close(() => process.exit(0)));
}

// Servidor web do Projeto 01.
// Entrega a página na porta 8080 e busca os dados no back-end (porta 25000).
// O navegador NUNCA fala com o back-end: só esta máquina tem permissão (web-sg -> backend-sg).
const express = require('express');
const os = require('os');
const path = require('path');

const PORT = Number(process.env.PORT) || 8080;
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:25000').replace(/\/$/, '');
const TIMEOUT_MS = 3000;

const app = express();
app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota que a página chama. Ela consulta o back-end e devolve o resultado com a latência medida.
app.get('/api/dados', async (req, res) => {
  const inicio = Date.now();
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${BACKEND_URL}/dados`, { signal: controle.signal });
    if (!resposta.ok) throw new Error(`Back-end respondeu ${resposta.status}`);
    const backend = await resposta.json();

    res.set('Cache-Control', 'no-store');
    res.json({
      ok: true,
      latencia_ms: Date.now() - inicio,
      web: { servidor: os.hostname() },
      backend,
    });
  } catch (erro) {
    console.error('Falha ao consultar o back-end:', erro.message);
    res.status(502).json({
      ok: false,
      erro: erro.name === 'AbortError'
        ? 'O back-end não respondeu em 3 segundos.'
        : 'Não foi possível falar com o back-end.',
    });
  } finally {
    clearTimeout(timer);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web ouvindo na porta ${PORT}, back-end em ${BACKEND_URL}`);
});

for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => server.close(() => process.exit(0)));
}

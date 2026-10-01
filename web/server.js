// Servidor web do Projeto 01.
// Escuta na porta 8080, busca os dados no back-end (porta 25000) e monta a página em HTML.
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

// Evita que texto vindo do back-end seja interpretado como HTML.
const esc = (v) => String(v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Desenha o caminho da requisição: navegador -> web -> back-end.
function rota(ok, textoElo, backHost) {
  const estado = ok ? 'ok' : 'erro';
  return `
    <section class="painel">
      <div class="topo">
        <h2>Caminho da requisição</h2>
        <a class="botao" href="/">Atualizar dados</a>
      </div>
      <ol class="rota">
        <li class="no ok"><strong>Seu navegador</strong><span>Internet</span></li>
        <li class="elo ok"><span>porta 8080</span></li>
        <li class="no ok"><strong>Servidor web</strong><span>${esc(os.hostname())}</span></li>
        <li class="elo ${estado}"><span>${esc(textoElo)}</span></li>
        <li class="no ${estado}"><strong>Back-end</strong><span>${esc(backHost)}</span></li>
      </ol>`;
}

function pagina(conteudo) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Projeto 01 - Deploy com Docker na AWS</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main>
    <h1>Deploy com Docker na AWS</h1>
    <p>Esta página roda em um container na porta 8080. Os dados abaixo vêm de outro container, na porta 25000, dentro de uma sub-rede privada que só a máquina web alcança.</p>
${conteudo}
  </main>
</body>
</html>`;
}

// Página única: o servidor consulta o back-end e monta o HTML com a resposta.
app.get('/', async (req, res) => {
  const inicio = Date.now();
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
  res.set('Cache-Control', 'no-store');

  try {
    const resposta = await fetch(`${BACKEND_URL}/dados`, { signal: controle.signal });
    if (!resposta.ok) throw new Error(`Back-end respondeu ${resposta.status}`);
    const d = await resposta.json();
    const ms = Date.now() - inicio;

    res.send(pagina(`${rota(true, ms + ' ms', d.servidor)}
      <p class="estado ok">Back-end respondeu com sucesso.</p>
    </section>

    <h2>Mensagem</h2>
    <p class="mensagem">${esc(d.mensagem)}</p>`));
  } catch (erro) {
    console.error('Falha ao consultar o back-end:', erro.message);
    const motivo = erro.name === 'AbortError'
      ? 'O back-end não respondeu em 3 segundos.'
      : 'Não foi possível falar com o back-end.';
    res.status(502).send(pagina(`${rota(false, 'sem resposta', 'indisponível')}
      <p class="estado erro">${esc(motivo)} Confira se o container do back-end está rodando e se o backend-sg libera a porta 25000 para o web-sg.</p>
    </section>`));
  } finally {
    clearTimeout(timer);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web ouvindo na porta ${PORT}, back-end em ${BACKEND_URL}`);
});

for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => server.close(() => process.exit(0)));
}

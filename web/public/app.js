'use strict';

const $ = (id) => document.getElementById(id);

const nos = { cliente: $('no-cliente'), web: $('no-web'), back: $('no-back') };
const elos = { um: $('elo-1'), dois: $('elo-2') };
const botao = $('atualizar');

function marcar(elemento, classe) {
  elemento.classList.remove('ok', 'erro', 'carregando', 'viajando');
  if (classe) elemento.classList.add(...classe.split(' '));
}

function mostrarEstado(texto, classe = '') {
  const el = $('estado');
  el.textContent = texto;
  el.className = 'estado ' + classe;
}

function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h) return `${h} h ${m} min`;
  if (m) return `${m} min ${s} s`;
  return `${s} s`;
}

function desenharInfra(lista) {
  const ul = $('infra');
  ul.replaceChildren();
  for (const item of lista) {
    const li = document.createElement('li');
    const nome = document.createElement('strong');
    const detalhe = document.createElement('span');
    nome.textContent = item.nome;
    detalhe.textContent = item.detalhe;
    li.append(nome, detalhe);
    ul.append(li);
  }
}

function mostrarDados(d) {
  $('web-host').textContent = d.web.servidor;
  $('back-host').textContent = d.backend.servidor;
  $('latencia').textContent = `${d.latencia_ms} ms`;

  $('r-mensagem').textContent = d.backend.mensagem;
  $('r-origem').textContent = d.backend.requisicao_de;
  $('r-hora').textContent = new Date(d.backend.hora).toLocaleString('pt-BR');
  $('r-uptime').textContent = formatarTempo(d.backend.uptime_segundos);
  $('r-node').textContent = d.backend.versao_node;
  desenharInfra(d.backend.infraestrutura);
}

async function carregar() {
  botao.disabled = true;
  mostrarEstado('Consultando o back-end…');
  marcar(nos.cliente, 'ok');
  marcar(elos.um, 'viajando');
  marcar(nos.web, 'carregando');
  marcar(elos.dois, '');
  marcar(nos.back, 'carregando');

  let resposta;
  try {
    resposta = await fetch('/api/dados', { cache: 'no-store' });
  } catch {
    // Nem o servidor web respondeu.
    marcar(nos.cliente, 'ok');
    marcar(elos.um, 'erro');
    marcar(nos.web, 'erro');
    marcar(elos.dois, '');
    marcar(nos.back, '');
    mostrarEstado('O servidor web não respondeu. Confira a conexão e se o container web está rodando.', 'erro');
    botao.disabled = false;
    return;
  }

  try {
    const dados = await resposta.json();
    if (!resposta.ok || !dados.ok) throw new Error(dados.erro || 'Falha ao consultar o back-end.');

    marcar(elos.um, 'ok');
    marcar(nos.web, 'ok');
    marcar(elos.dois, 'ok');
    marcar(nos.back, 'ok');
    mostrarDados(dados);
    mostrarEstado('Back-end respondeu com sucesso.', 'ok');
    $('atualizado').textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-BR')}.`;
  } catch (erro) {
    marcar(elos.um, 'ok');
    marcar(nos.web, 'ok');
    marcar(elos.dois, 'erro');
    marcar(nos.back, 'erro');
    $('latencia').textContent = 'sem resposta';
    $('back-host').textContent = 'indisponível';
    mostrarEstado(
      `${erro.message} Confira se o container do back-end está rodando e se o backend-sg libera a porta 25000 para o web-sg.`,
      'erro'
    );
  } finally {
    botao.disabled = false;
  }
}

botao.addEventListener('click', carregar);
carregar();

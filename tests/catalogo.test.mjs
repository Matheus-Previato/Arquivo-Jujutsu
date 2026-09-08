import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';
import { criarCatalogo } from '../js/catalogo.js';
import { validarPersonagens, filtrarPersonagens } from '../js/dados.js';
import { preencherImagemPersonagem } from '../js/imagens.js';
import { obterVersao } from '../js/versoes.js';

const dadosReais = JSON.parse(await readFile(new URL('../data/personagens.json', import.meta.url), 'utf8'));
const globaisOriginais = new Map(['document', 'window', 'fetch', 'console'].map(nome => [nome, Object.getOwnPropertyDescriptor(globalThis, nome)]));
afterEach(() => {
    for (const [nome, descritor] of globaisOriginais) {
        if (descritor) Object.defineProperty(globalThis, nome, descritor);
        else delete globalThis[nome];
    }
});

// DOM mínimo: preserva identidade, propagação de eventos e foco. A ativação nativa
// de Enter/Espaço e o layout são verificados separadamente no navegador real.
function prepararAmbiente({ favoritos = [], tipo = 'todos', respostas = [] } = {}) {
    const criados = [];
    const documento = { activeElement: null };
    class Elemento {
        constructor(tag = 'div') {
            this.tagName = tag.toUpperCase();
            this.children = [];
            this.parentElement = null;
            this.events = new Map();
            this.atributos = new Map();
            this.classes = new Set();
            this.dataset = {};
            this.style = { setProperty(nome, valor) { this[nome] = valor; } };
            this.value = '';
            this._text = '';
            this.classList = {
                add: (...nomes) => nomes.forEach(nome => this.classes.add(nome)),
                remove: (...nomes) => nomes.forEach(nome => this.classes.delete(nome)),
                contains: nome => this.classes.has(nome),
                toggle: (nome, ativo = !this.classes.has(nome)) => {
                    if (ativo) this.classes.add(nome); else this.classes.delete(nome);
                    return ativo;
                },
            };
        }
        get className() { return [...this.classes].join(' '); }
        set className(valor) { this.classes = new Set(valor.split(/\s+/).filter(Boolean)); }
        get textContent() { return this._text + this.children.map(filho => filho.textContent).join(''); }
        set textContent(valor) { this.replaceChildren(); this._text = String(valor); }
        setAttribute(nome, valor) { this.atributos.set(nome, String(valor)); }
        getAttribute(nome) { return this.atributos.get(nome) ?? null; }
        append(...filhos) {
            for (const filho of filhos) { filho.remove(); filho.parentElement = this; this.children.push(filho); }
        }
        replaceChildren(...filhos) {
            for (const filho of this.children) filho.parentElement = null;
            this.children = [];
            this._text = '';
            this.append(...filhos);
        }
        remove() {
            if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(filho => filho !== this);
            this.parentElement = null;
        }
        contains(elemento) { return this === elemento || this.children.some(filho => filho.contains(elemento)); }
        matches(seletor) {
            return seletor.split(',').some(parte => {
                const termo = parte.trim();
                return termo.startsWith('.') ? this.classes.has(termo.slice(1)) : this.tagName === termo.toUpperCase();
            });
        }
        closest(seletor) { return this.matches(seletor) ? this : this.parentElement?.closest(seletor) ?? null; }
        querySelectorAll(seletor) {
            return this.children.flatMap(filho => [...(filho.matches(seletor) ? [filho] : []), ...filho.querySelectorAll(seletor)]);
        }
        querySelector(seletor) { return this.querySelectorAll(seletor)[0] ?? null; }
        focus() { documento.activeElement = this; }
        getBoundingClientRect() { return { left: 0, top: 0, width: 50, height: 50 }; }
        addEventListener(tipoEvento, callback, opcoes = {}) {
            this.events.set(tipoEvento, [...(this.events.get(tipoEvento) ?? []), { callback, once: opcoes.once }]);
        }
        async dispatch(tipoEvento, propriedades = {}) {
            const pendentes = [];
            const evento = { target: this, stopPropagation() { this.parado = true; }, preventDefault() {}, ...propriedades };
            for (let elemento = this; elemento; elemento = evento.parado ? null : elemento.parentElement) {
                evento.currentTarget = elemento;
                for (const listener of [...(elemento.events.get(tipoEvento) ?? [])]) {
                    pendentes.push(listener.callback(evento));
                    if (listener.once) elemento.events.set(tipoEvento, elemento.events.get(tipoEvento).filter(item => item !== listener));
                }
            }
            await Promise.all(pendentes);
        }
    }
    documento.createElement = tag => { const elemento = new Elemento(tag); criados.push(elemento); return elemento; };
    const ids = new Map(['grid-personagens', 'busca-personagem', 'filtro-tipo', 'resultado-busca', 'status-favoritos'].map(id => [id, new Elemento()]));
    documento.getElementById = id => ids.get(id) ?? null;
    const filtro = ids.get('filtro-tipo');
    filtro.options = ['todos', 'feiticeiro', 'maldicao', 'outro', 'favoritos'].map(value => ({ value }));
    filtro.value = tipo;
    const janela = new Elemento();
    janela.location = new URL(`http://localhost/Arquivo-Jujutsu/${tipo === 'todos' ? '' : `?tipo=${tipo}`}`);
    janela.history = { replaceState(_estado, _titulo, url) { janela.location = new URL(url); } };
    const erros = [];
    let requisicoes = 0;
    const fetchMock = async caminho => {
        assert.equal(caminho, './data/personagens.json');
        requisicoes++;
        const resposta = respostas.shift();
        if (resposta instanceof Error) throw resposta;
        return resposta ?? { ok: true, json: async () => structuredClone(dadosReais) };
    };
    for (const [nome, valor] of Object.entries({ document: documento, window: janela, fetch: fetchMock, console: { ...console, error: (...args) => erros.push(args) } })) {
        Object.defineProperty(globalThis, nome, { configurable: true, value: valor });
    }
    const estado = { bancoDeDadosPersonagens: [], feiticeirosSelados: [...favoritos] };
    const aberturas = [];
    const alternancias = [];
    const explosoes = [];
    let sincronizacoes = 0;
    const catalogo = criarCatalogo({
        estado,
        abrirModal: (...args) => aberturas.push(args),
        alternarSeloGlobal(id) {
            alternancias.push(id);
            estado.feiticeirosSelados = estado.feiticeirosSelados.includes(id)
                ? estado.feiticeirosSelados.filter(favorito => favorito !== id) : [...estado.feiticeirosSelados, id];
            catalogo.atualizarFavorito(id);
        },
        sincronizarFavoritos() {
            sincronizacoes++;
            estado.feiticeirosSelados = estado.feiticeirosSelados.filter(id => estado.bancoDeDadosPersonagens.some(personagem => personagem.id === id));
        },
        invocarExplosao: (...args) => explosoes.push(args),
        vincularEfeitoCard: () => () => {},
    });
    return {
        ...catalogo, estado, criados, documento, filtro, ids, aberturas, alternancias, explosoes, erros,
        grid: ids.get('grid-personagens'),
        get requisicoes() { return requisicoes; },
        get sincronizacoes() { return sincronizacoes; },
    };
}

test('todos os personagens reais passam na validação', () => {
    assert.equal(validarPersonagens(dadosReais).length, dadosReais.length);
});

test('Maki tem duas apresentações e uma única identidade, sem alterar sua ficha base', () => {
    const personagens = validarPersonagens(dadosReais);
    const maki = personagens.find(p => p.id === 'maki-07');
    const antes = structuredClone(maki);
    const grau4 = obterVersao(maki);
    const despertada = obterVersao(maki, 1);
    assert.equal(grau4.classe, 'Grau 4');
    assert.equal(grau4.imagem, './assets/img/personagens/maki-07.png');
    assert.equal(despertada.classe, 'Restrição Celestial');
    assert.equal(despertada.imagem, './assets/img/personagens/maki-07-despertar.png');
    assert.equal(despertada.id, grau4.id);
    assert.equal(despertada.id, 'maki-07');
    assert.deepEqual(despertada.atributos, grau4.atributos);
    assert.notEqual(despertada.descricao, grau4.descricao);
    assert.deepEqual(maki, antes);
    assert.equal(obterVersao(maki, 99).versaoId, 'grau-4');
    assert.equal(obterVersao(personagens[0]), personagens[0]);
});

test('versões inválidas são rejeitadas, inclusive imagens, atributos e identidade alterada', () => {
    const maki = dadosReais.find(p => p.id === 'maki-07');
    for (const versoes of [[], {}, [maki.versoes[0]], [maki.versoes[0], maki.versoes[0]], [null, maki.versoes[1]]]) {
        assert.throws(() => validarPersonagens([{ ...maki, versoes }]));
    }
    for (const ajuste of [
        { id: 'com espaço' }, { classe: '' }, { nome: 'Outra pessoa' }, { tipo: 'maldicao' },
        { versoes: [] }, { imagem: 'https://example.com/imagem.png' }, { alturaImagem: -1 },
        { atributos: { ...maki.atributos, fis: 101 } },
    ]) {
        const versoes = [maki.versoes[0], { ...maki.versoes[1], ...ajuste }];
        assert.throws(() => validarPersonagens([{ ...maki, versoes }]));
    }
});

test('ambas as classificações encontram uma única Maki na busca e nos favoritos', () => {
    const personagens = validarPersonagens(dadosReais);
    assert.deepEqual(filtrarPersonagens(personagens, 'grau 4', 'todos', []).map(p => p.id), ['maki-07']);
    assert.deepEqual(filtrarPersonagens(personagens, 'restricao celestial', 'favoritos', ['maki-07']).map(p => p.id), ['maki-07']);
});

test('trocar a versão muda só a carta da Maki e envia a apresentação escolhida aos detalhes', async () => {
    const env = prepararAmbiente();
    await env.invocarFeiticeiros();
    const wrappers = [...env.grid.children];
    const card = env.grid.querySelectorAll('article').find(item => item.dataset.personagemId === 'maki-07');
    const [alternar] = card.querySelectorAll('.btn-versao');
    assert.equal(card.querySelectorAll('.btn-versao').length, 1);
    assert.equal(alternar.getAttribute('aria-label'), 'Alternar Maki Zenin para Restrição Celestial');
    const imagemInicial = card.querySelector('img');
    await imagemInicial.dispatch('load');
    alternar.focus();
    await alternar.dispatch('click');
    const imagemAtual = card.querySelectorAll('img').at(-1);
    assert.equal(env.documento.activeElement, alternar);
    assert.equal(alternar.getAttribute('aria-label'), 'Alternar Maki Zenin para Grau 4');
    assert.equal(card.querySelector('.badge').textContent, 'Restrição Celestial');
    assert.match(imagemAtual.src, /maki-07-despertar\.png$/);
    assert.equal(imagemAtual.loading, 'eager');
    assert.deepEqual(env.grid.children, wrappers);
    assert.equal(env.aberturas.length, 0);
    assert.deepEqual(env.estado.feiticeirosSelados, []);
    await imagemInicial.dispatch('error');
    assert.equal(card.querySelector('img'), imagemInicial, 'Mantém o retrato até a nova imagem carregar.');
    await imagemAtual.dispatch('load');
    assert.equal(imagemAtual.classList.contains('retrato-revelado'), true);
    await imagemAtual.dispatch('animationend');
    assert.equal(card.querySelector('img'), imagemAtual);
    assert.equal(card.querySelectorAll('img').length, 1);

    await card.querySelector('.btn-abrir-personagem').dispatch('click');
    assert.equal(env.aberturas.at(-1)[0].id, 'maki-07');
    assert.equal(env.aberturas.at(-1)[0].classe, 'Restrição Celestial');
    assert.match(env.aberturas.at(-1)[0].descricao, /cicatrizes/);
    await alternar.dispatch('click');
    assert.equal(card.querySelector('.badge').textContent, 'Grau 4');
    assert.match(card.querySelectorAll('img').at(-1).src, /maki-07\.png$/);
    await card.dispatch('click');
    assert.equal(env.aberturas.at(-1)[0].classe, 'Grau 4');
});

test('versão selecionada permanece após filtros e as duas versões compartilham um favorito', async () => {
    const env = prepararAmbiente();
    await env.invocarFeiticeiros();
    const card = env.grid.querySelectorAll('article').find(item => item.dataset.personagemId === 'maki-07');
    await card.querySelector('.btn-versao').dispatch('click');
    await card.querySelector('.btn-selo').dispatch('click');
    assert.deepEqual(env.estado.feiticeirosSelados, ['maki-07']);
    env.filtro.value = 'favoritos';
    env.aplicarFiltros();
    assert.deepEqual(env.grid.querySelectorAll('article'), [card]);
    assert.equal(card.dataset.versaoId, 'restricao-celestial');
    env.ids.get('busca-personagem').value = 'gojo';
    env.aplicarFiltros();
    env.ids.get('busca-personagem').value = '';
    env.aplicarFiltros();
    assert.equal(env.grid.querySelector('article'), card);
    assert.equal(card.dataset.versaoId, 'restricao-celestial');
    await card.querySelector('.btn-versao').dispatch('click');
    assert.equal(card.querySelector('.btn-selo').getAttribute('aria-pressed'), 'true');
    await card.querySelector('.btn-selo').dispatch('click');
    assert.deepEqual(env.estado.feiticeirosSelados, []);
    assert.equal(env.grid.querySelectorAll('article').length, 0);
});

test('trocas rápidas ignoram eventos antigos e limpam retratos mesmo sem animação', async () => {
    const env = prepararAmbiente();
    const container = env.documento.createElement('div');
    const maki = dadosReais.find(p => p.id === 'maki-07');
    const trocar = indice => preencherImagemPersonagem(container, obterVersao(maki, indice), { transicao: true });
    trocar(0);
    const inicial = container.querySelector('img');
    await inicial.dispatch('load');
    trocar(1);
    const abandonada = container.querySelectorAll('img').at(-1);
    trocar(0);
    const seguinte = container.querySelectorAll('img').at(-1);
    await abandonada.dispatch('load');
    await abandonada.dispatch('error');
    assert.deepEqual(container.querySelectorAll('img'), [inicial, seguinte]);
    await seguinte.dispatch('load');
    trocar(1);
    const ultima = container.querySelectorAll('img').at(-1);
    await seguinte.dispatch('animationend');
    assert.deepEqual(container.querySelectorAll('img'), [seguinte, ultima]);
    await ultima.dispatch('load');
    await new Promise(resolve => setTimeout(resolve, 450));
    assert.deepEqual(container.querySelectorAll('img'), [ultima]);
    assert.equal(ultima.classList.contains('retrato-sobreposto'), false);
    trocar(0);
    await container.querySelectorAll('img').at(-1).dispatch('error');
    assert.equal(container.querySelectorAll('img').length, 0);
    assert.match(container.textContent, /Retrato indisponível/);
});

test('catálogo rejeita estrutura, IDs duplicados, tipos e atributos inválidos', () => {
    const personagem = dadosReais[0];
    for (const entrada of [null, {}, '[]', [null], [personagem, personagem]]) assert.throws(() => validarPersonagens(entrada));
    for (const alteracao of [
        { id: 'com espaço' }, { nome: ' ' }, { classe: '' }, { descricao: null }, { tipo: 'desconhecido' },
        { atributos: { ...personagem.atributos, fis: 101 } }, { atributos: { ...personagem.atributos, vel: '50' } },
        { corAura: '256, 0, 0' }, { imagem: 'https://exemplo.com/retrato.png' },
    ]) assert.throws(() => validarPersonagens([{ ...personagem, ...alteracao }]));
});

test('busca ignora acentos e maiúsculas, combinando classe, tipo e favoritos', () => {
    const personagens = validarPersonagens(dadosReais);
    const toji = personagens.find(personagem => personagem.id === 'toji-01');
    assert.deepEqual(filtrarPersonagens(personagens, ' RESTRICAO CELESTIAL ', 'todos', []).map(item => item.id), ['toji-01', 'maki-07']);
    assert.deepEqual(filtrarPersonagens(personagens, '  fUshíGuro  ', 'favoritos', [toji.id]).map(item => item.id), [toji.id]);
    assert.deepEqual(filtrarPersonagens(personagens, 'Gojo', 'maldicao', []), []);
});

test('favoritar mantém todos os cards e o foco, sem criar elementos', async () => {
    const env = prepararAmbiente();
    await env.invocarFeiticeiros();
    const wrappers = [...env.grid.children];
    const articles = env.grid.querySelectorAll('article');
    const selo = articles[0].querySelector('.btn-selo');
    const totalCriados = env.criados.length;
    selo.focus();
    await selo.dispatch('click');
    assert.deepEqual(env.grid.children, wrappers);
    assert.deepEqual(env.grid.querySelectorAll('article'), articles);
    assert.equal(env.criados.length, totalCriados);
    assert.equal(env.documento.activeElement, selo);
    assert.equal(selo.getAttribute('aria-pressed'), 'true');
    assert.deepEqual(env.aberturas, []);
});

test('selo e detalhes usam botões separados e Enter não aciona um handler ancestral', async () => {
    const env = prepararAmbiente();
    await env.invocarFeiticeiros();
    const card = env.grid.querySelector('article');
    const selo = card.querySelector('.btn-selo');
    const abrir = card.querySelector('.btn-abrir-personagem');
    assert.equal(selo.tagName, 'BUTTON');
    assert.equal(abrir.tagName, 'BUTTON');
    assert.equal(selo.type, 'button');
    assert.equal(abrir.contains(selo), false);
    assert.equal(card.getAttribute('tabindex'), null);
    await selo.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(env.aberturas, []);
    assert.deepEqual(env.alternancias, []);
    // O browser produz o click nativo do botão após a tecla; simulamos esse evento.
    await selo.dispatch('click');
    assert.equal(env.alternancias.length, 1);
    assert.equal(env.explosoes.length, 1);
    assert.equal(env.aberturas.length, 0);
    await abrir.dispatch('click');
    assert.equal(env.aberturas.length, 1);
    assert.equal(env.aberturas[0][1], abrir);
});

test('remover favoritos preserva os outros cards e transfere foco até a lista vazia', async () => {
    const favoritos = dadosReais.slice(0, 3).map(personagem => personagem.id);
    const env = prepararAmbiente({ favoritos, tipo: 'favoritos' });
    await env.invocarFeiticeiros();
    const [primeiro, segundo, terceiro] = env.grid.children;
    const artigosCriados = env.criados.filter(elemento => elemento.tagName === 'ARTICLE').length;
    segundo.querySelector('.btn-selo').focus();
    await segundo.querySelector('.btn-selo').dispatch('click');
    assert.deepEqual(env.grid.children, [primeiro, terceiro]);
    assert.equal(env.documento.activeElement, terceiro.querySelector('.btn-abrir-personagem'));
    assert.equal(env.ids.get('resultado-busca').textContent, '2 personagens encontrados');

    await terceiro.querySelector('.btn-selo').dispatch('click');
    assert.deepEqual(env.grid.children, [primeiro]);
    assert.equal(env.documento.activeElement, primeiro.querySelector('.btn-abrir-personagem'));
    assert.equal(env.ids.get('resultado-busca').textContent, '1 personagem encontrado');

    await primeiro.querySelector('.btn-selo').dispatch('click');
    assert.equal(env.grid.querySelectorAll('article').length, 0);
    assert.match(env.grid.textContent, /Nenhum personagem/);
    assert.equal(env.ids.get('resultado-busca').textContent, '0 personagens encontrados');
    assert.equal(env.documento.activeElement, env.filtro);
    assert.equal(env.criados.filter(elemento => elemento.tagName === 'ARTICLE').length, artigosCriados);
});

for (const [falha, resposta] of [
    ['HTTP', { ok: false, status: 404 }],
    ['de JSON', { ok: true, json: async () => { throw new SyntaxError('JSON inválido'); } }],
    ['de validação', { ok: true, json: async () => [dadosReais[0], dadosReais[0]] }],
]) {
    test(`falha ${falha} permite tentar novamente e recuperar o foco`, async () => {
        const env = prepararAmbiente({ respostas: [resposta] });
        await env.invocarFeiticeiros();
        const tentar = env.grid.querySelector('.btn-tentar-novamente');
        assert.ok(tentar);
        assert.equal(env.grid.getAttribute('aria-busy'), 'false');
        assert.match(env.ids.get('resultado-busca').textContent, /indisponível/);
        tentar.focus();
        await tentar.dispatch('click');
        assert.equal(env.requisicoes, 2);
        assert.equal(env.sincronizacoes, 1);
        assert.equal(env.grid.querySelectorAll('article').length, dadosReais.length);
        assert.equal(env.documento.activeElement, env.grid.querySelector('.btn-abrir-personagem'));
        assert.equal(env.grid.getAttribute('aria-busy'), 'false');
    });
}

test('alterar filtro após falha preserva o botão de recuperação', async () => {
    const env = prepararAmbiente({ respostas: [new Error('Offline')] });
    await env.invocarFeiticeiros();
    const tentar = env.grid.querySelector('.btn-tentar-novamente');
    env.filtro.value = 'favoritos';
    await env.filtro.dispatch('change');
    assert.equal(env.grid.querySelector('.btn-tentar-novamente'), tentar);
    assert.match(env.ids.get('resultado-busca').textContent, /indisponível/);
});

test('imagem ausente ou quebrada mostra iniciais; erro antigo não sobrescreve novo retrato', async () => {
    const env = prepararAmbiente();
    const container = env.documento.createElement('div');
    const personagem = { nome: 'Satoru Gojo', imagem: './assets/img/gojo.png' };
    preencherImagemPersonagem(container, { ...personagem, imagem: '' });
    assert.equal(container.querySelector('.retrato-iniciais').textContent, 'SG');
    assert.match(container.textContent, /Retrato indisponível/);

    preencherImagemPersonagem(container, personagem, { modal: true });
    const antiga = container.querySelector('img');
    assert.equal(antiga.loading, 'eager');
    preencherImagemPersonagem(container, { nome: 'Yuji Itadori', imagem: './assets/img/yuji.png' });
    const atual = container.querySelector('img');
    assert.equal(atual.loading, 'lazy');
    assert.equal(atual.alt, 'Yuji Itadori');
    assert.equal(atual.decoding, 'async');
    await antiga.dispatch('error');
    assert.equal(container.querySelector('img'), atual);
    assert.equal(container.classList.contains('skeleton'), true);
    await atual.dispatch('load');
    assert.equal(container.classList.contains('skeleton'), false);

    preencherImagemPersonagem(container, personagem, { prioritaria: true });
    const quebrada = container.querySelector('img');
    assert.equal(quebrada.fetchPriority, 'high');
    await quebrada.dispatch('error');
    assert.equal(container.querySelector('img'), null);
    assert.equal(container.querySelector('.retrato-iniciais').textContent, 'SG');
    assert.equal(container.classList.contains('skeleton'), false);
    assert.equal(container.classList.contains('sem-imagem'), true);
});

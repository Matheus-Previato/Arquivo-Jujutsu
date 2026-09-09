import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarLinkPersonagem, resolverLinkPersonagem, criarNavegacao, criarCompartilhamento } from '../js/links.js';

const maki = { id: 'maki-07', nome: 'Maki Zenin', classe: 'Grau 4', versoes: [{ id: 'grau-4', classe: 'Grau 4' }, { id: 'restricao-celestial', classe: 'Restrição Celestial' }] };
const gojo = { id: 'gojo-02', nome: 'Satoru Gojo', classe: 'Grau Especial' };
const personagens = [maki, gojo];
const endereco = 'https://matheus-previato.github.io/Arquivo-Jujutsu/?busca=gojo&tipo=favoritos#conteudo';

test('link compartilhado preserva a pasta do Pages e a versão, removendo filtros locais', () => {
    const url = criarLinkPersonagem(endereco, { ...maki, versaoId: 'restricao-celestial' }, { compartilhar: true });
    assert.equal(url.pathname, '/Arquivo-Jujutsu/');
    assert.equal(url.searchParams.get('personagem'), 'maki-07');
    assert.equal(url.searchParams.get('versao'), 'restricao-celestial');
    assert.equal(url.searchParams.has('tipo'), false);
    assert.equal(url.searchParams.has('busca'), false);
    assert.equal(url.hash, '');
    assert.equal(resolverLinkPersonagem(url, personagens).classe, 'Restrição Celestial');
});

test('links inválidos têm recuperação previsível e não inventam personagens ou versões', () => {
    assert.equal(resolverLinkPersonagem(endereco + '&personagem=inexistente', personagens), null);
    for (const versao of ['', 'inexistente', '%3Cscript%3E']) {
        assert.equal(resolverLinkPersonagem(`https://site.test/?personagem=maki-07&versao=${versao}`, personagens).versaoId, 'grau-4');
    }
    const url = criarLinkPersonagem('https://site.test/?versao=grau-4', gojo);
    assert.equal(url.searchParams.has('versao'), false);
});

test('navegação abre links diretos, acompanha voltar/avançar e preserva filtros ao fechar', () => {
    const abertos = [];
    let fechados = 0;
    let pushes = 0;
    const janela = { location: new URL(endereco), addEventListener(nome, callback) { this[nome] = callback; } };
    janela.history = {
        pushState(_s, _t, url) { pushes++; janela.location = new URL(url); },
        replaceState(_s, _t, url) { janela.location = new URL(url); },
    };
    const api = criarNavegacao({ obterPersonagens: () => personagens, aoAbrir: p => abertos.push(p), aoFechar: () => fechados++, janela });
    api.registrarAbertura({ ...maki, versaoId: 'restricao-celestial' });
    api.registrarAbertura({ ...maki, versaoId: 'restricao-celestial' });
    assert.equal(pushes, 1, 'Não duplica a mesma abertura no histórico.');
    const ficha = janela.location.href;
    janela.location = new URL(endereco);
    janela.popstate();
    assert.equal(fechados, 1);
    janela.location = new URL(ficha);
    janela.popstate();
    assert.equal(abertos.at(-1).classe, 'Restrição Celestial');
    assert.equal(pushes, 1, 'Navegar no histórico não cria entradas novas.');
    api.registrarFechamento();
    assert.equal(janela.location.href, endereco);
    janela.location = new URL('https://site.test/?personagem=maki-07&versao=ruim');
    api.sincronizar();
    assert.equal(janela.location.searchParams.get('versao'), 'grau-4');
    janela.location = new URL('https://site.test/?personagem=ruim&versao=ruim');
    api.sincronizar();
    assert.equal(janela.location.search, '');
});

function prepararCopia(escrever) {
    const botao = { addEventListener(_nome, callback) { this.clicar = callback; } };
    const status = {};
    const campo = { focus() { this.focado = true; }, select() { this.selecionado = true; } };
    const api = criarCompartilhamento({ botao, status, campo, escrever, obterEndereco: () => endereco });
    return { ...api, botao, status, campo };
}
test('copiar usa a personagem atual e só informa sucesso quando a escrita termina', async () => {
    const copiados = [];
    const env = prepararCopia(async texto => copiados.push(texto));
    env.atualizar({ ...maki, versaoId: 'restricao-celestial' });
    await env.botao.clicar();
    assert.equal(new URL(copiados[0]).searchParams.get('versao'), 'restricao-celestial');
    assert.equal(env.status.textContent, 'Link copiado!');
    env.atualizar(gojo);
    assert.equal(env.status.textContent, '');
    await env.botao.clicar();
    assert.equal(new URL(copiados[1]).searchParams.has('versao'), false);
});
test('clipboard bloqueado oferece campo selecionável sem perder o link', async () => {
    const env = prepararCopia(async () => { throw new Error('Bloqueado'); });
    env.atualizar(gojo);
    await env.botao.clicar();
    assert.equal(env.campo.hidden, false);
    assert.equal(env.campo.focado && env.campo.selecionado, true);
    assert.equal(new URL(env.campo.value).searchParams.get('personagem'), 'gojo-02');
    assert.match(env.status.textContent, /Copie/);
});
test('resposta de cópia atrasada não sobrescreve outra ficha nem rouba foco após fechar', async () => {
    let rejeitar;
    const env = prepararCopia(() => new Promise((_r, reject) => { rejeitar = reject; }));
    env.atualizar(maki);
    const pendente = env.botao.clicar();
    env.atualizar(null);
    rejeitar(new Error('Bloqueado'));
    await pendente;
    assert.equal(env.campo.hidden, true);
    assert.equal(env.campo.focado, undefined);
    assert.equal(env.status.textContent, '');
    assert.equal(env.botao.disabled, true);
});

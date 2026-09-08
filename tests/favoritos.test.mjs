import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { criarEstado } from '../js/estado.js';
import { atualizarBotaoFavorito, criarFavoritos } from '../js/favoritos.js';

const descritorStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const descritorDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

afterEach(() => {
    for (const [nome, descritor] of [['localStorage', descritorStorage], ['document', descritorDocument]]) {
        if (descritor) Object.defineProperty(globalThis, nome, descritor);
        else delete globalThis[nome];
    }
});

function prepararStorage(valor = null, { bloquearLeitura = false, bloquearEscrita = false } = {}) {
    const valores = new Map([['outra-chave', 'preservar']]);
    if (valor !== null) valores.set('jjk_selados', valor);
    const escritas = [];
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem(chave) {
                if (bloquearLeitura) throw new Error('SecurityError');
                return valores.get(chave) ?? null;
            },
            setItem(chave, valorSalvo) {
                if (bloquearEscrita) throw new Error('QuotaExceededError');
                escritas.push([chave, valorSalvo]);
                valores.set(chave, valorSalvo);
            },
        },
    });
    return { valores, escritas };
}

function criarElemento() {
    return {
        atributos: {},
        classes: new Set(),
        hidden: true,
        textContent: '',
        setAttribute(nome, valor) { this.atributos[nome] = valor; },
        get classList() {
            return { toggle: (nome, ativo) => ativo ? this.classes.add(nome) : this.classes.delete(nome) };
        },
    };
}

function prepararFavoritos(estado) {
    const botao = criarElemento();
    const aviso = criarElemento();
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { getElementById: id => id === 'btn-selar-modal' ? botao : id === 'aviso-armazenamento' ? aviso : null },
    });
    const alteracoes = [];
    const favoritos = criarFavoritos({ estado, aoAlterar: id => alteracoes.push(id) });
    return { ...favoritos, botao, aviso, alteracoes };
}

test('primeira visita começa sem favoritos e sem aviso', () => {
    const { escritas } = prepararStorage();
    const estado = criarEstado();
    const { aviso } = prepararFavoritos(estado);
    assert.deepEqual(estado.feiticeirosSelados, []);
    assert.equal(aviso.hidden, true);
    assert.deepEqual(escritas, []);
});

for (const valor of ['{json quebrado', 'null', '42', '"gojo-02"', '{}', '["gojo-02",42]', '[""]']) {
    test(`recupera favoritos inválidos: ${valor}`, () => {
        const { valores } = prepararStorage(valor);
        const estado = criarEstado();
        const { aviso } = prepararFavoritos(estado);
        assert.deepEqual(estado.feiticeirosSelados, []);
        assert.equal(valores.get('jjk_selados'), '[]');
        assert.equal(valores.get('outra-chave'), 'preservar');
        assert.equal(aviso.hidden, false);
        assert.match(aviso.textContent, /inválidos/);
    });
}

test('remove duplicados e mantém favoritos válidos', () => {
    const { valores } = prepararStorage('["gojo-02","gojo-02","toji-01"]');
    const estado = criarEstado();
    assert.deepEqual(estado.feiticeirosSelados, ['gojo-02', 'toji-01']);
    assert.equal(valores.get('jjk_selados'), '["gojo-02","toji-01"]');
    assert.equal(estado.avisoArmazenamento, null);
});

test('leitura bloqueada permite abrir o catálogo e usar favoritos nesta visita', () => {
    prepararStorage(null, { bloquearLeitura: true, bloquearEscrita: true });
    const estado = criarEstado();
    estado.bancoDeDadosPersonagens = [{ id: 'gojo-02', nome: 'Satoru Gojo' }];
    const { alternarSeloGlobal, aviso, alteracoes } = prepararFavoritos(estado);
    assert.equal(alternarSeloGlobal('gojo-02'), true);
    assert.deepEqual(estado.feiticeirosSelados, ['gojo-02']);
    assert.deepEqual(alteracoes, ['gojo-02']);
    assert.equal(aviso.hidden, false);
    assert.match(aviso.textContent, /nesta visita/);
});

test('também captura bloqueio de acesso à propriedade localStorage', () => {
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get() { throw new Error('SecurityError'); },
    });
    const estado = criarEstado();
    assert.deepEqual(estado.feiticeirosSelados, []);
    assert.match(estado.avisoArmazenamento, /nesta visita/);
});

test('escrita bloqueada preserva leitura e atualiza estado, aviso, botão e callback', () => {
    prepararStorage('["gojo-02"]', { bloquearEscrita: true });
    const estado = criarEstado();
    const personagem = { id: 'gojo-02', nome: 'Satoru Gojo' };
    estado.bancoDeDadosPersonagens = [personagem];
    estado.personagemAtualModal = personagem;
    const { alternarSeloGlobal, aviso, botao, alteracoes } = prepararFavoritos(estado);
    assert.equal(estado.avisoArmazenamento, null);

    alternarSeloGlobal('gojo-02');
    assert.deepEqual(estado.feiticeirosSelados, []);
    assert.equal(botao.atributos['aria-pressed'], 'false');
    assert.equal(botao.atributos['aria-label'], 'Favoritar Satoru Gojo');
    assert.equal(botao.title, 'Favoritar Satoru Gojo');
    assert.equal(botao.classes.has('ativo'), false);

    alternarSeloGlobal('gojo-02');
    assert.deepEqual(estado.feiticeirosSelados, ['gojo-02']);
    assert.equal(botao.atributos['aria-pressed'], 'true');
    assert.equal(botao.atributos['aria-label'], 'Remover Satoru Gojo dos favoritos');
    assert.equal(botao.title, 'Remover Satoru Gojo dos favoritos');
    assert.equal(botao.classes.has('ativo'), true);
    assert.deepEqual(alteracoes, ['gojo-02', 'gojo-02']);
    assert.equal(aviso.hidden, false);
});

test('rejeita IDs inexistentes ou catálogo ainda vazio sem escrita nem callback', () => {
    const { escritas } = prepararStorage();
    const estado = criarEstado();
    const { alternarSeloGlobal, alteracoes } = prepararFavoritos(estado);
    assert.equal(alternarSeloGlobal('gojo-02'), false);
    estado.bancoDeDadosPersonagens = [{ id: 'gojo-02', nome: 'Satoru Gojo' }];
    assert.equal(alternarSeloGlobal('desconhecido'), false);
    assert.equal(alternarSeloGlobal(null), false);
    assert.deepEqual(estado.feiticeirosSelados, []);
    assert.deepEqual(alteracoes, []);
    assert.deepEqual(escritas, []);
});

test('sincroniza IDs após carregar o catálogo sem disparar atualização de cards', () => {
    const { valores, escritas } = prepararStorage('["gojo-02","removido-99"]');
    const estado = criarEstado();
    estado.bancoDeDadosPersonagens = [{ id: 'gojo-02', nome: 'Satoru Gojo' }];
    const { sincronizarFavoritos, alteracoes } = prepararFavoritos(estado);
    sincronizarFavoritos();
    sincronizarFavoritos();
    assert.deepEqual(estado.feiticeirosSelados, ['gojo-02']);
    assert.equal(valores.get('jjk_selados'), '["gojo-02"]');
    assert.equal(escritas.length, 1);
    assert.deepEqual(alteracoes, []);
});

test('botão pode receber seu estado acessível ao ser criado', () => {
    const botao = criarElemento();
    atualizarBotaoFavorito(botao, { nome: 'Satoru Gojo' }, true);
    assert.equal(botao.atributos['aria-pressed'], 'true');
    assert.equal(botao.title, 'Remover Satoru Gojo dos favoritos');
    assert.doesNotThrow(() => atualizarBotaoFavorito(null, { nome: 'Satoru Gojo' }, false));
});

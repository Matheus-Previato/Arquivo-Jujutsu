import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarModal } from '../js/modal.js';

class Elemento {
    children = []; isConnected = true; tabIndex = 0; disabled = false; hidden = false;
    textContent = ''; attrs = {}; events = {}; open = false;
    style = { overflow: '', setProperty(nome, valor) { this[nome] = valor; }, removeProperty(nome) { delete this[nome]; } };
    classList = {
        classes: new Set(),
        add(...nomes) { nomes.forEach(nome => this.classes.add(nome)); },
        remove(...nomes) { nomes.forEach(nome => this.classes.delete(nome)); },
        toggle(nome, valor) { if (valor) this.add(nome); else this.remove(nome); },
        contains(nome) { return this.classes.has(nome); }
    };
    append(...filhos) { this.children.push(...filhos); }
    replaceChildren(...filhos) { this.children = filhos; }
    setAttribute(nome, valor) { this.attrs[nome] = valor; }
    contains(outro) { return this === outro || this.children.some(filho => filho.contains(outro)); }
    addEventListener(nome, callback) { (this.events[nome] ??= []).push(callback); }
    emitir(nome, valores = {}) {
        const evento = { target: this, button: 0, ...valores };
        for (const callback of this.events[nome] ?? []) callback(evento);
    }
    getBoundingClientRect() { return { left: 0, top: 0, width: 320, height: 320 }; }
    getClientRects() { return this.hidden ? [] : [this.getBoundingClientRect()]; }
    closest() { return this.hidden ? this : null; }
    focus() { document.activeElement = this; }
    showModal() { this.open = true; }
    close() { this.open = false; this.emitir('close'); }
}
test('modal restaura foco e rolagem, protege o gesto no fundo e ignora erro de retrato antigo', t => {
    const descritores = ['document', 'getComputedStyle'].map(nome => [nome, Object.getOwnPropertyDescriptor(globalThis, nome)]);
    t.after(() => {
        for (const [nome, descritor] of descritores) {
            if (descritor) Object.defineProperty(globalThis, nome, descritor);
            else delete globalThis[nome];
        }
    });
    const ids = ['modal-personagem', 'btn-fechar-modal', 'btn-selar-modal', 'modal-nome', 'modal-classe', 'modal-descricao', 'filtro-tipo', 'busca-personagem'];
    const elementos = Object.fromEntries(ids.map(id => [id, new Elemento()]));
    const imagem = new Elemento();
    const botoes = [new Elemento(), new Elemento()];
    const doc = new Elemento();
    doc.body = new Elemento();
    doc.body.style.overflow = 'clip';
    doc.getElementById = id => elementos[id];
    doc.querySelectorAll = () => botoes.filter(botao => botao.isConnected);
    doc.createElement = () => new Elemento();
    globalThis.document = doc;
    globalThis.getComputedStyle = () => ({ visibility: 'visible', display: 'block' });
    const modal = elementos['modal-personagem'];
    modal.querySelector = () => imagem;
    const personagem = { id: 'gojo', nome: 'Satoru Gojo', tipo: 'feiticeiro', classe: 'Grau Especial', descricao: 'Descrição', atributos: {}, corAura: '0, 191, 255', imagem: './gojo.png' };
    const estado = { feiticeirosSelados: ['gojo'], personagemAtualModal: null };
    let limpezas = 0;
    let desenhados = 0;
    const api = criarModal({ estado, alternarSeloGlobal() {}, invocarExplosao() {}, desenharGraficoRadar() { desenhados++; }, limparRadar() { limpezas++; } });
    api.abrirModal(personagem, botoes[0]);
    assert.equal(modal.open, true);
    assert.equal(document.activeElement, elementos['btn-fechar-modal']);
    assert.equal(doc.body.style.overflow, 'hidden');
    assert.equal(modal.style['--cor-aura'], '0, 191, 255');
    assert.equal(elementos['btn-selar-modal'].attrs['aria-pressed'], 'true');
    const imagemAnterior = imagem.children[0];
    api.abrirModal({ ...personagem, id: 'toji', nome: 'Toji Fushiguro', imagem: '' });
    assert.equal(imagem.classList.contains('sem-imagem'), true);
    imagemAnterior.emitir('error');
    assert.equal(imagem.children[0].children[0].textContent, 'TF', 'Erro de imagem antiga não sobrescreve o personagem atual.');
    assert.equal(elementos['btn-selar-modal'].attrs['aria-pressed'], 'false');
    modal.emitir('pointerdown', { target: elementos['modal-descricao'] });
    modal.emitir('pointerup');
    modal.emitir('click');
    assert.equal(modal.open, true, 'Arrastar texto de dentro para o fundo não fecha a janela.');
    modal.emitir('pointerdown');
    modal.emitir('pointerup');
    modal.emitir('click');
    assert.equal(modal.open, false);
    assert.equal(estado.personagemAtualModal, null);
    assert.equal(doc.body.style.overflow, 'clip');
    assert.equal(document.activeElement, botoes[0]);
    assert.equal(limpezas, 1);
    
    api.abrirModal(personagem, botoes[0]);
    botoes[0].isConnected = false;
    modal.close();
    assert.equal(document.activeElement, botoes[1], 'Uma origem removida devolve o foco ao próximo card visível.');
    api.abrirModal(personagem, botoes[1]);
    botoes[1].hidden = true;
    modal.close();
    assert.equal(document.activeElement, elementos['filtro-tipo'], 'Sem card visível, o filtro recebe o foco.');
    assert.equal(doc.body.style.overflow, 'clip');
    assert.equal(limpezas, 3);
    assert.equal(desenhados, 4);
});


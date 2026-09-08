import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarRadar } from '../js/radar.js';

class Elemento {
    children = [];
    hidden = false;
    textContent = '';
    attrs = {};
    events = {};
    style = { removeProperty(nome) { delete this[nome]; } };
    classList = {
        classes: new Set(),
        add(nome) { this.classes.add(nome); },
        remove(nome) { this.classes.delete(nome); },
        toggle(nome, valor) { if (valor) this.add(nome); else this.remove(nome); },
        contains(nome) { return this.classes.has(nome); }
    };
    append(...filhos) { this.children.push(...filhos); }
    replaceChildren(...filhos) { this.children = filhos; }
    setAttribute(nome, valor) { this.attrs[nome] = valor; }
    contains(outro) { return this === outro || this.children.some(filho => filho.contains(outro)); }
    addEventListener(nome, callback) { (this.events[nome] ??= []).push(callback); }
    emitir(nome, valores = {}) {
        const evento = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...valores };
        for (const callback of this.events[nome] ?? []) callback(evento);
        return evento;
    }
    getBoundingClientRect() { return { left: 0, top: 0, width: 320, height: 320 }; }
}
test('radar oferece atributos em texto, dicas por toque e Escape, e limpa estado ao trocar ou fechar', t => {
    const descritores = ['document', 'setTimeout', 'clearTimeout'].map(nome => [nome, Object.getOwnPropertyDescriptor(globalThis, nome)]);
    t.after(() => {
        for (const [nome, descritor] of descritores) {
            if (descritor) Object.defineProperty(globalThis, nome, descritor);
            else delete globalThis[nome];
        }
    });
    const ids = ['btn-info-grafico', 'tooltip-grafico', 'grafico-radar', 'tooltip-ponto', 'atributos-texto', 'modal-personagem'];
    const elementos = Object.fromEntries(ids.map(id => [id, new Elemento()]));
    const doc = new Elemento();
    doc.getElementById = id => elementos[id];
    doc.createElement = () => new Elemento();
    globalThis.document = doc;
    const canvas = elementos['grafico-radar'];
    canvas.width = canvas.height = 320;
    canvas.getContext = () => new Proxy({}, { get: () => () => {} });
    canvas.closest = () => new Elemento();
    let sequenciaTimer = 0;
    const timers = new Map();
    globalThis.setTimeout = callback => { timers.set(++sequenciaTimer, callback); return sequenciaTimer; };
    globalThis.clearTimeout = id => timers.delete(id);
    
    const radar = iniciarRadar();
    const info = elementos['btn-info-grafico'];
    const explicacao = elementos['tooltip-grafico'];
    const ponto = elementos['tooltip-ponto'];
    const texto = elementos['atributos-texto'];
    const modal = elementos['modal-personagem'];
    assert.equal(explicacao.hidden, true);
    assert.equal(info.attrs['aria-expanded'], 'false');
    radar.desenharGraficoRadar({ fis: 100, vel: 75, eng: 0, int: 85, let: 95 }, '89, 0, 179');
    assert.deepEqual(texto.children.map(linha => linha.children.map(no => no.textContent)), [
        ['Físico', '100 / 100'], ['Velocidade', '75 / 100'], ['Energia', '0 / 100'],
        ['Inteligência', '85 / 100'], ['Letalidade', '95 / 100']
    ]);
    info.emitir('click');
    assert.equal(explicacao.hidden, false);
    assert.equal(info.attrs['aria-expanded'], 'true');
    assert.equal(timers.size, 0, 'A explicação continua visível enquanto é lida.');
    assert.equal(modal.emitir('cancel').defaultPrevented, true, 'Escape fecha a explicação antes da janela.');
    assert.equal(explicacao.hidden, true);
    assert.equal(info.attrs['aria-expanded'], 'false');
    assert.equal(modal.emitir('cancel').defaultPrevented, false, 'Outro Escape permite fechar a janela nativa.');
    
    canvas.emitir('pointermove', { pointerType: 'mouse', clientX: 160, clientY: 60 });
    assert.equal(ponto.textContent, '100');
    assert.equal(ponto.hidden, false);
    canvas.emitir('pointerleave');
    assert.equal(timers.size, 1);
    info.emitir('click');
    radar.desenharGraficoRadar({ fis: 25, vel: 50, eng: 70, int: 75, let: 85 }, '0, 191, 255');
    assert.equal(timers.size, 0, 'Trocar o personagem cancela os temporizadores antigos.');
    assert.equal(ponto.hidden, true);
    assert.equal(ponto.textContent, '');
    assert.equal(explicacao.hidden, true);
    assert.equal(info.attrs['aria-expanded'], 'false');
    canvas.emitir('pointerdown', { pointerType: 'touch', clientX: 160, clientY: 135 });
    assert.equal(ponto.textContent, '25');
    assert.equal(ponto.hidden, false);
    assert.equal(timers.size, 1);
    radar.limparRadar();
    assert.equal(timers.size, 0);
    assert.equal(ponto.hidden, true);
    assert.equal(texto.children.length, 0);
    canvas.emitir('pointerleave');
    assert.equal(timers.size, 0, 'Sair do gráfico fechado não cria um novo temporizador.');
    canvas.getContext = () => null;
    radar.desenharGraficoRadar({ fis: 90, vel: 80, eng: 0, int: 70, let: 75 }, '89, 0, 179');
    assert.equal(texto.children[0].children[1].textContent, '90 / 100', 'Valores continuam disponíveis sem canvas.');
});


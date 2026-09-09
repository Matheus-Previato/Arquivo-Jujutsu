import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preencherFicha } from '../js/ficha.js';
import { validarPersonagens } from '../js/dados.js';
import { obterVersao } from '../js/versoes.js';
import { readFile } from 'node:fs/promises';

test('ficha troca campos e remove ferramentas antigas ao mudar de versão', t => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
    t.after(() => { if (original) Object.defineProperty(globalThis, 'document', original); else delete globalThis.document; });
    const elemento = tag => ({ tag, children: [], textContent: '', append(...items) { this.children.push(...items); }, replaceChildren() { this.children = []; } });
    globalThis.document = { createElement: elemento };
    const ficha = elemento('dl');
    const textos = e => [e.textContent, ...e.children.flatMap(textos)].join(' ');
    preencherFicha(ficha, { tecnica: 'Armas', ferramentas: ['Óculos'], habilidades: ['Treinamento'] });
    assert.match(textos(ficha), /Óculos/);
    preencherFicha(ficha, { tecnica: 'Despertar', ferramentas: [], habilidades: ['Percepção'] });
    assert.doesNotMatch(textos(ficha), /Óculos|Treinamento/);
    assert.match(textos(ficha), /Despertar/);
    preencherFicha(ficha, {});
    assert.equal(ficha.hidden, true);
});

test('fichas reais são válidas e o despertar da Maki substitui as ferramentas', async () => {
    const data = JSON.parse(await readFile(new URL('../data/personagens.json', import.meta.url)));
    const personagens = validarPersonagens(data);
    assert.equal(personagens.length, 23);
    assert.ok(personagens.every(p => p.tecnica && p.habilidades.length));
    const maki = personagens.find(p => p.id === 'maki-07');
    assert.match(obterVersao(maki).ferramentas.join(), /Óculos/);
    assert.doesNotMatch(obterVersao(maki, 1).ferramentas.join(), /Óculos/);
    for (const extra of [{ tecnica: 2 }, { habilidades: 'texto' }, { ferramentas: [null] }, { afiliacao: '' }, { retratos: [{ imagem: './assets/img/../fora.png', largura: 100, altura: 100 }] }]) {
        assert.throws(() => validarPersonagens([{ ...data[0], ...extra }]));
    }
    const custom = structuredClone(data.find(p => p.id === 'maki-07'));
    delete custom.versoes[1].retratos;
    assert.deepEqual(obterVersao(validarPersonagens([custom])[0], 1).retratos, []);
});

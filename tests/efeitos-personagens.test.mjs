import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarEfeitosPersonagens } from '../js/efeitos-personagens.js';

test('efeitos são únicos, finitos, dispensáveis e limpos ao ocultar a página', async t => {
    const descritor = Object.getOwnPropertyDescriptor(globalThis, 'document');
    let api;
    t.after(() => { api?.destruir(); if (descritor) Object.defineProperty(globalThis, 'document', descritor); else delete globalThis.document; });
    function elemento() { return { children: [], setAttribute() {}, append(child) { this.children.push(child); child.parent = this; }, remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); } }; }
    const events = new Map();
    globalThis.document = { hidden:false, createElement:elemento, addEventListener(n,c) {events.set(n,c);}, removeEventListener(n) {events.delete(n);} };
    let permitido = true;
    api = iniciarEfeitosPersonagens({ permitido: () => permitido });
    const container = elemento();
    api.animar(container, {id:'gojo-02'});
    assert.equal(container.children.length, 1);
    assert.match(container.children[0].className, /efeito-gojo/);
    api.animar(container, {id:'sukuna-11'});
    assert.equal(container.children.length, 1);
    assert.match(container.children[0].className, /efeito-sukuna/);
    document.hidden = true;
    events.get('visibilitychange')();
    assert.equal(container.children.length, 0);
    permitido = false;
    api.animar(container, {id:'maki-07'});
    assert.equal(container.children.length, 0);
    permitido = true;
    api.animar(container, {id:'yuki-21'});
    assert.equal(container.children.length, 0);
    api.animar(container, {id:'maki-07'});
    await new Promise(resolve => setTimeout(resolve, 1150));
    assert.equal(container.children.length, 0);
    api.destruir();
    assert.equal(events.size, 0);
});

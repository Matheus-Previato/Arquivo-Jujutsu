import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/efeitos.js', import.meta.url), 'utf8')
    .replace('export function iniciarEfeitos()', 'function iniciarEfeitos()');

class Target {
    constructor() { this.events = new Map(); this.dataset = {}; this.attributes = {}; this.properties = {}; this.reads = 0; this.writes = 0; this.classes = new Set(); this.isConnected = true;
        this.style = { setProperty: (name, value) => { this.properties[name] = value; this.writes++; } };
        this.classList = { add: (...names) => names.forEach(name => this.classes.add(name)), remove: (...names) => names.forEach(name => this.classes.delete(name)) };
    }
    addEventListener(name, fn) { if (!this.events.has(name)) this.events.set(name, new Set()); this.events.get(name).add(fn); }
    removeEventListener(name, fn) { this.events.get(name)?.delete(fn); }
    emit(name, event = {}) { this.events.get(name)?.forEach(fn => fn(event)); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getBoundingClientRect() { this.reads++; return { left: 10, top: 20, right: 210, bottom: 320, width: 200, height: 300 }; }
}

function setup({ reduce = false, blockedStorage = false, preference = null } = {}) {
    const window = new Target(); const document = new Target();
    const reducedMedia = new Target(); reducedMedia.matches = reduce;
    const mouseMedia = new Target(); mouseMedia.matches = true;
    const elements = Object.fromEntries(['dominio-vfx', 'btn-efeitos', 'btn-dominio', 'cenario-dominio'].map(name => [name, new Target()]));
    const draws = []; const ctx = { clearRect() { draws.length = 0; }, beginPath() {}, arc(x, y, size) { draws.push({ x, y, size }); }, fill() {}, setTransform(...args) { this.transform = args; } };
    elements['dominio-vfx'].getContext = () => ctx;
    document.documentElement = new Target(); document.getElementById = name => elements[name]; document.hidden = false;
    window.innerWidth = 800; window.innerHeight = 600; window.devicePixelRatio = 3;
    window.matchMedia = query => query.includes('reduced-motion') ? reducedMedia : mouseMedia;
    const storage = new Map(preference ? [['jjk_efeitos', preference]] : []);
    const frames = new Map(); let frameId = 0;
    const fixedMath = Object.create(Math); fixedMath.random = () => 0.5;
    const iniciar = vm.runInNewContext(source + '\niniciarEfeitos', { window, document, Math: fixedMath, setTimeout, clearTimeout,
        requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; }, cancelAnimationFrame: id => frames.delete(id),
        localStorage: { getItem(key) { if (blockedStorage) throw Error('blocked'); return storage.get(key) ?? null; }, setItem(key, value) { if (blockedStorage) throw Error('blocked'); storage.set(key, value); } }
    });
    const api = iniciar();
    return { api, window, document, reducedMedia, mouseMedia, elements, ctx, draws, frames, storage,
        frame(time) { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); } };
}

test('particles are capped, use DPR <= 2 and stop when hidden or complete', () => {
    const app = setup();
    try {
        assert.equal(app.elements['dominio-vfx'].width, 1600);
        assert.equal(app.elements['dominio-vfx'].height, 1200);
        assert.deepEqual(app.ctx.transform, [2, 0, 0, 2, 0, 0]);
        for (let i = 0; i < 100; i++) app.api.invocarExplosao(30, 60, '255, 0, 0');
        assert.equal(app.frames.size, 1);
        app.frame(0); assert.equal(app.draws.length, 120);
        app.document.hidden = true; app.document.emit('visibilitychange');
        assert.equal(app.frames.size, 0); assert.equal(app.draws.length, 0);
        app.api.invocarExplosao(30, 60, '255, 0, 0'); assert.equal(app.frames.size, 0);
        app.document.hidden = false;
        app.api.invocarExplosao(30, 60, '255, 0, 0');
        for (let time = 0; time <= 2000; time += 50) app.frame(time);
        assert.equal(app.frames.size, 0); assert.equal(app.draws.length, 0);
    } finally { app.api.destruir(); }
});

test('particle horizontal speed and fading depend on elapsed time, not refresh rate', () => {
    const slow = setup(); const fast = setup();
    try {
        for (const app of [slow, fast]) { app.api.invocarExplosao(100, 100, '255, 0, 0'); app.frame(0); }
        for (let frame = 1; frame <= 15; frame++) slow.frame(frame * 1000 / 60);
        for (let frame = 1; frame <= 30; frame++) fast.frame(frame * 1000 / 120);
        assert.ok(Math.abs(slow.draws[0].x - fast.draws[0].x) < 1e-8);
        assert.ok(Math.abs(slow.draws[0].y - fast.draws[0].y) < 1);
        const opacity = app => Number(app.ctx.fillStyle.slice(app.ctx.fillStyle.lastIndexOf(',') + 1, -1));
        assert.ok(Math.abs(opacity(slow) - opacity(fast)) < 1e-8);
    } finally { slow.api.destruir(); fast.api.destruir(); }
});

test('mouse events share one frame, cache geometry, invalidate after scroll and dispose', () => {
    const app = setup(); const card = new Target(); const wrapper = new Target();
    try {
        const dispose = app.api.vincularEfeitoCard(card, wrapper);
        const pointer = { pointerType: 'mouse', clientX: 160, clientY: 230 };
        wrapper.emit('pointerenter', pointer);
        for (let i = 0; i < 20; i++) wrapper.emit('pointermove', pointer);
        assert.equal(wrapper.reads, 1); assert.equal(card.writes, 0); assert.equal(app.frames.size, 1);
        app.frame(0); assert.equal(wrapper.reads, 1); assert.equal(card.writes, 4);
        assert.equal(card.properties['--rotateY'], '7.5deg');
        app.window.emit('scroll'); assert.equal(wrapper.reads, 1);
        app.frame(16); assert.equal(wrapper.reads, 2);
        wrapper.emit('pointermove', pointer); dispose(); assert.equal(app.frames.size, 0);
        assert.equal(card.properties['--rotateY'], '0deg');
        wrapper.emit('pointermove', pointer); assert.equal(app.frames.size, 0);
    } finally { app.api.destruir(); }
});

test('touch and coarse pointers do not tilt cards or install touch scroll interception', () => {
    const app = setup(); const wrapper = new Target(); const card = new Target();
    try {
        app.api.vincularEfeitoCard(card, wrapper);
        wrapper.emit('pointerenter', { pointerType: 'touch', clientX: 160, clientY: 230 });
        wrapper.emit('pointermove', { pointerType: 'touch', clientX: 160, clientY: 230 });
        assert.equal(app.frames.size, 0); assert.equal(wrapper.reads, 0);
        app.mouseMedia.matches = false;
        wrapper.emit('pointerenter', { pointerType: 'mouse', clientX: 160, clientY: 230 });
        assert.equal(app.frames.size, 0);
        assert.ok(![...app.document.events.keys()].some(name => name.startsWith('touch')));
    } finally { app.api.destruir(); }
});

test('user preference persists and OS reduced motion always wins without changing it', () => {
    const app = setup(); const button = app.elements['btn-efeitos'];
    try {
        button.emit('click'); assert.equal(app.storage.get('jjk_efeitos'), 'reduzidos');
        assert.equal(app.document.documentElement.dataset.efeitos, 'reduzidos');
        app.api.invocarExplosao(30, 60, '255, 0, 0'); assert.equal(app.frames.size, 0);
        button.emit('click'); assert.equal(app.storage.get('jjk_efeitos'), 'ativos');
        app.reducedMedia.matches = true; app.reducedMedia.emit('change');
        assert.equal(button.disabled, true); assert.equal(button.attributes['aria-pressed'], 'false');
        button.emit('click'); assert.equal(app.storage.get('jjk_efeitos'), 'ativos');
        app.reducedMedia.matches = false; app.reducedMedia.emit('change');
        assert.equal(app.document.documentElement.dataset.efeitos, 'ativos');
        assert.equal(button.disabled, false);
    } finally { app.api.destruir(); }
    const blocked = setup({ blockedStorage: true });
    try { assert.doesNotThrow(() => blocked.elements['btn-efeitos'].emit('click')); } finally { blocked.api.destruir(); }
});

test('all domains cycle with accessible current/next labels in reduced mode', () => {
    const app = setup({ reduce: true }); const button = app.elements['btn-dominio']; const scene = app.elements['cenario-dominio'];
    try {
        for (const [name, label] of [['dominio-gojo', 'Gojo'], ['dominio-sukuna', 'Sukuna'], ['dominio-higuruma', 'Higuruma']]) {
            button.emit('click'); assert.equal(scene.classes.size, 1); assert.ok(scene.classes.has(name));
            assert.ok(button.attributes['aria-label'].startsWith(label));
            assert.equal(button.title, button.attributes['aria-label']); assert.equal(app.frames.size, 0);
        }
        button.emit('click'); assert.equal(scene.classes.size, 0);
        assert.ok(button.attributes['aria-label'].startsWith('Cenário normal'));
    } finally { app.api.destruir(); }
});

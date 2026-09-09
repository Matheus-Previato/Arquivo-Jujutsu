import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
async function verificar(caminho) {
    let pasta = root;
    for (const parte of caminho.replace(/^\.\//, '').split('/')) {
        assert.ok((await readdir(pasta)).includes(parte), `Arquivo ausente ou capitalização incorreta: ${caminho}`);
        pasta = new URL(parte + '/', pasta);
    }
    assert.ok((await stat(new URL(caminho, root))).size > 0);
}
test('todos os retratos originais e responsivos existem com o nome exato usado no Pages', async () => {
    const data = JSON.parse(await readFile(new URL('data/personagens.json', root)));
    const caminhos = new Set();
    for (const p of data) for (const ficha of [p, ...(p.versoes ?? [])]) {
        if (ficha.imagem) caminhos.add(ficha.imagem);
        for (const retrato of ficha.retratos ?? []) caminhos.add(retrato.imagem);
    }
    await Promise.all([...caminhos].map(verificar));
});

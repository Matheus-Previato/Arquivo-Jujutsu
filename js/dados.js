const TIPOS = new Set(['feiticeiro', 'maldicao', 'neutro', 'anomalia']);
const ATRIBUTOS = ['fis', 'vel', 'eng', 'int', 'let'];

export function validarPersonagens(dados) {
    if (!Array.isArray(dados)) throw new Error('O catálogo deve ser uma lista.');
    const ids = new Set();
    return dados.map((personagem, indice) => {
        if (!personagem || typeof personagem !== 'object') throw new Error(`Personagem inválido na posição ${indice}.`);
        const { id, nome, classe, descricao, tipo, atributos } = personagem;
        if (typeof id !== 'string' || !/^[a-z0-9-]+$/i.test(id) || ids.has(id)) {
            throw new Error(`ID inválido ou repetido na posição ${indice}.`);
        }
        ids.add(id);
        if ([nome, classe, descricao].some(valor => typeof valor !== 'string' || !valor.trim()) || !TIPOS.has(tipo)) {
            throw new Error(`Nome, classe, descrição ou tipo inválido: ${id}.`);
        }
        if (!atributos || ATRIBUTOS.some(chave => !Number.isFinite(atributos[chave]) || atributos[chave] < 0 || atributos[chave] > 100)) {
            throw new Error(`Os atributos de ${id} devem estar entre 0 e 100.`);
        }
        const corAura = personagem.corAura || '89, 0, 179';
        if (typeof corAura !== 'string' || !/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(corAura) || corAura.split(',').some(valor => Number(valor) > 255)) {
            throw new Error(`Cor inválida: ${id}.`);
        }
        const imagem = personagem.imagem || '';
        if (typeof imagem !== 'string' || (imagem && !/^\.\/assets\/img\/[a-z0-9_./-]+$/i.test(imagem))) {
            throw new Error(`Caminho de imagem inválido: ${id}. Use ./assets/img/arquivo.`);
        }
        return { ...personagem, nome: nome.trim(), corAura, imagem };
    });
}

export function normalizarBusca(texto) {
    return texto.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filtrarPersonagens(personagens, busca, tipo, favoritos) {
    const termo = normalizarBusca(busca);
    return personagens.filter(personagem => {
        const texto = normalizarBusca(`${personagem.nome} ${personagem.classe}`);
        if (!texto.includes(termo)) return false;
        if (tipo === 'favoritos') return favoritos.includes(personagem.id);
        if (tipo === 'outro') return !['feiticeiro', 'maldicao'].includes(personagem.tipo);
        return tipo === 'todos' || personagem.tipo === tipo;
    });
}

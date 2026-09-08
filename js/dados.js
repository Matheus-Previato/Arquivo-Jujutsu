const TIPOS = new Set(['feiticeiro', 'maldicao', 'neutro', 'anomalia']);
const ATRIBUTOS = ['fis', 'vel', 'eng', 'int', 'let'];
const CAMPOS_VERSAO = new Set(['id', 'classe', 'descricao', 'imagem', 'larguraImagem', 'alturaImagem', 'corAura', 'atributos']);

function validarVersoes(personagem) {
    const { versoes, ...base } = personagem;
    if (!Array.isArray(versoes) || versoes.length < 2) throw new Error(`Declare pelo menos duas versões: ${base.id}.`);
    const ids = new Set();
    return versoes.map(versao => {
        if (!versao || typeof versao !== 'object' || Array.isArray(versao) ||
            Object.keys(versao).some(chave => !CAMPOS_VERSAO.has(chave)) ||
            typeof versao.id !== 'string' || !/^[a-z0-9-]+$/i.test(versao.id) || ids.has(versao.id) ||
            typeof versao.classe !== 'string' || !versao.classe.trim()) {
            throw new Error(`Versão inválida ou repetida: ${base.id}.`);
        }
        ids.add(versao.id);
        const { id, ...ajustes } = versao;
        // Reaproveita a validação da ficha; versões aninhadas não são permitidas.
        const [ficha] = validarPersonagens([{ ...base, ...ajustes }]);
        return { ...ficha, id };
    });
}

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
        for (const chave of ['larguraImagem', 'alturaImagem']) {
            if (personagem[chave] !== undefined && (!Number.isInteger(personagem[chave]) || personagem[chave] <= 0 || personagem[chave] > 16384)) {
                throw new Error(`Dimensão de imagem inválida: ${id}.`);
            }
        }
        const normalizado = { ...personagem, nome: nome.trim(), corAura, imagem };
        if (personagem.versoes !== undefined) normalizado.versoes = validarVersoes(normalizado);
        return normalizado;
    });
}

export function normalizarBusca(texto) {
    return texto.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filtrarPersonagens(personagens, busca, tipo, favoritos) {
    const termo = normalizarBusca(busca);
    return personagens.filter(personagem => {
        const classes = [personagem.classe, ...(personagem.versoes?.map(versao => versao.classe) ?? [])];
        const texto = normalizarBusca(`${personagem.nome} ${classes.join(' ')}`);
        if (!texto.includes(termo)) return false;
        if (tipo === 'favoritos') return favoritos.includes(personagem.id);
        if (tipo === 'outro') return !['feiticeiro', 'maldicao'].includes(personagem.tipo);
        return tipo === 'todos' || personagem.tipo === tipo;
    });
}

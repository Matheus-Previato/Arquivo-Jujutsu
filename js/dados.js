const TIPOS = new Set(['feiticeiro', 'maldicao', 'neutro', 'anomalia']);
const ATRIBUTOS = ['fis', 'vel', 'eng', 'int', 'let'];
const CAMPOS_VERSAO = new Set(['id', 'classe', 'descricao', 'imagem', 'larguraImagem', 'alturaImagem', 'corAura', 'atributos', 'retratos', 'tecnica', 'habilidades', 'ferramentas', 'afiliacao']);
const CAMINHO_IMAGEM = /^\.\/assets\/img\/(?:[a-z0-9_-]+\/)*[a-z0-9_.-]+\.(?:png|webp|avif|jpe?g)$/i;

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
        // Uma nova arte não deve herdar miniaturas da imagem anterior.
        if (ajustes.imagem !== undefined && ajustes.imagem !== base.imagem && ajustes.retratos === undefined) ajustes.retratos = [];
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
        if (typeof imagem !== 'string' || (imagem && !CAMINHO_IMAGEM.test(imagem))) {
            throw new Error(`Caminho de imagem inválido: ${id}. Use ./assets/img/arquivo.`);
        }
        if (personagem.retratos !== undefined) {
            if (!Array.isArray(personagem.retratos) || personagem.retratos.length > 6) throw new Error(`Retratos inválidos: ${id}.`);
            let ultimaLargura = 0;
            for (const retrato of personagem.retratos) {
                if (!retrato || typeof retrato.imagem !== 'string' || !CAMINHO_IMAGEM.test(retrato.imagem) ||
                    !Number.isInteger(retrato.largura) || retrato.largura <= ultimaLargura || retrato.largura > 16384 ||
                    !Number.isInteger(retrato.altura) || retrato.altura < 1 || retrato.altura > 16384) throw new Error(`Retrato responsivo inválido: ${id}.`);
                ultimaLargura = retrato.largura;
            }
        }
        for (const campo of ['tecnica', 'afiliacao']) {
            if (personagem[campo] !== undefined && (typeof personagem[campo] !== 'string' || !personagem[campo].trim())) throw new Error(`Campo ${campo} inválido: ${id}.`);
        }
        for (const campo of ['habilidades', 'ferramentas']) {
            if (personagem[campo] !== undefined && (!Array.isArray(personagem[campo]) || personagem[campo].length > 12 ||
                personagem[campo].some(item => typeof item !== 'string' || !item.trim()))) throw new Error(`Lista ${campo} inválida: ${id}.`);
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

export function filtrarPersonagens(personagens, busca, tipo, favoritos, { classe = '', ordem = 'padrao' } = {}) {
    const termo = normalizarBusca(busca);
    const lista = personagens.filter(personagem => {
        const classes = [personagem.classe, ...(personagem.versoes?.map(versao => versao.classe) ?? [])];
        const fichas = [personagem, ...(personagem.versoes ?? [])];
        const texto = normalizarBusca([personagem.nome, ...classes, ...fichas.flatMap(ficha => [ficha.tecnica, ficha.afiliacao, ...(ficha.habilidades ?? []), ...(ficha.ferramentas ?? [])])].filter(Boolean).join(' '));
        if (!texto.includes(termo)) return false;
        if (classe && !classes.includes(classe)) return false;
        if (tipo === 'favoritos') return favoritos.includes(personagem.id);
        if (tipo === 'outro') return !['feiticeiro', 'maldicao'].includes(personagem.tipo);
        return tipo === 'todos' || personagem.tipo === tipo;
    });
    if (ordem === 'nome') lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return lista;
}

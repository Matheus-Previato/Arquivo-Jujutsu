// Estado compartilhado entre catálogo, favoritos e detalhes.
const CHAVE_FAVORITOS = 'jjk_selados';
const AVISO_INDISPONIVEL = 'O navegador não permitiu salvar os favoritos. Você pode continuar usando-os nesta visita.';
const AVISO_RECUPERADO = 'Os favoritos salvos estavam inválidos e foram reiniciados. Você pode favoritar os personagens novamente.';

export function persistirFavoritos(estado) {
    try {
        localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(estado.feiticeirosSelados));
        return true;
    } catch {
        estado.avisoArmazenamento = AVISO_INDISPONIVEL;
        return false;
    }
}

export function criarEstado() {
    const estado = {
        bancoDeDadosPersonagens: [],
        feiticeirosSelados: [],
        personagemAtualModal: null,
        avisoArmazenamento: null,
    };

    let valorSalvo;
    try {
        valorSalvo = localStorage.getItem(CHAVE_FAVORITOS);
    } catch {
        estado.avisoArmazenamento = AVISO_INDISPONIVEL;
        return estado;
    }

    if (valorSalvo === null) return estado;

    try {
        const favoritos = JSON.parse(valorSalvo);
        if (!Array.isArray(favoritos) || !favoritos.every(id => typeof id === 'string' && id.length > 0)) {
            throw new TypeError('Favoritos inválidos');
        }
        estado.feiticeirosSelados = [...new Set(favoritos)];
        if (estado.feiticeirosSelados.length !== favoritos.length) persistirFavoritos(estado);
    } catch {
        estado.avisoArmazenamento = AVISO_RECUPERADO;
        persistirFavoritos(estado);
    }

    return estado;
}

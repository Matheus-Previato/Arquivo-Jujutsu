// Estado compartilhado entre catálogo, favoritos e detalhes.
export function criarEstado() {
    return {
        bancoDeDadosPersonagens: [],
        feiticeirosSelados: JSON.parse(localStorage.getItem('jjk_selados')) || [],
        personagemAtualModal: null,
    };
}

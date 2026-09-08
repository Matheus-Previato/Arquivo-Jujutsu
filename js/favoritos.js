import { persistirFavoritos } from './estado.js';

export function atualizarBotaoFavorito(botao, personagem, selado) {
    if (!botao || !personagem) return;
    const rotulo = selado ? `Remover ${personagem.nome} dos favoritos` : `Favoritar ${personagem.nome}`;
    botao.classList.toggle('ativo', selado);
    botao.setAttribute('aria-pressed', String(selado));
    botao.setAttribute('aria-label', rotulo);
    botao.title = rotulo;
}

// Altera apenas o favorito solicitado; o catálogo decide como atualizar seu card.
export function criarFavoritos({ estado, aoAlterar }) {
    const btnSelarModal = document.getElementById('btn-selar-modal');
    const avisoArmazenamento = document.getElementById('aviso-armazenamento');

    function atualizarAviso() {
        if (!avisoArmazenamento) return;
        avisoArmazenamento.textContent = estado.avisoArmazenamento || '';
        avisoArmazenamento.hidden = !estado.avisoArmazenamento;
    }

    function sincronizarFavoritos() {
        const idsExistentes = new Set(estado.bancoDeDadosPersonagens.map(personagem => personagem.id));
        const favoritosValidos = estado.feiticeirosSelados.filter(id => idsExistentes.has(id));
        if (favoritosValidos.length !== estado.feiticeirosSelados.length) {
            estado.feiticeirosSelados = favoritosValidos;
            persistirFavoritos(estado);
        }
        atualizarAviso();
    }

    function alternarSeloGlobal(idPersonagem) {
        const personagem = estado.bancoDeDadosPersonagens.find(item => item.id === idPersonagem);
        if (!personagem) return false;

        const index = estado.feiticeirosSelados.indexOf(idPersonagem);
        if (index > -1) {
            estado.feiticeirosSelados.splice(index, 1);
        } else {
            estado.feiticeirosSelados.push(idPersonagem);
        }
        persistirFavoritos(estado);
        atualizarAviso();

        if (estado.personagemAtualModal?.id === idPersonagem) {
            atualizarBotaoFavorito(btnSelarModal, personagem, estado.feiticeirosSelados.includes(idPersonagem));
        }
        aoAlterar(idPersonagem);
        return true;
    }

    atualizarAviso();
    return { alternarSeloGlobal, sincronizarFavoritos };
}

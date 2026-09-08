import { preencherImagemPersonagem } from './imagens.js';
import { atualizarBotaoFavorito } from './favoritos.js';

// O <dialog> mantém o foco nos detalhes e torna o restante da página inativo.
export function criarModal({ estado, alternarSeloGlobal, invocarExplosao, desenharGraficoRadar, limparRadar }) {
    const modal = document.getElementById('modal-personagem');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnSelarModal = document.getElementById('btn-selar-modal');
    const modalNome = document.getElementById('modal-nome');
    const modalClasse = document.getElementById('modal-classe');
    const modalDescricao = document.getElementById('modal-descricao');
    const containerImagemModal = modal?.querySelector('.modal-imagem-placeholder');
    let elementoOrigem = null;
    let indiceOrigem = 0;
    let overflowAnterior = null;
    let toqueComecouNoFundo = false;
    let toqueTerminouNoFundo = false;

    function podeReceberFoco(elemento) {
        if (!elemento?.isConnected || elemento.disabled || elemento.tabIndex < 0 ||
            elemento.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
        const estilo = getComputedStyle(elemento);
        return elemento.getClientRects().length > 0 && !['hidden', 'collapse'].includes(estilo.visibility) && estilo.display !== 'none';
    }

    function devolverFoco() {
        let destino = elementoOrigem;
        if (!podeReceberFoco(destino)) {
            const botoes = [...document.querySelectorAll('.btn-abrir-personagem')].filter(podeReceberFoco);
            destino = botoes[Math.min(indiceOrigem, botoes.length - 1)];
        }
        if (!podeReceberFoco(destino)) {
            destino = ['filtro-tipo', 'busca-personagem']
                .map(id => document.getElementById(id)).find(podeReceberFoco);
        }
        destino?.focus({ preventScroll: true });
        elementoOrigem = null;
    }

    function abrirModal(personagem, origem = document.activeElement) {
        if (!modal) return;
        if (!modal.open) {
            elementoOrigem = origem;
            const botoes = [...document.querySelectorAll('.btn-abrir-personagem')].filter(podeReceberFoco);
            indiceOrigem = Math.max(0, botoes.indexOf(origem));
            overflowAnterior = document.body.style.overflow;
        }

        estado.personagemAtualModal = personagem;
        const corAura = personagem.corAura || '89, 0, 179';
        modal.style.setProperty('--cor-aura', corAura);
        if (modalNome) modalNome.textContent = personagem.nome;
        if (modalDescricao) modalDescricao.textContent = personagem.descricao;
        if (modalClasse) {
            modalClasse.className = 'badge';
            if (personagem.tipo) modalClasse.classList.add(personagem.tipo);
            if (personagem.tipo === 'anomalia') {
                const texto = document.createElement('span');
                texto.className = 'texto-hibrido';
                texto.textContent = personagem.classe;
                modalClasse.replaceChildren(texto);
            } else {
                modalClasse.textContent = personagem.classe;
            }
        }

        atualizarBotaoFavorito(btnSelarModal, personagem, estado.feiticeirosSelados.includes(personagem.id));
        if (containerImagemModal) preencherImagemPersonagem(containerImagemModal, personagem, { modal: true });
        desenharGraficoRadar(personagem.atributos, corAura);

        if (!modal.open) modal.showModal();
        document.body.style.overflow = 'hidden';
        modal.classList.add('ativo');
        modal.scrollTop = 0;
        btnFecharModal?.focus({ preventScroll: true });
    }

    function fecharModal() {
        if (modal?.open) modal.close();
    }

    // O evento nativo cobre o botão, Escape e outras chamadas a dialog.close().
    modal?.addEventListener('close', () => {
        modal.classList.remove('ativo');
        estado.personagemAtualModal = null;
        limparRadar();
        if (overflowAnterior !== null) document.body.style.overflow = overflowAnterior;
        overflowAnterior = null;
        toqueComecouNoFundo = false;
        toqueTerminouNoFundo = false;
        devolverFoco();
    });

    btnSelarModal?.addEventListener('click', () => {
        if (!estado.personagemAtualModal) return;
        const personagem = estado.personagemAtualModal;
        const rect = btnSelarModal.getBoundingClientRect();
        alternarSeloGlobal(personagem.id);
        invocarExplosao(rect.left + rect.width / 2, rect.top + rect.height / 2, personagem.corAura || '89, 0, 179');
    });
    btnFecharModal?.addEventListener('click', fecharModal);

    // Só fecha quando o gesto começa e termina no fundo, sem fechar ao arrastar o texto.
    modal?.addEventListener('pointerdown', evento => {
        toqueComecouNoFundo = evento.target === modal && evento.button === 0;
        toqueTerminouNoFundo = false;
    });
    modal?.addEventListener('pointerup', evento => {
        toqueTerminouNoFundo = evento.target === modal;
    });
    modal?.addEventListener('pointercancel', () => {
        toqueComecouNoFundo = false;
        toqueTerminouNoFundo = false;
    });
    modal?.addEventListener('click', evento => {
        if (evento.target === modal && toqueComecouNoFundo && toqueTerminouNoFundo) fecharModal();
        toqueComecouNoFundo = false;
        toqueTerminouNoFundo = false;
    });

    return { abrirModal };
}

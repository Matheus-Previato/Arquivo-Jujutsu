// Conteúdo e eventos da janela de detalhes do personagem.
export function criarModal({ estado, alternarSeloGlobal, invocarExplosao, desenharGraficoRadar, fecharTooltip }) {
    const modal = document.getElementById('modal-personagem');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnSelarModal = document.getElementById('btn-selar-modal');
    const tooltipPonto = document.getElementById('tooltip-ponto');

    const modalNome = document.getElementById('modal-nome');
    const modalClasse = document.getElementById('modal-classe');
    const modalDescricao = document.getElementById('modal-descricao');
    const containerImagemModal = document.querySelector('.modal-imagem-placeholder');

    // --- 5. MODAL E EVENTOS ---
    function abrirModal(personagem) {
        estado.personagemAtualModal = personagem;

        if(modalNome) {
            modalNome.textContent = personagem.nome;
            modalNome.className = '';
        }

        if(modalClasse) {
            modalClasse.className = `badge ${personagem.tipo}`;
            if(personagem.tipo === 'anomalia') modalClasse.innerHTML = `<span class="texto-hibrido">${personagem.classe}</span>`;
            else modalClasse.textContent = personagem.classe;
        }

        if(modalDescricao) modalDescricao.textContent = personagem.descricao;

        if (btnSelarModal) {
            if (estado.feiticeirosSelados.includes(personagem.id)) {
                btnSelarModal.classList.add('ativo');
            } else {
                btnSelarModal.classList.remove('ativo');
            }
        }

        if (containerImagemModal) {
            if (personagem.imagem) {
                containerImagemModal.innerHTML = `<img src="${personagem.imagem}" alt="${personagem.nome}" class="modal-img-real" loading="lazy" onerror="this.onerror=null; this.outerHTML='<span id=\\'modal-img-texto\\'>${personagem.imgPlaceholder}</span>'; document.querySelector('.modal-imagem-placeholder').style.background = 'linear-gradient(45deg, #111, #222)';">`;
                containerImagemModal.style.background = "transparent";
                containerImagemModal.style.border = "none";
            } else {
                containerImagemModal.innerHTML = `<span id="modal-img-texto">${personagem.imgPlaceholder}</span>`;
                containerImagemModal.style.background = "linear-gradient(45deg, #111, #222)";
                containerImagemModal.style.border = "1px solid #333";
            }
        }

        desenharGraficoRadar(personagem.atributos, personagem.corAura || "89, 0, 179");

        if(modal) {
            modal.classList.add('ativo');
            if(btnFecharModal) btnFecharModal.focus();
        }
    }

    function fecharModal() {
        if(modal) modal.classList.remove('ativo');
        estado.personagemAtualModal = null;
        fecharTooltip();
        if(tooltipPonto) tooltipPonto.classList.remove('ativo');
    }

    if(btnSelarModal) {
        btnSelarModal.addEventListener('click', () => {
            if (!estado.personagemAtualModal) return;
            const rect = btnSelarModal.getBoundingClientRect();
            const centroX = rect.left + (rect.width / 2);
            const centroY = rect.top + (rect.height / 2);

            alternarSeloGlobal(estado.personagemAtualModal.id);
            invocarExplosao(centroX, centroY, estado.personagemAtualModal.corAura || "89, 0, 179");
        });
    }

    if(btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);
    if(modal) {
        modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
        document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape' && modal.classList.contains('ativo')) fecharModal(); });
    }

    return { abrirModal };
}

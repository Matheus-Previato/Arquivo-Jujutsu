// Alternância e persistência dos selos, com notificação ao catálogo.
export function criarFavoritos({ estado, aoAlterar }) {
    const btnSelarModal = document.getElementById('btn-selar-modal');

    function alternarSeloGlobal(idPersonagem) {
        const index = estado.feiticeirosSelados.indexOf(idPersonagem);
        if (index > -1) {
            estado.feiticeirosSelados.splice(index, 1);
        } else {
            estado.feiticeirosSelados.push(idPersonagem);
        }
        localStorage.setItem('jjk_selados', JSON.stringify(estado.feiticeirosSelados));

        if (estado.personagemAtualModal && estado.personagemAtualModal.id === idPersonagem) {
            if (estado.feiticeirosSelados.includes(idPersonagem)) {
                if(btnSelarModal) btnSelarModal.classList.add('ativo');
            } else {
                if(btnSelarModal) btnSelarModal.classList.remove('ativo');
            }
        }
        aoAlterar();
    }

    return { alternarSeloGlobal };
}

// Uma versão muda a apresentação; a identidade usada pelos favoritos continua igual.
export function obterVersao(personagem, indice = 0) {
    const versao = personagem.versoes?.[indice] ?? personagem.versoes?.[0];
    if (!versao) return personagem;
    return { ...personagem, ...versao, id: personagem.id, nome: personagem.nome, versaoId: versao.id };
}

export function criarSeletorVersoes(personagem, aoSelecionar) {
    if (!personagem.versoes?.length) return null;
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn-versao';
    const icone = document.createElement('span');
    icone.textContent = '⇄';
    icone.setAttribute('aria-hidden', 'true');
    botao.append(icone);
    let selecionado = 0;

    function atualizarRotulo() {
        const proxima = personagem.versoes[(selecionado + 1) % personagem.versoes.length];
        botao.setAttribute('aria-label', `Alternar ${personagem.nome} para ${proxima.classe}`);
        botao.title = `Alternar para ${proxima.classe}`;
    }
    function selecionar(id) {
        const indice = personagem.versoes.findIndex(versao => versao.id === id);
        if (indice < 0 || indice === selecionado) return;
        selecionado = indice;
        atualizarRotulo();
        aoSelecionar(obterVersao(personagem, selecionado));
    }
    botao.addEventListener('click', () => selecionar(personagem.versoes[(selecionado + 1) % personagem.versoes.length].id));
    atualizarRotulo();
    return { botao, selecionar };
}

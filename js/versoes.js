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
    botao.addEventListener('click', () => {
        selecionado = (selecionado + 1) % personagem.versoes.length;
        atualizarRotulo();
        aoSelecionar(obterVersao(personagem, selecionado));
    });
    atualizarRotulo();
    return botao;
}

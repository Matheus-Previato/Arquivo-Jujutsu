// A mesma apresentação de imagem é usada nos cards e nos detalhes.
export function preencherImagemPersonagem(container, personagem, { modal = false, prioritaria = false } = {}) {
    container.replaceChildren();
    container.classList.remove('skeleton', 'tem-imagem', 'sem-imagem');

    function mostrarAusencia() {
        container.replaceChildren();
        container.classList.remove('skeleton', 'tem-imagem');
        container.classList.add('sem-imagem');
        const retrato = document.createElement('div');
        retrato.className = 'retrato-ausente';
        const marca = document.createElement('span');
        marca.className = 'retrato-iniciais';
        marca.setAttribute('aria-hidden', 'true');
        marca.textContent = personagem.nome.split(/\s+/).filter(Boolean).map(parte => parte[0]).slice(0, 2).join('');
        const legenda = document.createElement('span');
        legenda.className = 'retrato-legenda';
        legenda.textContent = 'Retrato indisponível';
        retrato.append(marca, legenda);
        container.append(retrato);
    }

    if (!personagem.imagem) { mostrarAusencia(); return; }
    const imagem = document.createElement('img');
    imagem.className = modal ? 'modal-img-real' : 'card-img';
    imagem.alt = personagem.nome;
    imagem.width = personagem.larguraImagem || 400;
    imagem.height = personagem.alturaImagem || 500;
    imagem.loading = modal || prioritaria ? 'eager' : 'lazy';
    imagem.decoding = 'async';
    if (prioritaria) imagem.fetchPriority = 'high';
    container.classList.add('skeleton', 'tem-imagem');
    imagem.addEventListener('load', () => {
        if (container.contains(imagem)) container.classList.remove('skeleton');
    }, { once: true });
    imagem.addEventListener('error', () => {
        if (container.contains(imagem)) mostrarAusencia();
    }, { once: true });
    container.append(imagem);
    imagem.src = personagem.imagem;
}

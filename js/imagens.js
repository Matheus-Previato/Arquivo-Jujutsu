const requisicoes = new WeakMap();

// A mesma apresentação de imagem é usada nos cards e nos detalhes.
export function preencherImagemPersonagem(container, personagem, { modal = false, prioritaria = false, transicao = false } = {}) {
    const previa = requisicoes.get(container);
    clearTimeout(previa?.temporizador);
    let anterior = transicao ? (previa?.carregada ? previa.imagem : previa?.anterior) : null;
    if (!anterior || !container.contains(anterior)) anterior = null;
    anterior?.classList.remove('retrato-sobreposto', 'retrato-pendente', 'retrato-revelado', 'retrato-saindo');
    container.replaceChildren(...(anterior ? [anterior] : []));
    const pedido = { anterior, imagem: null, carregada: false, temporizador: null };
    requisicoes.set(container, pedido);
    container.classList.remove('skeleton', 'tem-imagem', 'sem-imagem');

    function mostrarAusencia() {
        clearTimeout(pedido.temporizador);
        pedido.anterior = null;
        pedido.carregada = false;
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
    pedido.imagem = imagem;
    imagem.className = modal ? 'modal-img-real' : 'card-img';
    imagem.alt = personagem.nome;
    imagem.width = personagem.larguraImagem || 400;
    imagem.height = personagem.alturaImagem || 500;
    imagem.loading = modal || prioritaria ? 'eager' : 'lazy';
    imagem.decoding = 'async';
    if (personagem.retratos?.length) {
        imagem.srcset = personagem.retratos.map(retrato => `${retrato.imagem} ${retrato.largura}w`).join(', ');
        imagem.sizes = modal ? '(max-width: 768px) 300px, 320px' : '(max-width: 600px) calc(100vw - 32px), (max-width: 900px) 50vw, 350px';
    }
    if (prioritaria) imagem.fetchPriority = 'high';
    container.classList.add('tem-imagem');
    if (anterior) imagem.classList.add('retrato-sobreposto', 'retrato-pendente');
    else container.classList.add('skeleton');
    imagem.addEventListener('load', () => {
        if (requisicoes.get(container) !== pedido || !container.contains(imagem)) return;
        pedido.carregada = true;
        container.classList.remove('skeleton');
        if (!anterior) return;
        imagem.classList.remove('retrato-pendente');
        imagem.classList.add('retrato-revelado');
        anterior.classList.add('retrato-saindo');
        function concluir() {
            if (requisicoes.get(container) !== pedido) return;
            clearTimeout(pedido.temporizador);
            anterior.remove();
            imagem.classList.remove('retrato-sobreposto', 'retrato-revelado');
            pedido.anterior = null;
        }
        imagem.addEventListener('animationend', concluir, { once: true });
        // Também limpa a imagem anterior quando o usuário desativa as animações.
        pedido.temporizador = setTimeout(concluir, 400);
    }, { once: true });
    let usandoOriginal = !personagem.retratos?.length;
    imagem.addEventListener('error', () => {
        if (requisicoes.get(container) !== pedido || !container.contains(imagem)) return;
        if (!usandoOriginal) {
            usandoOriginal = true;
            imagem.srcset = '';
            imagem.sizes = '';
            imagem.src = personagem.imagem;
        } else mostrarAusencia();
    });
    container.append(imagem);
    imagem.src = personagem.imagem;
}

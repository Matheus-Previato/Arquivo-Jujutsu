// Partículas, cenários de domínio e movimento opcional dos cards.
export function iniciarEfeitos() {
    const canvas = document.getElementById('dominio-vfx');
    const ctx = canvas?.getContext('2d');
    const btnEfeitos = document.getElementById('btn-efeitos');
    const btnDominio = document.getElementById('btn-dominio');
    const cenario = document.getElementById('cenario-dominio');
    const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mousePreciso = window.matchMedia('(hover: hover) and (pointer: fine)');
    const chavePreferencia = 'jjk_efeitos';
    const vinculos = new Set();
    const cardsAtivos = new Set();
    let preferencia = 'ativos';
    let reduzidos = false;
    let destruido = false;
    let versaoLayout = 0;
    let largura = 0;
    let altura = 0;
    let particulas = [];
    let quadroParticulas = null;
    let tempoAnterior = null;
    let temporizadorDominio = null;

    try {
        if (localStorage.getItem(chavePreferencia) === 'reduzidos') preferencia = 'reduzidos';
    } catch { /* A página continua funcional se o armazenamento estiver bloqueado. */ }

    function limparParticulas() {
        if (quadroParticulas !== null) cancelAnimationFrame(quadroParticulas);
        quadroParticulas = null;
        tempoAnterior = null;
        particulas = [];
        ctx?.clearRect(0, 0, largura, altura);
    }

    function redimensionarCanvas() {
        largura = window.innerWidth;
        altura = window.innerHeight;
        if (!ctx) return;
        const escala = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(largura * escala);
        canvas.height = Math.round(altura * escala);
        ctx.setTransform(escala, 0, 0, escala, 0, 0);
    }

    function animarParticulas(tempo) {
        quadroParticulas = null;
        if (reduzidos || document.hidden || destruido) return limparParticulas();
        // Segundos mantêm a velocidade igual em telas de 60 Hz e 120 Hz.
        const delta = tempoAnterior === null ? 1 / 60 : Math.min((tempo - tempoAnterior) / 1000, 0.05);
        tempoAnterior = tempo;
        ctx.clearRect(0, 0, largura, altura);
        particulas = particulas.filter(p => {
            p.vida -= p.decaimento * delta;
            if (p.vida <= 0) return false;
            p.vy += 540 * delta;
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.cor}, ${p.vida})`;
            ctx.fill();
            return true;
        });
        if (particulas.length) quadroParticulas = requestAnimationFrame(animarParticulas);
        else tempoAnterior = null;
    }

    function invocarExplosao(x, y, cor) {
        if (!ctx || reduzidos || document.hidden || destruido) return;
        // Cliques repetidos reaproveitam o orçamento de partículas mais recentes.
        particulas = particulas.slice(-90);
        for (let i = 0; i < 30; i++) {
            const angulo = Math.random() * Math.PI * 2;
            const velocidade = (Math.random() * 6 + 2) * 60;
            particulas.push({ x, y, cor, vx: Math.cos(angulo) * velocidade,
                vy: Math.sin(angulo) * velocidade, tamanho: Math.random() * 4 + 2,
                vida: 1, decaimento: Math.random() * 1.8 + 0.9 });
        }
        if (quadroParticulas === null) quadroParticulas = requestAnimationFrame(animarParticulas);
    }

    function vincularEfeitoCard(card, wrapper) {
        let quadro = null;
        let rect = null;
        let versao = -1;
        let x = 0;
        let y = 0;
        let removido = false;
        const vinculo = { resetar, agendar };
        const podeMover = () => !reduzidos && !document.hidden && mousePreciso.matches && !removido && !destruido;

        function resetar() {
            if (quadro !== null) cancelAnimationFrame(quadro);
            quadro = null;
            rect = null;
            cardsAtivos.delete(vinculo);
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        }

        function atualizar() {
            quadro = null;
            if (!podeMover() || !wrapper.isConnected) return resetar();
            // O wrapper não gira; sua caixa não muda a cada movimento do mouse.
            if (!rect || versao !== versaoLayout) {
                rect = wrapper.getBoundingClientRect();
                versao = versaoLayout;
            }
            if (!rect.width || !rect.height || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return resetar();
            const localX = x - rect.left;
            const localY = y - rect.top;
            card.style.setProperty('--rotateX', `${((localY / rect.height) * 2 - 1) * -15}deg`);
            card.style.setProperty('--rotateY', `${((localX / rect.width) * 2 - 1) * 15}deg`);
            card.style.setProperty('--mouse-x', `${localX}px`);
            card.style.setProperty('--mouse-y', `${localY}px`);
        }

        function agendar() {
            if (quadro === null) quadro = requestAnimationFrame(atualizar);
        }

        function entrar(evento) {
            if (evento.pointerType !== 'mouse' || !podeMover()) return;
            rect = wrapper.getBoundingClientRect();
            versao = versaoLayout;
            mover(evento);
        }

        function mover(evento) {
            if (evento.pointerType !== 'mouse' || !podeMover()) return;
            x = evento.clientX;
            y = evento.clientY;
            cardsAtivos.add(vinculo);
            agendar();
        }

        wrapper.addEventListener('pointerenter', entrar);
        wrapper.addEventListener('pointermove', mover);
        wrapper.addEventListener('pointerleave', resetar);
        wrapper.addEventListener('pointercancel', resetar);
        const desvincular = () => {
            removido = true;
            resetar();
            wrapper.removeEventListener('pointerenter', entrar);
            wrapper.removeEventListener('pointermove', mover);
            wrapper.removeEventListener('pointerleave', resetar);
            wrapper.removeEventListener('pointercancel', resetar);
            vinculos.delete(desvincular);
        };
        vinculos.add(desvincular);
        return desvincular;
    }

    function invalidarLayout() {
        versaoLayout++;
        cardsAtivos.forEach(vinculo => vinculo.agendar());
    }

    function redimensionar() {
        redimensionarCanvas();
        invalidarLayout();
    }

    function resetarMovimento() {
        cardsAtivos.forEach(vinculo => vinculo.resetar());
        clearTimeout(temporizadorDominio);
        if (btnDominio) btnDominio.style.transform = '';
    }

    function aplicarPreferencia() {
        reduzidos = movimentoReduzido.matches || preferencia === 'reduzidos';
        document.documentElement.dataset.efeitos = reduzidos ? 'reduzidos' : 'ativos';
        if (btnEfeitos) {
            btnEfeitos.disabled = movimentoReduzido.matches;
            btnEfeitos.setAttribute('aria-pressed', String(!reduzidos));
            btnEfeitos.textContent = movimentoReduzido.matches ? 'Efeitos: reduzidos (sistema)' : `Efeitos: ${reduzidos ? 'reduzidos' : 'ativos'}`;
            btnEfeitos.title = movimentoReduzido.matches
                ? 'Movimento reduzido conforme a preferência do seu dispositivo.'
                : `${reduzidos ? 'Ativar' : 'Reduzir'} animações e partículas`;
        }
        if (reduzidos) { limparParticulas(); resetarMovimento(); }
    }

    function alternarEfeitos() {
        if (movimentoReduzido.matches) return;
        preferencia = preferencia === 'ativos' ? 'reduzidos' : 'ativos';
        try { localStorage.setItem(chavePreferencia, preferencia); } catch { /* Preferência vale nesta visita. */ }
        aplicarPreferencia();
    }

    const dominios = [
        { classe: 'normal', nome: 'Cenário normal', icone: '🌀', cor: '89, 0, 179' },
        { classe: 'dominio-gojo', nome: 'Gojo — Vazio Imensurável', icone: '🤞', cor: '0, 191, 255' },
        { classe: 'dominio-sukuna', nome: 'Sukuna — Santuário Malevolente', icone: '⛩️', cor: '139, 0, 0' },
        { classe: 'dominio-higuruma', nome: 'Higuruma — Sentenciamento Mortal', icone: '⚖️', cor: '255, 215, 0' }
    ];
    let dominioAtual = 0;

    function atualizarNomeDominio() {
        if (!btnDominio) return;
        const ativo = dominios[dominioAtual];
        const proximo = dominios[(dominioAtual + 1) % dominios.length];
        btnDominio.textContent = ativo.icone;
        const descricao = `${ativo.nome}. Próximo: ${proximo.nome}.`;
        btnDominio.setAttribute('aria-label', descricao);
        btnDominio.title = descricao;
    }

    function alternarDominio() {
        dominioAtual = (dominioAtual + 1) % dominios.length;
        const ativo = dominios[dominioAtual];
        atualizarNomeDominio();
        cenario?.classList.remove(...dominios.slice(1).map(dominio => dominio.classe));
        if (ativo.classe !== 'normal') cenario?.classList.add(ativo.classe);
        if (!reduzidos && !document.hidden) {
            btnDominio.style.transform = 'scale(1.4)';
            clearTimeout(temporizadorDominio);
            temporizadorDominio = setTimeout(() => { btnDominio.style.transform = ''; }, 200);
            const rect = btnDominio.getBoundingClientRect();
            invocarExplosao(rect.left + rect.width / 2, rect.top + rect.height / 2, ativo.cor);
        }
    }

    function mudarVisibilidade() {
        if (document.hidden) { limparParticulas(); resetarMovimento(); }
    }

    window.addEventListener('resize', redimensionar);
    window.addEventListener('scroll', invalidarLayout, { capture: true, passive: true });
    document.addEventListener('visibilitychange', mudarVisibilidade);
    movimentoReduzido.addEventListener('change', aplicarPreferencia);
    mousePreciso.addEventListener('change', resetarMovimento);
    btnEfeitos?.addEventListener('click', alternarEfeitos);
    btnDominio?.addEventListener('click', alternarDominio);
    redimensionarCanvas();
    aplicarPreferencia();
    atualizarNomeDominio();

    function destruir() {
        destruido = true;
        limparParticulas();
        resetarMovimento();
        vinculos.forEach(desvincular => desvincular());
        window.removeEventListener('resize', redimensionar);
        window.removeEventListener('scroll', invalidarLayout, true);
        document.removeEventListener('visibilitychange', mudarVisibilidade);
        movimentoReduzido.removeEventListener('change', aplicarPreferencia);
        mousePreciso.removeEventListener('change', resetarMovimento);
        btnEfeitos?.removeEventListener('click', alternarEfeitos);
        btnDominio?.removeEventListener('click', alternarDominio);
    }

    return { invocarExplosao, vincularEfeitoCard, destruir };
}


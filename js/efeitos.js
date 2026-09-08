// Partículas, cenários de domínio e interação 3D dos cards.
export function iniciarEfeitos() {
    const canvasVFX = document.getElementById('dominio-vfx');
    const ctxVFX = canvasVFX.getContext('2d');
    let particulasAtivas = [];
    let motorRodando = false;

    function redimensionarCanvas() {
        canvasVFX.width = window.innerWidth;
        canvasVFX.height = window.innerHeight;
    }
    window.addEventListener('resize', redimensionarCanvas);
    redimensionarCanvas();

    class ParticulaEnergia {
        constructor(x, y, corRGB) {
            this.x = x;
            this.y = y;
            const angulo = Math.random() * Math.PI * 2;
            const forcaExplosao = Math.random() * 6 + 2;

            this.vx = Math.cos(angulo) * forcaExplosao;
            this.vy = Math.sin(angulo) * forcaExplosao;

            this.tamanho = Math.random() * 4 + 2;
            this.cor = corRGB;
            this.vida = 1.0;
            this.decaimento = Math.random() * 0.03 + 0.015;
            this.gravidade = 0.15;
        }

        atualizar() {
            this.vy += this.gravidade;
            this.x += this.vx;
            this.y += this.vy;
            this.vida -= this.decaimento;
        }

        desenhar(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.tamanho, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.cor}, ${this.vida})`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(${this.cor}, ${this.vida})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function invocarExplosao(x, y, corAura) {
        for (let i = 0; i < 30; i++) { particulasAtivas.push(new ParticulaEnergia(x, y, corAura)); }
        if (!motorRodando) { motorRodando = true; animarMotorVFX(); }
    }

    function animarMotorVFX() {
        ctxVFX.clearRect(0, 0, canvasVFX.width, canvasVFX.height);
        if (particulasAtivas.length === 0) { motorRodando = false; return; }

        for (let i = particulasAtivas.length - 1; i >= 0; i--) {
            const p = particulasAtivas[i];
            p.atualizar();
            if (p.vida <= 0) particulasAtivas.splice(i, 1);
            else p.desenhar(ctxVFX);
        }
        requestAnimationFrame(animarMotorVFX);
    }

    // --- MÁQUINA DE ESTADOS: SIMULADOR DE DOMÍNIO ---
    const btnDominio = document.getElementById('btn-dominio');
    const cenarioDominio = document.getElementById('cenario-dominio');

    // Matriz de Domínios (Ordem Exata) - MAHITO SUBSTITUÍDO POR HIGURUMA
    const dominiosDisponiveis = [
        { classe: 'normal', icone: '🌀', cor: '89, 0, 179' }, // Reset
        { classe: 'dominio-gojo', icone: '🤞', cor: '0, 191, 255' }, // Vazio Imensurável
        { classe: 'dominio-sukuna', icone: '⛩️', cor: '139, 0, 0' }, // Santuário Malevolente
        { classe: 'dominio-higuruma', icone: '⚖️', cor: '255, 215, 0' }  // Sentenciamento Mortal
    ];
    let dominioAtualIndex = 0;

    if(btnDominio) {
        btnDominio.addEventListener('click', () => {
            dominioAtualIndex++;
            if (dominioAtualIndex >= dominiosDisponiveis.length) {
                dominioAtualIndex = 0;
            }

            const dominioAtivo = dominiosDisponiveis[dominioAtualIndex];

            btnDominio.textContent = dominioAtivo.icone;
            btnDominio.style.transform = 'scale(1.4)';
            setTimeout(() => { btnDominio.style.transform = 'scale(1)'; }, 200);

            cenarioDominio.className = '';
            if (dominioAtivo.classe !== 'normal') {
                cenarioDominio.classList.add(dominioAtivo.classe);
            }

            const rect = btnDominio.getBoundingClientRect();
            invocarExplosao(rect.left + rect.width/2, rect.top + rect.height/2, dominioAtivo.cor);
        });
    }

    function aplicarFisica(card, x, y) {
        const rect = card.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;
        card.style.setProperty('--rotateX', `${rotateX}deg`);
        card.style.setProperty('--rotateY', `${rotateY}deg`);
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    }

    function resetarFisica(card) {
        card.style.setProperty('--rotateX', `0deg`);
        card.style.setProperty('--rotateY', `0deg`);
        card.style.setProperty('--mouse-x', `50%`);
        card.style.setProperty('--mouse-y', `50%`);
    }

    let cardAtivoTouch = null;
    let modoTravado = false;
    let temporizadorTrava = null;
    let posYInicial = 0;

    document.addEventListener('touchstart', (evento) => {
        const touch = evento.touches[0];
        posYInicial = touch.clientY;
        const elementoAlvo = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!elementoAlvo) return;
        const card = elementoAlvo.closest('.card');

        if (card) {
            temporizadorTrava = setTimeout(() => {
                modoTravado = true;
                cardAtivoTouch = card;
                card.classList.add('touch-travado');
                const rect = card.getBoundingClientRect();
                aplicarFisica(card, touch.clientX - rect.left, touch.clientY - rect.top);
            }, 300);
        }
    }, { passive: true });

    document.addEventListener('touchmove', (evento) => {
        if (modoTravado) { evento.preventDefault(); } else {
            const touch = evento.touches[0];
            if (Math.abs(touch.clientY - posYInicial) > 10) clearTimeout(temporizadorTrava);
            return;
        }
        const touch = evento.touches[0];
        const elementoAlvo = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!elementoAlvo) return;
        const card = elementoAlvo.closest('.card');

        if (card) {
            if (cardAtivoTouch && cardAtivoTouch !== card) { resetarFisica(cardAtivoTouch); cardAtivoTouch.classList.remove('touch-travado'); }
            cardAtivoTouch = card;
            card.classList.add('touch-travado');
            const rect = card.getBoundingClientRect();
            aplicarFisica(card, touch.clientX - rect.left, touch.clientY - rect.top);
        } else if (cardAtivoTouch) {
            resetarFisica(cardAtivoTouch);
            cardAtivoTouch.classList.remove('touch-travado');
            cardAtivoTouch = null;
        }
    }, { passive: false });

    function liberarDominoTouch() {
        clearTimeout(temporizadorTrava);
        modoTravado = false;
        if (cardAtivoTouch) { resetarFisica(cardAtivoTouch); cardAtivoTouch.classList.remove('touch-travado'); cardAtivoTouch = null; }
    }
    document.addEventListener('touchend', liberarDominoTouch);
    document.addEventListener('touchcancel', liberarDominoTouch);

    return { invocarExplosao, aplicarFisica, resetarFisica };
}

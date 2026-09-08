// Gráfico visual e valores em texto, disponíveis também por teclado e toque.
export function iniciarRadar() {
    const btnInfoGrafico = document.getElementById('btn-info-grafico');
    const tooltipGrafico = document.getElementById('tooltip-grafico');
    const canvasRadar = document.getElementById('grafico-radar');
    const tooltipPonto = document.getElementById('tooltip-ponto');
    const atributosTexto = document.getElementById('atributos-texto');
    const modal = document.getElementById('modal-personagem');
    const eixos = [
        { chave: 'fis', abreviacao: 'FÍS', nome: 'Físico' },
        { chave: 'vel', abreviacao: 'VEL', nome: 'Velocidade' },
        { chave: 'eng', abreviacao: 'ENG', nome: 'Energia' },
        { chave: 'int', abreviacao: 'INT', nome: 'Inteligência' },
        { chave: 'let', abreviacao: 'LET', nome: 'Letalidade' }
    ];
    let pontosRadar = [];
    let timerTooltipPonto = null;
    let pontoAtivoIndex = -1;

    function fecharTooltip() {
        if (tooltipGrafico) {
            tooltipGrafico.hidden = true;
            tooltipGrafico.classList.remove('ativo');
        }
        if (btnInfoGrafico) {
            btnInfoGrafico.setAttribute('aria-expanded', 'false');
            btnInfoGrafico.classList.remove('ativo');
        }
    }

    function esconderTooltipPonto() {
        clearTimeout(timerTooltipPonto);
        timerTooltipPonto = null;
        pontoAtivoIndex = -1;
        if (!tooltipPonto) return;
        tooltipPonto.classList.remove('ativo');
        tooltipPonto.hidden = true;
        tooltipPonto.textContent = '';
        tooltipPonto.style.removeProperty('left');
        tooltipPonto.style.removeProperty('top');
    }

    function limparRadar() {
        esconderTooltipPonto();
        fecharTooltip();
        pontosRadar = [];
        atributosTexto?.replaceChildren();
        if (canvasRadar) {
            canvasRadar.getContext('2d')?.clearRect(0, 0, canvasRadar.width, canvasRadar.height);
        }
    }

    function desenharGraficoRadar(atributos, corAura) {
        limparRadar();
        const valores = eixos.map(({ chave }) => {
            const valor = Number(atributos?.[chave] ?? 0);
            return Number.isFinite(valor) ? Math.min(100, Math.max(0, valor)) : 0;
        });
        if (atributosTexto) {
            const linhas = eixos.map((eixo, i) => {
                const linha = document.createElement('div');
                const nome = document.createElement('dt');
                nome.textContent = eixo.nome;
                const valor = document.createElement('dd');
                valor.textContent = `${valores[i]} / 100`;
                linha.append(nome, valor);
                return linha;
            });
            atributosTexto.replaceChildren(...linhas);
        }

        const ctx = canvasRadar?.getContext('2d');
        if (!ctx) return;
        const cx = canvasRadar.width / 2;
        const cy = canvasRadar.height / 2;
        const raioMaximo = 100;
        const lados = eixos.length;
        const angulo = i => (Math.PI * 2 * i / lados) - (Math.PI / 2);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let nivel = 1; nivel <= 5; nivel++) {
            const raio = raioMaximo * (nivel / 5);
            ctx.beginPath();
            for (let i = 0; i < lados; i++) {
                const x = cx + Math.cos(angulo(i)) * raio;
                const y = cy + Math.sin(angulo(i)) * raio;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        ctx.beginPath();
        for (let i = 0; i < lados; i++) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angulo(i)) * raioMaximo, cy + Math.sin(angulo(i)) * raioMaximo);
        }
        ctx.stroke();

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Oswald, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < lados; i++) {
            const x = cx + Math.cos(angulo(i)) * (raioMaximo + 25);
            const y = cy + Math.sin(angulo(i)) * (raioMaximo + 20);
            ctx.fillText(eixos[i].abreviacao, x, y);
        }

        ctx.beginPath();
        for (let i = 0; i < lados; i++) {
            const raio = raioMaximo * (valores[i] / 100);
            const x = cx + Math.cos(angulo(i)) * raio;
            const y = cy + Math.sin(angulo(i)) * raio;
            pontosRadar.push({ x, y, valor: valores[i] });
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${corAura}, 0.5)`;
        ctx.fill();
        ctx.strokeStyle = `rgb(${corAura})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgb(${corAura})`;
        ctx.stroke();
        ctx.shadowBlur = 0;

        for (const ponto of pontosRadar) {
            ctx.beginPath();
            ctx.arc(ponto.x, ponto.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.stroke();
        }
    }

    function agendarFechamentoPonto() {
        clearTimeout(timerTooltipPonto);
        timerTooltipPonto = setTimeout(esconderTooltipPonto, 1000);
    }

    function mostrarPonto(evento) {
        if (!canvasRadar || !tooltipPonto || !pontosRadar.length) return;
        const rect = canvasRadar.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const escalaX = canvasRadar.width / rect.width;
        const escalaY = canvasRadar.height / rect.height;
        const x = (evento.clientX - rect.left) * escalaX;
        const y = (evento.clientY - rect.top) * escalaY;
        const indice = pontosRadar.findIndex(ponto => Math.hypot(ponto.x - x, ponto.y - y) < 15);
        if (indice === -1) {
            if (pontoAtivoIndex !== -1) {
                pontoAtivoIndex = -1;
                agendarFechamentoPonto();
            }
            return;
        }
        clearTimeout(timerTooltipPonto);
        timerTooltipPonto = null;
        pontoAtivoIndex = indice;
        const ponto = pontosRadar[indice];
        const containerRect = canvasRadar.closest('.grafico-container').getBoundingClientRect();
        tooltipPonto.textContent = String(ponto.valor);
        tooltipPonto.style.left = `${rect.left - containerRect.left + ponto.x / escalaX}px`;
        tooltipPonto.style.top = `${rect.top - containerRect.top + ponto.y / escalaY}px`;
        tooltipPonto.hidden = false;
        tooltipPonto.classList.add('ativo');
    }

    canvasRadar?.addEventListener('pointermove', evento => {
        if (evento.pointerType !== 'touch') mostrarPonto(evento);
    });
    canvasRadar?.addEventListener('pointerdown', evento => {
        if (evento.pointerType === 'touch') {
            mostrarPonto(evento);
            if (tooltipPonto && !tooltipPonto.hidden) agendarFechamentoPonto();
        }
    });
    canvasRadar?.addEventListener('pointerleave', () => {
        pontoAtivoIndex = -1;
        if (tooltipPonto && !tooltipPonto.hidden) agendarFechamentoPonto();
    });
    canvasRadar?.addEventListener('pointercancel', esconderTooltipPonto);

    // Uma abertura explícita não some enquanto o usuário lê a explicação.
    btnInfoGrafico?.addEventListener('click', () => {
        if (!tooltipGrafico) return;
        const abrir = tooltipGrafico.hidden;
        tooltipGrafico.hidden = !abrir;
        tooltipGrafico.classList.toggle('ativo', abrir);
        btnInfoGrafico.classList.toggle('ativo', abrir);
        btnInfoGrafico.setAttribute('aria-expanded', String(abrir));
    });
    document.addEventListener('click', evento => {
        if (tooltipGrafico && !tooltipGrafico.hidden &&
            !tooltipGrafico.contains(evento.target) && !btnInfoGrafico?.contains(evento.target)) fecharTooltip();
    });
    document.addEventListener('focusin', evento => {
        if (tooltipGrafico && !tooltipGrafico.hidden &&
            !tooltipGrafico.contains(evento.target) && !btnInfoGrafico?.contains(evento.target)) fecharTooltip();
    });
    modal?.addEventListener('cancel', evento => {
        if (tooltipGrafico && !tooltipGrafico.hidden) {
            evento.preventDefault();
            fecharTooltip();
        }
    });
    limparRadar();
    return { desenharGraficoRadar, limparRadar };
}

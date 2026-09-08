// Gráfico de atributos e suas dicas de leitura.
export function iniciarRadar() {
    const btnInfoGrafico = document.getElementById('btn-info-grafico');
    const tooltipGrafico = document.getElementById('tooltip-grafico');
    const canvasRadar = document.getElementById('grafico-radar');
    const tooltipPonto = document.getElementById('tooltip-ponto');

    // --- MOTOR GRÁFICO DO PENTÁGONO (RADAR CHART) ---
    let pontosRadar = [];

    function desenharGraficoRadar(atributos, corAura) {
        const canvas = document.getElementById('grafico-radar');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pontosRadar = [];

        const cw = canvas.width;
        const ch = canvas.height;
        const cx = cw / 2;
        const cy = ch / 2;
        const raioMaximo = 100;

        const labels = ['FÍS', 'VEL', 'ENG', 'INT', 'LET'];
        const vals = atributos ? [atributos.fis, atributos.vel, atributos.eng, atributos.int, atributos.let] : [0,0,0,0,0];
        const lados = 5;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let nivel = 1; nivel <= 5; nivel++) {
            const r = raioMaximo * (nivel / 5);
            ctx.beginPath();
            for (let i = 0; i < lados; i++) {
                const angle = (Math.PI * 2 * i / lados) - (Math.PI / 2);
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        ctx.beginPath();
        for (let i = 0; i < lados; i++) {
            const angle = (Math.PI * 2 * i / lados) - (Math.PI / 2);
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * raioMaximo, cy + Math.sin(angle) * raioMaximo);
        }
        ctx.stroke();

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Oswald, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < lados; i++) {
            const angle = (Math.PI * 2 * i / lados) - (Math.PI / 2);
            const x = cx + Math.cos(angle) * (raioMaximo + 25);
            const y = cy + Math.sin(angle) * (raioMaximo + 20);
            ctx.fillText(labels[i], x, y);
        }

        ctx.beginPath();
        for (let i = 0; i < lados; i++) {
            const angle = (Math.PI * 2 * i / lados) - (Math.PI / 2);
            const r = raioMaximo * ((vals[i] || 0) / 100);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            pontosRadar.push({ x: x, y: y, valor: vals[i] || 0 });

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

        for (let i = 0; i < pontosRadar.length; i++) {
            ctx.beginPath();
            ctx.arc(pontosRadar[i].x, pontosRadar[i].y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.stroke();
        }
    }

    // --- MOTOR MATEMÁTICO: BALÃO DE NÚMEROS NOS PONTOS ---
    let timerTooltipPonto = null;
    let pontoAtivoIndex = -1;

    if (canvasRadar && tooltipPonto) {
        canvasRadar.addEventListener('mousemove', (e) => {
            const rect = canvasRadar.getBoundingClientRect();
            const scaleX = canvasRadar.width / rect.width;
            const scaleY = canvasRadar.height / rect.height;

            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            let achouColisao = false;

            for (let i = 0; i < pontosRadar.length; i++) {
                const p = pontosRadar[i];
                const distancia = Math.hypot(p.x - mouseX, p.y - mouseY);

                if (distancia < 15) {
                    achouColisao = true;
                    if (pontoAtivoIndex !== i) {
                        pontoAtivoIndex = i;
                        abrirTooltipPonto(p.valor, p.x / scaleX, p.y / scaleY, rect);
                    }
                    break;
                }
            }

            if (!achouColisao && pontoAtivoIndex !== -1) {
                pontoAtivoIndex = -1;
                iniciarContagemPonto();
            }
        });

        canvasRadar.addEventListener('mouseleave', () => {
            pontoAtivoIndex = -1;
            iniciarContagemPonto();
        });
    }

    function abrirTooltipPonto(valor, visualX, visualY, canvasRect) {
        clearTimeout(timerTooltipPonto);
        tooltipPonto.textContent = valor;
        tooltipPonto.classList.add('ativo');

        const containerRect = document.querySelector('.grafico-container').getBoundingClientRect();
        const posX = (canvasRect.left - containerRect.left) + visualX;
        const posY = (canvasRect.top - containerRect.top) + visualY;

        tooltipPonto.style.left = `${posX}px`;
        tooltipPonto.style.top = `${posY}px`;
    }

    function iniciarContagemPonto() {
        clearTimeout(timerTooltipPonto);
        timerTooltipPonto = setTimeout(() => {
            tooltipPonto.classList.remove('ativo');
        }, 1000);
    }


    // --- LÓGICA DA TOOLTIP DE EXPLICAÇÃO ---
    let timerTooltip;

    function abrirTooltip() {
        if(!tooltipGrafico || !btnInfoGrafico) return;
        tooltipGrafico.classList.add('ativo');
        btnInfoGrafico.classList.add('ativo');
    }

    function fecharTooltip() {
        if(!tooltipGrafico || !btnInfoGrafico) return;
        tooltipGrafico.classList.remove('ativo');
        btnInfoGrafico.classList.remove('ativo');
    }

    function agendarFechamento() {
        clearTimeout(timerTooltip);
        timerTooltip = setTimeout(() => { fecharTooltip(); }, 3000);
    }

    function cancelarFechamento() { clearTimeout(timerTooltip); }

    if (btnInfoGrafico) {
        btnInfoGrafico.addEventListener('mouseenter', () => { abrirTooltip(); cancelarFechamento(); });
        btnInfoGrafico.addEventListener('mouseleave', () => { agendarFechamento(); });
        btnInfoGrafico.addEventListener('click', (e) => {
            e.stopPropagation();
            if (tooltipGrafico.classList.contains('ativo')) fecharTooltip();
            else { abrirTooltip(); agendarFechamento(); }
        });
    }

    if (tooltipGrafico) {
        tooltipGrafico.addEventListener('mouseenter', () => { cancelarFechamento(); });
        tooltipGrafico.addEventListener('mouseleave', () => { agendarFechamento(); });
    }

    document.addEventListener('click', (e) => {
        if (tooltipGrafico && btnInfoGrafico) {
            if (tooltipGrafico.classList.contains('ativo') && !tooltipGrafico.contains(e.target) && e.target !== btnInfoGrafico) {
                fecharTooltip();
            }
        }
    });

    return { desenharGraficoRadar, fecharTooltip };
}

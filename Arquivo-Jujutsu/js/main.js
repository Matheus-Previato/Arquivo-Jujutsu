// --- 1. MOTOR DE PARTÍCULAS E GRÁFICO (CANVAS API) ---
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

// --- 2. SELEÇÃO DE ELEMENTOS DO DOM ---
const gridPersonagens = document.getElementById('grid-personagens');
const modal = document.getElementById('modal-personagem');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const inputBusca = document.getElementById('busca-personagem'); 
const btnSelarModal = document.getElementById('btn-selar-modal');

// Elementos das Notificações
const btnInfoGrafico = document.getElementById('btn-info-grafico');
const tooltipGrafico = document.getElementById('tooltip-grafico');
const canvasRadar = document.getElementById('grafico-radar');
const tooltipPonto = document.getElementById('tooltip-ponto');

const modalNome = document.getElementById('modal-nome');
const modalClasse = document.getElementById('modal-classe');
const modalDescricao = document.getElementById('modal-descricao');
const containerImagemModal = document.querySelector('.modal-imagem-placeholder'); 

let bancoDeDadosPersonagens = [];
let feiticeirosSelados = JSON.parse(localStorage.getItem('jjk_selados')) || [];
let personagemAtualModal = null; 

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


// --- LÓGICA DO MENU CUSTOMIZADO ---
const selectWrapper = document.querySelector('.custom-select-wrapper');
const selectTrigger = document.querySelector('.custom-select-trigger');
const textoFiltro = document.getElementById('filtro-texto');
const opcoesFiltro = document.querySelectorAll('.custom-select-options li');
let filtroTipoAtual = 'todos';

if (selectWrapper) {
    selectWrapper.addEventListener('click', () => { selectWrapper.classList.toggle('open'); });
    document.addEventListener('click', (evento) => { if (!selectWrapper.contains(evento.target)) { selectWrapper.classList.remove('open'); } });
}

opcoesFiltro.forEach(opcao => {
    opcao.addEventListener('click', (e) => {
        opcoesFiltro.forEach(opt => opt.classList.remove('selected'));
        opcao.classList.add('selected');
        if(textoFiltro) textoFiltro.textContent = opcao.textContent;
        filtroTipoAtual = opcao.getAttribute('data-value');
        aplicarFiltros();
    });
});

// --- 3. COMUNICAÇÃO COM API ---
async function invocarFeiticeiros() {
    try {
        const resposta = await fetch('./data/personagens.json');
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
        bancoDeDadosPersonagens = await resposta.json();
        lerURL(); 
    } catch (erro) {
        if(gridPersonagens) gridPersonagens.innerHTML = `<p style="color:red; text-align:center;">Erro na invocação do JSON.</p>`;
    }
}

function atualizarURL(busca, tipo) {
    const url = new URL(window.location);
    if (busca) url.searchParams.set('busca', busca); else url.searchParams.delete('busca');
    if (tipo && tipo !== 'todos') url.searchParams.set('tipo', tipo); else url.searchParams.delete('tipo');
    window.history.replaceState({}, '', url);
}

function lerURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const busca = urlParams.get('busca');
    const tipo = urlParams.get('tipo');

    if (busca && inputBusca) inputBusca.value = busca;
    if (tipo) {
        const opcaoEncontrada = Array.from(opcoesFiltro).find(opt => opt.getAttribute('data-value') === tipo);
        if (opcaoEncontrada) {
            opcoesFiltro.forEach(opt => opt.classList.remove('selected'));
            opcaoEncontrada.classList.add('selected');
            if(textoFiltro) textoFiltro.textContent = opcaoEncontrada.textContent;
            filtroTipoAtual = tipo;
        }
    }
    aplicarFiltros(); 
}

// --- 4. RENDERIZAÇÃO ---
function renderizarCards(listaDePersonagens) {
    if (!gridPersonagens) return;
    gridPersonagens.innerHTML = "";

    if (listaDePersonagens.length === 0) {
        gridPersonagens.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #ccc;">Nenhum personagem condiz com os filtros.</p>`;
        return; 
    }

    listaDePersonagens.forEach((personagem, index) => {
        const wrapperCard = document.createElement('div');
        wrapperCard.classList.add('card-wrapper');
        wrapperCard.style.animationDelay = `${index * 50}ms`; 
        
        const card = document.createElement('article');
        card.classList.add('card');
        card.setAttribute('tabindex', '0');
        
        const corAura = personagem.corAura || "89, 0, 179";
        card.style.setProperty('--cor-aura', corAura);
        
        let elementoVisual = `<span>${personagem.imgPlaceholder}</span>`;
        let temImagem = false;

        if (personagem.imagem) {
            temImagem = true;
            elementoVisual = `<img src="${personagem.imagem}" alt="${personagem.nome}" class="card-img" loading="lazy" onload="this.parentElement.classList.remove('skeleton')" onerror="this.onerror=null; this.parentElement.classList.remove('skeleton'); this.outerHTML='<span>${personagem.imgPlaceholder}</span>';">`;
        }
        
        const badgeHibridaClass = personagem.tipo === 'anomalia' ? 'hibrida' : '';
        const conteudoBadge = personagem.tipo === 'anomalia' ? `<span class="texto-hibrido">${personagem.classe}</span>` : personagem.classe;
        
        card.innerHTML = `
            <div class="card-imagem-placeholder ${temImagem ? 'skeleton' : ''}">
                ${elementoVisual}
            </div>
            <div class="card-info">
                <span class="badge ${personagem.tipo} ${badgeHibridaClass}">${conteudoBadge}</span>
                <h3>${personagem.nome}</h3>
            </div>
        `;

        const btnSelo = document.createElement('button');
        btnSelo.classList.add('btn-selo');
        btnSelo.innerHTML = '封'; 
        btnSelo.setAttribute('title', 'Selar Personagem');
        if (feiticeirosSelados.includes(personagem.id)) btnSelo.classList.add('ativo');

        btnSelo.addEventListener('click', (evento) => {
            evento.stopPropagation(); 
            const rect = btnSelo.getBoundingClientRect();
            const centroX = rect.left + (rect.width / 2);
            const centroY = rect.top + (rect.height / 2);
            alternarSeloGlobal(personagem.id);
            invocarExplosao(centroX, centroY, corAura);
        });

        card.appendChild(btnSelo);
        card.addEventListener('click', () => abrirModal(personagem));
        card.addEventListener('keydown', (evento) => { if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); abrirModal(personagem); } });
        card.addEventListener('mousemove', (evento) => { const rect = card.getBoundingClientRect(); aplicarFisica(card, evento.clientX - rect.left, evento.clientY - rect.top); });
        card.addEventListener('mouseleave', () => resetarFisica(card));

        wrapperCard.appendChild(card);
        gridPersonagens.appendChild(wrapperCard);
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

function alternarSeloGlobal(idPersonagem) {
    const index = feiticeirosSelados.indexOf(idPersonagem);
    if (index > -1) {
        feiticeirosSelados.splice(index, 1);
    } else {
        feiticeirosSelados.push(idPersonagem);
    }
    localStorage.setItem('jjk_selados', JSON.stringify(feiticeirosSelados));
    
    if (personagemAtualModal && personagemAtualModal.id === idPersonagem) {
        if (feiticeirosSelados.includes(idPersonagem)) {
            if(btnSelarModal) btnSelarModal.classList.add('ativo');
        } else {
            if(btnSelarModal) btnSelarModal.classList.remove('ativo');
        }
    }
    aplicarFiltros();
}

function aplicarFiltros() {
    if (!inputBusca) return;
    const termoBusca = inputBusca.value.toLowerCase();
    atualizarURL(termoBusca, filtroTipoAtual);

    const personagensFiltrados = bancoDeDadosPersonagens.filter(personagem => {
        const nomeBate = personagem.nome.toLowerCase().includes(termoBusca);
        const classeBate = personagem.classe.toLowerCase().includes(termoBusca);
        const passouNoTexto = nomeBate || classeBate;
        let passouNoTipo = false;
        
        if (filtroTipoAtual === 'todos') passouNoTipo = true;
        else if (filtroTipoAtual === 'feiticeiro') passouNoTipo = personagem.tipo === 'feiticeiro';
        else if (filtroTipoAtual === 'maldicao') passouNoTipo = personagem.tipo === 'maldicao';
        else if (filtroTipoAtual === 'outro') passouNoTipo = personagem.tipo !== 'feiticeiro' && personagem.tipo !== 'maldicao';
        else if (filtroTipoAtual === 'favoritos') passouNoTipo = feiticeirosSelados.includes(personagem.id);

        return passouNoTexto && passouNoTipo; 
    });

    renderizarCards(personagensFiltrados);
}

const buscarComCooldown = debounce(aplicarFiltros, 300);
if(inputBusca) inputBusca.addEventListener('input', buscarComCooldown); 

function debounce(funcao, tempoEspera) {
    let temporizador;
    return function(...argumentos) { clearTimeout(temporizador); temporizador = setTimeout(() => { funcao.apply(this, argumentos); }, tempoEspera); };
}

// --- 5. MODAL E EVENTOS ---
function abrirModal(personagem) {
    personagemAtualModal = personagem; 

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
        if (feiticeirosSelados.includes(personagem.id)) {
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
    personagemAtualModal = null; 
    fecharTooltip(); 
    if(tooltipPonto) tooltipPonto.classList.remove('ativo'); 
}

if(btnSelarModal) {
    btnSelarModal.addEventListener('click', () => {
        if (!personagemAtualModal) return;
        const rect = btnSelarModal.getBoundingClientRect();
        const centroX = rect.left + (rect.width / 2);
        const centroY = rect.top + (rect.height / 2);

        alternarSeloGlobal(personagemAtualModal.id);
        invocarExplosao(centroX, centroY, personagemAtualModal.corAura || "89, 0, 179");
    });
}

if(btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);
if(modal) {
    modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
    document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape' && modal.classList.contains('ativo')) fecharModal(); });
}

invocarFeiticeiros();
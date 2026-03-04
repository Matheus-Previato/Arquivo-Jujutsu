// --- 1. SELEÇÃO DE ELEMENTOS DO DOM ---
const gridPersonagens = document.getElementById('grid-personagens');
const modal = document.getElementById('modal-personagem');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const inputBusca = document.getElementById('busca-personagem'); 

const modalNome = document.getElementById('modal-nome');
const modalClasse = document.getElementById('modal-classe');
const modalDescricao = document.getElementById('modal-descricao');
const containerImagemModal = document.querySelector('.modal-imagem-placeholder'); 

let bancoDeDadosPersonagens = [];
let feiticeirosSelados = JSON.parse(localStorage.getItem('jjk_selados')) || [];

// --- LÓGICA DO NOVO MENU CUSTOMIZADO ---
const selectWrapper = document.querySelector('.custom-select-wrapper');
const selectTrigger = document.querySelector('.custom-select-trigger');
const textoFiltro = document.getElementById('filtro-texto');
const opcoesFiltro = document.querySelectorAll('.custom-select-options li');
let filtroTipoAtual = 'todos';

// Abre/Fecha o menu ao clicar
selectWrapper.addEventListener('click', () => {
    selectWrapper.classList.toggle('open');
});

// Fecha o menu se clicar fora dele
document.addEventListener('click', (evento) => {
    if (!selectWrapper.contains(evento.target)) {
        selectWrapper.classList.remove('open');
    }
});

// Lida com o clique nas opções do menu
opcoesFiltro.forEach(opcao => {
    opcao.addEventListener('click', (e) => {
        opcoesFiltro.forEach(opt => opt.classList.remove('selected'));
        opcao.classList.add('selected');
        textoFiltro.textContent = opcao.textContent;
        filtroTipoAtual = opcao.getAttribute('data-value');
        aplicarFiltros();
    });
});


// --- 2. COMUNICAÇÃO COM A NOSSA "API" LOCAL ---
async function invocarFeiticeiros() {
    try {
        const resposta = await fetch('./data/personagens.json');
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        bancoDeDadosPersonagens = await resposta.json();
        lerURL(); 
        console.log("Domínio Expandido: JS carregado com sucesso!");
    } catch (erro) {
        console.error("Falha ao invocar os feiticeiros:", erro);
        gridPersonagens.innerHTML = `<p style="color:red; text-align:center;">Erro na invocação do JSON.</p>`;
    }
}

// --- DEEP LINKING ---
function atualizarURL(busca, tipo) {
    const url = new URL(window.location);
    if (busca) url.searchParams.set('busca', busca);
    else url.searchParams.delete('busca');

    if (tipo && tipo !== 'todos') url.searchParams.set('tipo', tipo);
    else url.searchParams.delete('tipo');

    window.history.replaceState({}, '', url);
}

function lerURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const busca = urlParams.get('busca');
    const tipo = urlParams.get('tipo');

    if (busca) inputBusca.value = busca;
    if (tipo) {
        const opcaoEncontrada = Array.from(opcoesFiltro).find(opt => opt.getAttribute('data-value') === tipo);
        if (opcaoEncontrada) {
            opcoesFiltro.forEach(opt => opt.classList.remove('selected'));
            opcaoEncontrada.classList.add('selected');
            textoFiltro.textContent = opcaoEncontrada.textContent;
            filtroTipoAtual = tipo;
        }
    }
    aplicarFiltros(); 
}

// --- 3. RENDERIZAÇÃO ---
function renderizarCards(listaDePersonagens) {
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
        
        card.style.setProperty('--cor-aura', personagem.corAura || "89, 0, 179");
        
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
            alternarSelo(personagem.id, btnSelo);
        });

        card.appendChild(btnSelo);

        card.addEventListener('click', () => abrirModal(personagem));
        card.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault(); 
                abrirModal(personagem);
            }
        });

        // Física no Desktop
        card.addEventListener('mousemove', (evento) => {
            const rect = card.getBoundingClientRect();
            aplicarFisica(card, evento.clientX - rect.left, evento.clientY - rect.top);
        });
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

// --- RASTREADOR DE ENERGIA TOUCH (Com trava de Scroll após 300ms) ---
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
        // Inicia contagem: se segurar por 300ms, trava a tela para rodar a animação
        temporizadorTrava = setTimeout(() => {
            modoTravado = true;
            cardAtivoTouch = card;
            card.classList.add('touch-travado'); // Dá o brilho
            
            const rect = card.getBoundingClientRect();
            aplicarFisica(card, touch.clientX - rect.left, touch.clientY - rect.top);
        }, 300); 
    }
}, { passive: true });

document.addEventListener('touchmove', (evento) => {
    if (modoTravado) {
        // A MÁGICA AQUI: O Dedo segurou o card? A tela para de rolar e vira um mouse 3D.
        evento.preventDefault(); 
    } else {
        // Se o dedo moveu rápido antes dos 300ms, ele quer rolar a tela. Cancela a armadilha 3D!
        const touch = evento.touches[0];
        if (Math.abs(touch.clientY - posYInicial) > 10) {
            clearTimeout(temporizadorTrava);
        }
        return; // Sai daqui para deixar a tela rolar normalmente
    }

    const touch = evento.touches[0];
    const elementoAlvo = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elementoAlvo) return;
    const card = elementoAlvo.closest('.card');

    if (card) {
        if (cardAtivoTouch && cardAtivoTouch !== card) {
            resetarFisica(cardAtivoTouch);
            cardAtivoTouch.classList.remove('touch-travado');
        }
        cardAtivoTouch = card;
        card.classList.add('touch-travado');

        const rect = card.getBoundingClientRect();
        aplicarFisica(card, touch.clientX - rect.left, touch.clientY - rect.top);
    } else if (cardAtivoTouch) {
        resetarFisica(cardAtivoTouch);
        cardAtivoTouch.classList.remove('touch-travado');
        cardAtivoTouch = null;
    }
}, { passive: false }); // PRECISA SER FALSE para o evento.preventDefault funcionar!

function liberarDominoTouch() {
    clearTimeout(temporizadorTrava);
    modoTravado = false;
    if (cardAtivoTouch) {
        resetarFisica(cardAtivoTouch);
        cardAtivoTouch.classList.remove('touch-travado');
        cardAtivoTouch = null;
    }
}
document.addEventListener('touchend', liberarDominoTouch);
document.addEventListener('touchcancel', liberarDominoTouch);


function alternarSelo(idPersonagem, botaoElemento) {
    const index = feiticeirosSelados.indexOf(idPersonagem);
    if (index > -1) {
        feiticeirosSelados.splice(index, 1);
        botaoElemento.classList.remove('ativo');
    } else {
        feiticeirosSelados.push(idPersonagem);
        botaoElemento.classList.add('ativo');
    }
    localStorage.setItem('jjk_selados', JSON.stringify(feiticeirosSelados));
    if (filtroTipoAtual === 'favoritos') aplicarFiltros();
}

function aplicarFiltros() {
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
inputBusca.addEventListener('input', buscarComCooldown); 

function debounce(funcao, tempoEspera) {
    let temporizador;
    return function(...argumentos) {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => { funcao.apply(this, argumentos); }, tempoEspera);
    };
}

// --- 4. MODAL ---
function abrirModal(personagem) {
    modalNome.textContent = personagem.nome;
    modalNome.className = ''; 
    modalClasse.className = `badge ${personagem.tipo}`;
    
    if(personagem.tipo === 'anomalia') modalClasse.innerHTML = `<span class="texto-hibrido">${personagem.classe}</span>`;
    else modalClasse.textContent = personagem.classe;
    
    modalDescricao.textContent = personagem.descricao;
    
    if (personagem.imagem) {
        containerImagemModal.innerHTML = `<img src="${personagem.imagem}" alt="${personagem.nome}" class="modal-img-real" loading="lazy" onerror="this.onerror=null; this.outerHTML='<span id=\\'modal-img-texto\\'>${personagem.imgPlaceholder}</span>'; document.querySelector('.modal-imagem-placeholder').style.background = 'linear-gradient(45deg, #111, #222)';">`;
        containerImagemModal.style.background = "transparent";
        containerImagemModal.style.border = "none";
    } else {
        containerImagemModal.innerHTML = `<span id="modal-img-texto">${personagem.imgPlaceholder}</span>`;
        containerImagemModal.style.background = "linear-gradient(45deg, #111, #222)";
        containerImagemModal.style.border = "1px solid #333";
    }
    
    modal.classList.add('ativo');
    btnFecharModal.focus(); 
}

function fecharModal() { modal.classList.remove('ativo'); }

btnFecharModal.addEventListener('click', fecharModal);
modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape' && modal.classList.contains('ativo')) fecharModal(); });

invocarFeiticeiros();
// --- 1. SELEÇÃO DE ELEMENTOS DO DOM ---
const gridPersonagens = document.getElementById('grid-personagens');
const modal = document.getElementById('modal-personagem');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const inputBusca = document.getElementById('busca-personagem'); 
const selectFiltro = document.getElementById('filtro-tipo'); 

const modalNome = document.getElementById('modal-nome');
const modalClasse = document.getElementById('modal-classe');
const modalDescricao = document.getElementById('modal-descricao');
const containerImagemModal = document.querySelector('.modal-imagem-placeholder'); 

let bancoDeDadosPersonagens = [];

// --- SISTEMA DE SELAMENTO (LOCAL STORAGE) ---
let feiticeirosSelados = JSON.parse(localStorage.getItem('jjk_selados')) || [];

// --- 2. COMUNICAÇÃO COM A NOSSA "API" LOCAL ---
async function invocarFeiticeiros() {
    try {
        const resposta = await fetch('./data/personagens.json');
        
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        bancoDeDadosPersonagens = await resposta.json();
        
        // A MÁGICA INICIAL: Em vez de desenhar tudo, o sistema lê a URL primeiro para ver se tem filtros salvos
        lerURL(); 
        
        console.log("Domínio Expandido: JSON e URLs sincronizados com sucesso!");

    } catch (erro) {
        console.error("Falha ao invocar os feiticeiros:", erro);
        gridPersonagens.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--accent-color); padding: 2rem;">
                <h2>Erro na Invocação</h2>
                <p>Não foi possível ler o arquivo JSON.</p>
            </div>
        `;
    }
}

// --- DEEP LINKING (SINCRONIZAÇÃO DE ROTEAMENTO) ---
function atualizarURL(busca, tipo) {
    const url = new URL(window.location);
    
    // Se o usuário digitou algo, coloca na URL. Se apagou, limpa da URL.
    if (busca) {
        url.searchParams.set('busca', busca);
    } else {
        url.searchParams.delete('busca');
    }

    // Se o usuário filtrou algo diferente de 'todos', coloca na URL.
    if (tipo && tipo !== 'todos') {
        url.searchParams.set('tipo', tipo);
    } else {
        url.searchParams.delete('tipo');
    }

    // Altera a URL no navegador sem recarregar a página
    window.history.replaceState({}, '', url);
}

function lerURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const busca = urlParams.get('busca');
    const tipo = urlParams.get('tipo');

    // Preenche o HTML visualmente com o que estava na URL
    if (busca) inputBusca.value = busca;
    if (tipo) {
        // Verifica se a opção digitada maliciosamente na URL realmente existe no nosso select
        const opcaoExiste = Array.from(selectFiltro.options).some(opt => opt.value === tipo);
        if(opcaoExiste) selectFiltro.value = tipo;
    }

    // Chama o filtro mestre para rodar a lógica (que por padrão, se estiver tudo vazio, mostra todos)
    aplicarFiltros(); 
}

// --- 3. FUNÇÕES DE RENDERIZAÇÃO E FILTRO ---
function renderizarCards(listaDePersonagens) {
    gridPersonagens.innerHTML = "";

    if (listaDePersonagens.length === 0) {
        gridPersonagens.innerHTML = `
            <p style="grid-column: 1 / -1; text-align: center; color: #ccc; font-size: 1.2rem;">
                Nenhum personagem condiz com os filtros atuais.
            </p>`;
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
            elementoVisual = `<img 
                src="${personagem.imagem}" 
                alt="${personagem.nome}" 
                class="card-img" 
                loading="lazy" 
                onload="this.parentElement.classList.remove('skeleton')"
                onerror="this.onerror=null; this.parentElement.classList.remove('skeleton'); this.outerHTML='<span>${personagem.imgPlaceholder}</span>';"
            >`;
        }
        
        const badgeHibridaClass = personagem.tipo === 'anomalia' ? 'hibrida' : '';
        const conteudoBadge = personagem.tipo === 'anomalia' 
            ? `<span class="texto-hibrido">${personagem.classe}</span>` 
            : personagem.classe;
        
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
        btnSelo.setAttribute('aria-label', 'Selar Personagem');
        
        if (feiticeirosSelados.includes(personagem.id)) {
            btnSelo.classList.add('ativo');
        }

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

        card.addEventListener('mousemove', (evento) => {
            const rect = card.getBoundingClientRect();
            const x = evento.clientX - rect.left;
            const y = evento.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -15; 
            const rotateY = ((x - centerX) / centerX) * 15;

            card.style.setProperty('--rotateX', `${rotateX}deg`);
            card.style.setProperty('--rotateY', `${rotateY}deg`);
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--rotateX', `0deg`);
            card.style.setProperty('--rotateY', `0deg`);
            card.style.setProperty('--mouse-x', `50%`);
            card.style.setProperty('--mouse-y', `50%`);
        });

        wrapperCard.appendChild(card);
        gridPersonagens.appendChild(wrapperCard);
    });
}

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

    if (selectFiltro.value === 'favoritos') {
        aplicarFiltros();
    }
}

function aplicarFiltros() {
    const termoBusca = inputBusca.value.toLowerCase();
    const tipoFiltro = selectFiltro.value;

    // Atualiza a barra de endereço instantaneamente
    atualizarURL(termoBusca, tipoFiltro);

    const personagensFiltrados = bancoDeDadosPersonagens.filter(personagem => {
        const nomeBate = personagem.nome.toLowerCase().includes(termoBusca);
        const classeBate = personagem.classe.toLowerCase().includes(termoBusca);
        const passouNoTexto = nomeBate || classeBate;

        let passouNoTipo = false;
        
        if (tipoFiltro === 'todos') {
            passouNoTipo = true;
        } else if (tipoFiltro === 'feiticeiro') {
            passouNoTipo = personagem.tipo === 'feiticeiro';
        } else if (tipoFiltro === 'maldicao') {
            passouNoTipo = personagem.tipo === 'maldicao';
        } else if (tipoFiltro === 'outro') {
            passouNoTipo = personagem.tipo !== 'feiticeiro' && personagem.tipo !== 'maldicao';
        } else if (tipoFiltro === 'favoritos') {
            passouNoTipo = feiticeirosSelados.includes(personagem.id);
        }

        return passouNoTexto && passouNoTipo; 
    });

    renderizarCards(personagensFiltrados);
}

function debounce(funcao, tempoEspera) {
    let temporizador;
    return function(...argumentos) {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            funcao.apply(this, argumentos); 
        }, tempoEspera);
    };
}
const buscarComCooldown = debounce(aplicarFiltros, 300);

inputBusca.addEventListener('input', buscarComCooldown); 
selectFiltro.addEventListener('change', aplicarFiltros); 

// --- 4. LÓGICA DO MODAL ---
function abrirModal(personagem) {
    modalNome.textContent = personagem.nome;
    modalNome.className = ''; 
    
    modalClasse.className = `badge ${personagem.tipo}`;
    
    if(personagem.tipo === 'anomalia') {
        modalClasse.innerHTML = `<span class="texto-hibrido">${personagem.classe}</span>`;
    } else {
        modalClasse.textContent = personagem.classe;
    }
    
    modalDescricao.textContent = personagem.descricao;
    
    if (personagem.imagem) {
        containerImagemModal.innerHTML = `<img 
            src="${personagem.imagem}" 
            alt="${personagem.nome}" 
            class="modal-img-real" 
            loading="lazy"
            onerror="this.onerror=null; this.outerHTML='<span id=\\'modal-img-texto\\'>${personagem.imgPlaceholder}</span>'; document.querySelector('.modal-imagem-placeholder').style.background = 'linear-gradient(45deg, #111, #222)';"
        >`;
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

function fecharModal() {
    modal.classList.remove('ativo');
}

btnFecharModal.addEventListener('click', fecharModal);

modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
});

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && modal.classList.contains('ativo')) fecharModal();
});

invocarFeiticeiros();
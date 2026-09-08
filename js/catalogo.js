// Carregamento dos personagens, busca, filtros, URL e criação dos cards.
export function criarCatalogo({ estado, abrirModal, alternarSeloGlobal, invocarExplosao, aplicarFisica, resetarFisica }) {
    const gridPersonagens = document.getElementById('grid-personagens');
    const inputBusca = document.getElementById('busca-personagem');

    // --- LÓGICA DO MENU CUSTOMIZADO ---
    const selectWrapper = document.querySelector('.custom-select-wrapper');
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
            estado.bancoDeDadosPersonagens = await resposta.json();
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
            if (estado.feiticeirosSelados.includes(personagem.id)) btnSelo.classList.add('ativo');

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

    function aplicarFiltros() {
        if (!inputBusca) return;
        const termoBusca = inputBusca.value.toLowerCase();
        atualizarURL(termoBusca, filtroTipoAtual);

        const personagensFiltrados = estado.bancoDeDadosPersonagens.filter(personagem => {
            const nomeBate = personagem.nome.toLowerCase().includes(termoBusca);
            const classeBate = personagem.classe.toLowerCase().includes(termoBusca);
            const passouNoTexto = nomeBate || classeBate;
            let passouNoTipo = false;

            if (filtroTipoAtual === 'todos') passouNoTipo = true;
            else if (filtroTipoAtual === 'feiticeiro') passouNoTipo = personagem.tipo === 'feiticeiro';
            else if (filtroTipoAtual === 'maldicao') passouNoTipo = personagem.tipo === 'maldicao';
            else if (filtroTipoAtual === 'outro') passouNoTipo = personagem.tipo !== 'feiticeiro' && personagem.tipo !== 'maldicao';
            else if (filtroTipoAtual === 'favoritos') passouNoTipo = estado.feiticeirosSelados.includes(personagem.id);

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

    return { invocarFeiticeiros, aplicarFiltros };
}

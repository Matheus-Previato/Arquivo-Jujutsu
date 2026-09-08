import { validarPersonagens, filtrarPersonagens } from './dados.js';
import { preencherImagemPersonagem } from './imagens.js';
import { atualizarBotaoFavorito } from './favoritos.js';
import { obterVersao, criarSeletorVersoes } from './versoes.js';

export function criarCatalogo({ estado, abrirModal, alternarSeloGlobal, sincronizarFavoritos, invocarExplosao, vincularEfeitoCard }) {
    const grid = document.getElementById('grid-personagens');
    const busca = document.getElementById('busca-personagem');
    const filtro = document.getElementById('filtro-tipo');
    const resultado = document.getElementById('resultado-busca');
    const statusFavoritos = document.getElementById('status-favoritos');
    const cards = new Map();
    let carregando = false;
    let erroCarregamento = false;
    let timerBusca;

    function mostrarMensagem(texto, tentarNovamente = false) {
        const mensagem = document.createElement('div');
        mensagem.className = 'mensagem-catalogo';
        const paragrafo = document.createElement('p');
        paragrafo.textContent = texto;
        mensagem.append(paragrafo);
        if (tentarNovamente) {
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'btn-tentar-novamente';
            botao.textContent = 'Tentar novamente';
            botao.addEventListener('click', invocarFeiticeiros);
            mensagem.append(botao);
        }
        grid.replaceChildren(mensagem);
    }

    function criarCard(personagem, indice) {
        let exibido = obterVersao(personagem);
        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper entrada';
        wrapper.style.animationDelay = `${Math.min(indice * 35, 210)}ms`;
        wrapper.addEventListener('animationend', evento => {
            if (evento.target === wrapper) wrapper.classList.remove('entrada');
        });
        const card = document.createElement('article');
        card.className = 'card';
        card.dataset.personagemId = personagem.id;
        card.style.setProperty('--cor-aura', exibido.corAura);
        if (exibido.versaoId) card.dataset.versaoId = exibido.versaoId;
        const imagem = document.createElement('div');
        imagem.className = 'card-imagem-placeholder';
        preencherImagemPersonagem(imagem, exibido, { prioritaria: indice < 3 });
        const info = document.createElement('div');
        info.className = 'card-info';
        const badge = document.createElement('span');
        badge.className = `badge ${personagem.tipo}`;
        const textoBadge = document.createElement('span');
        if (personagem.tipo === 'anomalia') textoBadge.className = 'texto-hibrido';
        textoBadge.textContent = exibido.classe;
        badge.append(textoBadge);
        const titulo = document.createElement('h3');
        const abrir = document.createElement('button');
        abrir.type = 'button';
        abrir.className = 'btn-abrir-personagem';
        abrir.id = `abrir-${personagem.id}`;
        abrir.textContent = personagem.nome;
        abrir.setAttribute('aria-label', `Ver detalhes de ${personagem.nome}`);
        abrir.setAttribute('aria-haspopup', 'dialog');
        card.setAttribute('aria-labelledby', abrir.id);
        abrir.addEventListener('click', () => abrirModal(exibido, abrir));
        titulo.append(abrir);
        info.append(badge, titulo);
        const seletor = criarSeletorVersoes(personagem, versao => {
            exibido = versao;
            card.dataset.versaoId = versao.versaoId;
            card.style.setProperty('--cor-aura', versao.corAura);
            textoBadge.textContent = versao.classe;
            preencherImagemPersonagem(imagem, versao, { prioritaria: true, transicao: true });
        });
        if (seletor) card.classList.add('tem-versoes');
        const selo = document.createElement('button');
        selo.type = 'button';
        selo.className = 'btn-selo';
        selo.textContent = '封';
        atualizarBotaoFavorito(selo, personagem, estado.feiticeirosSelados.includes(personagem.id));
        selo.addEventListener('click', () => {
            const rect = selo.getBoundingClientRect();
            alternarSeloGlobal(personagem.id);
            invocarExplosao(rect.left + rect.width / 2, rect.top + rect.height / 2, exibido.corAura);
        });
        card.addEventListener('click', evento => {
            if (!evento.target.closest('button, a, input, select')) abrirModal(exibido, abrir);
        });
        card.append(imagem, info, selo);
        if (seletor) card.append(seletor);
        wrapper.append(card);
        const descartarEfeito = vincularEfeitoCard(card, wrapper);
        return { wrapper, abrir, selo, personagem, descartarEfeito };
    }

    function atualizarURL() {
        const url = new URL(window.location.href);
        const texto = busca.value.trim();
        if (texto) url.searchParams.set('busca', texto); else url.searchParams.delete('busca');
        if (filtro.value !== 'todos') url.searchParams.set('tipo', filtro.value); else url.searchParams.delete('tipo');
        window.history.replaceState({}, '', url);
    }

    function lerURL() {
        const parametros = new URLSearchParams(window.location.search);
        busca.value = parametros.get('busca') || '';
        const tipo = parametros.get('tipo');
        filtro.value = Array.from(filtro.options).some(opcao => opcao.value === tipo) ? tipo : 'todos';
    }

    function atualizarContagem(quantidade) {
        resultado.textContent = `${quantidade} ${quantidade === 1 ? 'personagem encontrado' : 'personagens encontrados'}`;
    }

    function aplicarFiltros({ primeiraExibicao = false } = {}) {
        clearTimeout(timerBusca);
        if (carregando) return;
        atualizarURL();
        if (erroCarregamento) return;
        const lista = filtrarPersonagens(estado.bancoDeDadosPersonagens, busca.value, filtro.value, estado.feiticeirosSelados);
        if (!primeiraExibicao) cards.forEach(({ wrapper }) => wrapper.classList.remove('entrada'));
        grid.replaceChildren(...lista.map(personagem => cards.get(personagem.id).wrapper));
        if (!lista.length) mostrarMensagem('Nenhum personagem corresponde aos filtros.');
        atualizarContagem(lista.length);
    }

    function atualizarFavorito(id) {
        const item = cards.get(id);
        if (!item) return;
        const selado = estado.feiticeirosSelados.includes(id);
        atualizarBotaoFavorito(item.selo, item.personagem, selado);
        statusFavoritos.textContent = `${item.personagem.nome} ${selado ? 'adicionado aos' : 'removido dos'} favoritos.`;
        // Só a lista de favoritos perde um card; as outras grades ficam intactas.
        if (filtro.value === 'favoritos' && !selado && item.wrapper.parentElement === grid) {
            const elementos = Array.from(grid.querySelectorAll('.btn-abrir-personagem'));
            const posicao = elementos.indexOf(item.abrir);
            const tinhaFoco = item.wrapper.contains(document.activeElement);
            item.wrapper.remove();
            const restantes = Array.from(grid.querySelectorAll('.btn-abrir-personagem'));
            if (!restantes.length) mostrarMensagem('Nenhum personagem corresponde aos filtros.');
            atualizarContagem(restantes.length);
            if (tinhaFoco) (restantes[Math.min(posicao, restantes.length - 1)] || filtro).focus();
        }
    }

    async function invocarFeiticeiros() {
        if (carregando) return;
        const recuperarFoco = grid.contains(document.activeElement);
        carregando = true;
        erroCarregamento = false;
        grid.setAttribute('aria-busy', 'true');
        resultado.textContent = 'Carregando personagens…';
        mostrarMensagem('Abrindo o arquivo…');
        try {
            const resposta = await fetch('./data/personagens.json');
            if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
            const personagens = validarPersonagens(await resposta.json());
            cards.forEach(item => item.descartarEfeito?.());
            cards.clear();
            estado.bancoDeDadosPersonagens = personagens;
            sincronizarFavoritos();
            personagens.forEach((personagem, indice) => cards.set(personagem.id, criarCard(personagem, indice)));
            lerURL();
            carregando = false;
            aplicarFiltros({ primeiraExibicao: true });
            if (recuperarFoco) (grid.querySelector('.btn-abrir-personagem') || busca).focus();
        } catch (erro) {
            erroCarregamento = true;
            console.error('Não foi possível carregar o catálogo:', erro);
            resultado.textContent = 'Catálogo indisponível no momento.';
            mostrarMensagem('Não foi possível carregar os personagens. Verifique sua conexão e tente novamente.', true);
        } finally {
            carregando = false;
            grid.setAttribute('aria-busy', 'false');
        }
    }

    busca.addEventListener('input', () => {
        clearTimeout(timerBusca);
        timerBusca = setTimeout(aplicarFiltros, 200);
    });
    filtro.addEventListener('change', () => aplicarFiltros());
    window.addEventListener('popstate', () => { lerURL(); aplicarFiltros(); });
    return { invocarFeiticeiros, aplicarFiltros, atualizarFavorito };
}

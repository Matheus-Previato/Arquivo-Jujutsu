import { obterVersao } from './versoes.js';

export function criarLinkPersonagem(endereco, personagem, { compartilhar = false } = {}) {
    const url = new URL(endereco);
    url.searchParams.set('personagem', personagem.id);
    if (personagem.versaoId) url.searchParams.set('versao', personagem.versaoId);
    else url.searchParams.delete('versao');
    if (compartilhar) {
        // Favoritos são locais; o destinatário deve encontrar o personagem mesmo sem selos.
        url.searchParams.delete('busca');
        url.searchParams.delete('tipo');
        url.searchParams.delete('classe');
        url.searchParams.delete('ordem');
        url.hash = '';
    }
    return url;
}

export function resolverLinkPersonagem(endereco, personagens) {
    const url = new URL(endereco);
    const personagem = personagens.find(item => item.id === url.searchParams.get('personagem'));
    if (!personagem) return null;
    const indice = personagem.versoes?.findIndex(versao => versao.id === url.searchParams.get('versao')) ?? 0;
    return obterVersao(personagem, Math.max(0, indice));
}

export function criarNavegacao({ obterPersonagens, aoAbrir, aoFechar, janela = window }) {
    function registrarAbertura(personagem) {
        const url = criarLinkPersonagem(janela.location.href, personagem);
        if (url.href !== janela.location.href) janela.history.pushState(null, '', url);
    }
    function registrarFechamento() {
        const url = new URL(janela.location.href);
        if (!url.searchParams.has('personagem') && !url.searchParams.has('versao')) return;
        url.searchParams.delete('personagem');
        url.searchParams.delete('versao');
        janela.history.replaceState(null, '', url);
    }
    function sincronizar() {
        const personagem = resolverLinkPersonagem(janela.location.href, obterPersonagens());
        if (!personagem) {
            registrarFechamento();
            aoFechar();
            return;
        }
        const url = criarLinkPersonagem(janela.location.href, personagem);
        if (url.href !== janela.location.href) janela.history.replaceState(null, '', url);
        aoAbrir(personagem);
    }
    janela.addEventListener('popstate', sincronizar);
    return { registrarAbertura, registrarFechamento, sincronizar };
}

export function criarCompartilhamento({ botao, status, campo, obterEndereco = () => window.location.href, escrever = texto => navigator.clipboard.writeText(texto) }) {
    let atual = null;
    let geracao = 0;
    function atualizar(personagem) {
        atual = personagem;
        geracao++;
        if (status) status.textContent = '';
        if (campo) { campo.hidden = true; campo.value = ''; }
        if (botao) botao.disabled = !personagem;
    }
    botao?.addEventListener('click', async () => {
        if (!atual) return;
        const pedido = ++geracao;
        const link = criarLinkPersonagem(obterEndereco(), atual, { compartilhar: true }).href;
        try {
            await escrever(link);
            if (pedido === geracao && status) status.textContent = 'Link copiado!';
        } catch {
            if (pedido !== geracao) return;
            if (status) status.textContent = 'Copie o link no campo abaixo.';
            if (campo) { campo.hidden = false; campo.value = link; campo.focus(); campo.select(); }
        }
    });
    return { atualizar };
}

const EFEITOS = { 'gojo-02': 'gojo', 'sukuna-11': 'sukuna', 'maki-07': 'maki' };

// Efeitos de entrada são finitos e independentes dos cenários de fundo.
export function iniciarEfeitosPersonagens({ permitido = () => !document.hidden && document.documentElement.dataset.efeitos !== 'reduzidos' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
    const ativos = new Map();
    function limpar(container) {
        const ativo = ativos.get(container);
        if (!ativo) return;
        clearTimeout(ativo.timer);
        ativo.camada.remove();
        ativos.delete(container);
    }
    function animar(container, personagem) {
        if (!container) return;
        limpar(container);
        const efeito = EFEITOS[personagem.id];
        if (!efeito || !permitido()) return;
        const camada = document.createElement('div');
        camada.className = `efeito-personagem efeito-${efeito}`;
        camada.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 3; i++) {
            const traco = document.createElement('span');
            traco.className = `traco traco-${i}`;
            camada.append(traco);
        }
        container.append(camada);
        ativos.set(container, { camada, timer: setTimeout(() => limpar(container), 1100) });
    }
    function limparTodos() { [...ativos.keys()].forEach(limpar); }
    function aoOcultar() { if (document.hidden) limparTodos(); }
    document.addEventListener('visibilitychange', aoOcultar);
    return { animar, limpar, destruir() { limparTodos(); document.removeEventListener('visibilitychange', aoOcultar); } };
}

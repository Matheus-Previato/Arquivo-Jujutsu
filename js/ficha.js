// Campos opcionais mantêm o catálogo compatível com personagens ainda incompletos.
export function preencherFicha(container, personagem) {
    if (!container) return;
    container.replaceChildren();
    for (const [campo, rotulo] of [['afiliacao', 'Afiliação'], ['tecnica', 'Técnica / recurso principal'], ['habilidades', 'Habilidades'], ['ferramentas', 'Ferramentas']]) {
        const valor = personagem[campo];
        if (!valor || (Array.isArray(valor) && !valor.length)) continue;
        const listaDeItens = Array.isArray(valor);
        const grupo = document.createElement(listaDeItens ? 'details' : 'dl');
        grupo.className = listaDeItens ? 'ficha-secao' : 'ficha-resumo';
        if (campo === 'habilidades') grupo.open = true;
        const titulo = document.createElement(listaDeItens ? 'summary' : 'dt');
        titulo.textContent = rotulo;
        const conteudo = document.createElement(listaDeItens ? 'div' : 'dd');
        if (listaDeItens) {
            const lista = document.createElement('ul');
            for (const texto of valor) {
                const item = document.createElement('li');
                item.textContent = texto;
                lista.append(item);
            }
            conteudo.append(lista);
        } else conteudo.textContent = valor;
        grupo.append(titulo, conteudo);
        container.append(grupo);
    }
    container.hidden = container.children.length === 0;
}

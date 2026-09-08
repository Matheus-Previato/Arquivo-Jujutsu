import { criarEstado } from './estado.js';
import { iniciarEfeitos } from './efeitos.js';
import { iniciarRadar } from './radar.js';
import { criarFavoritos } from './favoritos.js';
import { criarModal } from './modal.js';
import { criarCatalogo } from './catalogo.js';

const estado = criarEstado();
const efeitos = iniciarEfeitos();
const radar = iniciarRadar();

// A comunicação passa por este ponto para evitar dependências circulares.
// O callback só é chamado em interações, após a criação do catálogo.
const favoritos = criarFavoritos({
    estado,
    aoAlterar: () => catalogo.aplicarFiltros(),
});

const modal = criarModal({
    estado,
    alternarSeloGlobal: favoritos.alternarSeloGlobal,
    invocarExplosao: efeitos.invocarExplosao,
    desenharGraficoRadar: radar.desenharGraficoRadar,
    fecharTooltip: radar.fecharTooltip,
});

const catalogo = criarCatalogo({
    estado,
    abrirModal: modal.abrirModal,
    alternarSeloGlobal: favoritos.alternarSeloGlobal,
    ...efeitos,
});

catalogo.invocarFeiticeiros();

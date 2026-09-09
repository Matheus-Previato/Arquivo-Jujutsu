import { criarEstado } from './estado.js';
import { iniciarEfeitos } from './efeitos.js';
import { iniciarRadar } from './radar.js';
import { criarFavoritos } from './favoritos.js';
import { criarModal } from './modal.js';
import { criarCatalogo } from './catalogo.js';
import { criarNavegacao } from './links.js';
import { iniciarEfeitosPersonagens } from './efeitos-personagens.js';

const estado = criarEstado();
const efeitos = iniciarEfeitos();
const efeitosPersonagens = iniciarEfeitosPersonagens();
const radar = iniciarRadar();

// A comunicação passa por este ponto para evitar dependências circulares.
// O callback só é chamado em interações, após a criação do catálogo.
const favoritos = criarFavoritos({
    estado,
    aoAlterar: id => { catalogo.atualizarFavorito(id); modal.atualizarNavegacao(); },
});

const modal = criarModal({
    estado,
    alternarSeloGlobal: favoritos.alternarSeloGlobal,
    invocarExplosao: efeitos.invocarExplosao,
    desenharGraficoRadar: radar.desenharGraficoRadar,
    limparRadar: radar.limparRadar,
    aoAbrir: personagem => navegacao.registrarAbertura(personagem),
    aoFechar: () => navegacao.registrarFechamento(),
    obterNavegacao: personagem => catalogo.obterNavegacao(personagem),
    navegar: direcao => catalogo.navegar(direcao),
    alternarVersao: () => catalogo.alternarVersaoModal(),
    animarPersonagem: efeitosPersonagens.animar,
    limparAnimacao: efeitosPersonagens.limpar,
});

const catalogo = criarCatalogo({
    estado,
    abrirModal: modal.abrirModal,
    alternarSeloGlobal: favoritos.alternarSeloGlobal,
    sincronizarFavoritos: favoritos.sincronizarFavoritos,
    aoCarregar: () => navegacao.sincronizar(),
    animarPersonagem: efeitosPersonagens.animar,
    ...efeitos,
});

const navegacao = criarNavegacao({
    obterPersonagens: () => estado.bancoDeDadosPersonagens,
    aoAbrir: personagem => catalogo.abrirPersonagem(personagem),
    aoFechar: modal.fecharModal,
});

catalogo.invocarFeiticeiros();

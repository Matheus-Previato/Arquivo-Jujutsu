# Arquivo Jujutsu - Domínio Expandido ⛩️

<p align="center">
  <img src="![BANNER OU GIF AQUI]" alt="Demonstração do Arquivo Jujutsu" width="100%">
</p>

## Catálogo de Feiticeiros, Maldições e Anomalias

O **Arquivo Jujutsu** não é apenas um catálogo visual; é um Domínio Expandido de Engenharia Front-end. Este repositório é a vitrine de uma aplicação construída com JavaScript Vanilla Moderno, focada em performance, acessibilidade e interatividade avançada, ambientada na atmosfera visceral e sombria do universo Jujutsu Kaisen.

> *"O Domínio está Completo. Mas os seus Filtros são Infinitos."*

---

## 🛠️ Técnicas de Grau Especial Implementadas

A arquitetura desta aplicação foi blindada com engenharia moderna para garantir a melhor experiência de usuário:

### 🌀 1. Física de Energia Amaldiçoada (Tilt 3D)
* Os cards não são estáticos; eles reagem fisicamente à presença do mouse, girando no espaço 3D com base nas coordenadas exatas do cursor.
* Inclui efeito Parallax holográfico: a imagem (a 'arte do feiticeiro') e o selo saltam em direções diferentes com base na inclinação, criando profundidade visual verdadeira.

### 💾 2. Sistema de Selamento (LocalStorage)
* Persistência de dados: Os usuários podem "selar" (favoritar) seus feiticeiros usando o Kanji 封 (Fū - Selar).
* Os dados são salvos no `localStorage` do navegador e sobrevivem ao fechamento da aba ou reinício do dispositivo.
* Inclui um filtro exclusivo "Selados (Favoritos)" que cruza as IDs salvas com o banco de dados principal.

### 🏎️ 3. Otimização de Carregamento (Lazy Load & Skeleton)
* **Performance:** Imagens carregam apenas quando necessárias (`loading="lazy"`), economizando banda e mantendo a renderização fluida em redes lentas.
* **Skeleton UI:** Enquanto as imagens baixam, um esqueleto pulsante de feedback visual (efeito Shimmer) preenche o card, evitando layout shifts e melhorando a UX.
* 🛡️ **Tratamento de Exceções:** Implementação de `onerror` nas imagens para evitar skeletons infinitos e ícones de erro nativos do navegador.

### 🔗 4. Deep Linking (Roteamento de URL)
* **Deep Linking & Sincronização:** O estado dos filtros de tipo e da barra de busca é sincronizado instantaneamente com os parâmetros da URL (`index.html?busca=yuji&tipo=anomalia`).
* Os links são compartilháveis e abrem no estado exato em que estavam.

### 🛡️ 5. Proteção de Renderização (Debounce)
* Controle de fluxo na barra de busca: A renderização do Grid é protegida por um `Debounce` de 300ms, evitando travamentos em listas grandes.

### ♿ 6. Domínio Acessível (A11y)
* Cards totalmente acessíveis via teclado (`tabindex="0"`).
* Motor de física 3D desativado em favor da acessibilidade pura quando o foco não é via mouse (`:focus-visible`).
* Feedback visual claro para navegação sem mouse.

---

## 🎨 O Design Amaldiçoado

* **Vignette de Barreira:** Efeito visual de *Vignette* (radial-gradient) que simula a o catálogo dentro de uma "Cortina" (barreira visual de JJK).
* **Talismãs de Selo:** Badges de Grau no estilo de Ofuda tradicional, que flutuam em Parallax.
* **Instabilidade no Hover:** Cards e seletores tremem e vibram levemente quando focados, indicando energia amaldiçoada instável lutando para escapar.

---

## 🚀 Invocando Localmente

Para rodar este Domínio na sua máquina:

1.  Clone este repositório (Grimório).
2.  Abra a pasta no seu editor de código (VS Code recomendado).
3.  Instale a extensão **Live Server**.
4.  Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.

Use um servidor HTTP local, como o Live Server. O JavaScript usa módulos nativos do navegador e o catálogo é carregado por `fetch`, portanto abrir o HTML diretamente como `file://` não é suficiente. Não é necessário instalar pacotes nem executar uma compilação.

---

### Organização dos arquivos

```text
index.html                 Estrutura da página e ordem dos estilos
js/
  main.js                  Inicialização e conexão dos módulos
  estado.js                Dados compartilhados da aplicação
  catalogo.js              Carregamento, cards, busca, filtros e URL
  favoritos.js             Selos e persistência dos favoritos
  modal.js                 Detalhes e eventos da janela do personagem
  radar.js                 Gráfico de atributos e suas dicas
  efeitos.js               Partículas, domínios e interação 3D
css/
  base.css                 Tema, estilos globais e camadas dos efeitos
  cabecalho.css            Cabeçalho, busca e filtro
  catalogo.css             Grade, cards, badges e selos
  modal.css                Detalhes, gráfico e dicas
  dominios.css             Aparência dos cenários de domínio
  animacoes.css            Keyframes e efeito de carregamento
  responsivo.css           Adaptação para telas pequenas
data/
  personagens.json         Informações dos personagens
assets/img/
  gojo-02.png               Artes dos personagens
```

Cada módulo de JavaScript expõe uma função de inicialização ou criação. O `main.js` conecta essas funções e passa o estado e os callbacks necessários, evitando que catálogo, favoritos e detalhes importem uns aos outros.

Para mudar o conteúdo de um personagem, edite `data/personagens.json`. Para alterar a busca, use `js/catalogo.js`; para ajustar um domínio, use `js/efeitos.js` e `css/dominios.css`.

Os estilos são carregados diretamente no `index.html`. Preserve a ordem dos links: a divisão mantém a mesma sequência de regras do antigo `style.css`, com os ajustes responsivos por último. Os caminhos relativos de dados e imagens continuam compatíveis com a publicação em `/Arquivo-Jujutsu/` no GitHub Pages.

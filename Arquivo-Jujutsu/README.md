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

---

### 🔥 Arquitetura Semântica

```txt
📂 index.html      # O Coração Semântico e Acessível.
📂 css
   └── 📄 style.css # O Grimmório de Estilos, Perspectivas 3D e Animações de Ofuda.
📂 js
   └── 📄 main.js   # O Domínio Expandido: Lógica, Física, LocalStorage e Roteamento.
📂 data
   └── 📄 personagens.json # O Banco de Dados de Almas Jujutsu.
📂 img
   └── 📄 # Galeria de Imagens JJK.

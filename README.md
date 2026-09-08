# Arquivo Jujutsu ⛩️

Catálogo de personagens de Jujutsu Kaisen feito com HTML, CSS e JavaScript, com busca, favoritos, detalhes de combate e cenários inspirados nos domínios da obra.

## Recursos

- Busca por nome ou classe, sem distinguir maiúsculas e acentos; filtros por tipo e favoritos. Busca e tipo ficam na URL para compartilhar a consulta.
- Favoritos salvos no navegador. Se o armazenamento estiver bloqueado, continuam funcionando durante a visita; dados salvos inválidos são recuperados com um aviso.
- Detalhes em uma janela acessível pelo teclado, com fechamento por Escape e retorno do foco ao catálogo. Os atributos aparecem no gráfico e em texto.
- Inclinação dos cards com mouse, partículas e alternância entre os cenários normal, Gojo, Sukuna e Higuruma. O botão **Efeitos** permite reduzir o movimento e o custo visual; a preferência de movimento reduzido do sistema também é respeitada.
- Cards reutilizados durante as interações: favoritar altera apenas o selo correspondente, sem reconstruir a grade nem reiniciar suas animações.
- Validação dos dados, aviso de falha com botão **Tentar novamente** e apresentação alternativa para retratos ausentes ou que não carregaram.

O catálogo contém 20 personagens, todos com retratos estilizados criados com IA para este projeto. As imagens ficam em `assets/img/personagens/`; são ilustrações de fãs, não artes oficiais. A imagem anterior do Gojo foi preservada em `assets/img/gojo-02.png`. Os atributos representam o conteúdo deste projeto, sem pretensão de serem valores oficiais da obra.

## Executar localmente

Abra a pasta do projeto no editor e sirva o `index.html` por um servidor HTTP local, como o Live Server. Se você já tem Python instalado, também pode executar na pasta:

```sh
python -m http.server 8000
```

Depois acesse `http://localhost:8000/`. Abrir o HTML diretamente como `file://` não é suficiente: a aplicação usa módulos JavaScript e carrega o catálogo com `fetch`.

O site não precisa de instalação de pacotes nem de compilação. As fontes vêm do Google Fonts; se estiverem indisponíveis, o navegador usa as fontes alternativas definidas no CSS.

## Organização

```text
index.html                  Estrutura e ordem dos estilos
js/
  main.js                   Inicialização e conexão entre módulos
  estado.js                 Estado compartilhado e leitura segura dos favoritos
  dados.js                  Validação dos personagens e regras de busca/filtro
  catalogo.js               Carregamento, cards, contagem e sincronização da URL
  imagens.js                Imagens, carregamento e retratos alternativos
  favoritos.js              Selos, persistência e avisos de armazenamento
  modal.js                  Abertura, fechamento e foco dos detalhes
  radar.js                  Gráfico, valores em texto e explicação dos atributos
  efeitos.js                Partículas, domínios e interação com mouse
css/
  base.css                  Tema, estilos globais e controles auxiliares
  cabecalho.css             Cabeçalho, busca e filtro
  catalogo.css               Grade, cards, retratos e selos
  modal.css                 Detalhes e gráfico
  dominios.css              Cenários de domínio
  animacoes.css             Animações e preferência de movimento reduzido
  responsivo.css            Telas pequenas e dispositivos de toque
data/personagens.json       Conteúdo do catálogo
assets/img/                 Imagens dos personagens
tests/                      Testes de regressão com o executor nativo do Node
```

O `main.js` conecta as funções dos módulos e passa os callbacks necessários. Preserve a ordem dos estilos no `index.html`, com os ajustes responsivos por último.

## Alterar o conteúdo

Edite `data/personagens.json` para adicionar ou modificar personagens. Cada entrada precisa de:

- `id` único com letras, números ou hífens; `nome`, `classe` e `descricao` preenchidos.
- `tipo`: `feiticeiro`, `maldicao`, `neutro` ou `anomalia`. O filtro **Outros** reúne os dois últimos.
- `atributos`: valores numéricos entre 0 e 100 para `fis`, `vel`, `eng`, `int` e `let`.
- `corAura`: três componentes RGB entre 0 e 255, como `"89, 0, 179"`.
- `imagem`: caminho relativo como `"./assets/img/gojo-02.png"`, ou `""` enquanto não houver arte. Você pode informar `larguraImagem` e `alturaImagem` com as dimensões reais do arquivo.

Use caminhos relativos e respeite maiúsculas e minúsculas dos nomes de arquivos: isso importa no GitHub Pages. Para futuras mudanças, as regras de pesquisa ficam em `dados.js`, a apresentação dos cards em `catalogo.js` e os efeitos em `efeitos.js`.

## Verificar alterações

Com Node.js 20 ou superior instalado, execute na raiz:

```sh
node --test
```

O atalho `npm test` executa o mesmo comando, quando npm estiver disponível. Não há dependências para instalar.

Os testes cobrem recuperação de favoritos, filtros, reaproveitamento de cards, tentativas de carregamento, imagens, modal, atributos e efeitos. Como usam simulações do navegador, complemente mudanças de interface conferindo teclado, Escape, foco e telas pequenas em um navegador real.

## Publicar no GitHub Pages

Este é um site estático, pronto para ser servido a partir da raiz do repositório. No GitHub, em **Settings → Pages**, selecione a publicação por branch e a pasta **/(root)** da branch que contém estes arquivos. Aguarde o resultado da publicação antes de testar o endereço exibido pelo GitHub.

Um erro 404 antes de a página carregar precisa ser verificado na configuração/publicação do Pages. O botão **Tentar novamente** recupera falhas de carregamento do catálogo depois que a página já abriu.

Consulte a [documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) se precisar alterar a origem da publicação.

# Arquivo Jujutsu ⛩️

Catálogo de personagens de Jujutsu Kaisen feito com HTML, CSS e JavaScript, com busca, favoritos, detalhes de combate e cenários inspirados nos domínios da obra.

## Recursos

- Busca por nome, classificação, técnica, habilidade, ferramenta ou afiliação, sem distinguir maiúsculas e acentos. Filtros por tipo, favoritos e classificação, ordenação alfabética e botão para limpar a consulta. Busca, tipo, classificação e ordem ficam na URL.
- Favoritos salvos no navegador. Se o armazenamento estiver bloqueado, continuam funcionando durante a visita; dados salvos inválidos são recuperados com um aviso.
- Detalhes em uma janela acessível pelo teclado, com fechamento por Escape e retorno do foco ao catálogo. Os atributos aparecem no gráfico e em texto.
- Inclinação dos cards com mouse, partículas e alternância entre os cenários normal, Gojo, Sukuna e Higuruma. O botão **Efeitos** permite reduzir o movimento e o custo visual; a preferência de movimento reduzido do sistema também é respeitada.
- Cards reutilizados durante as interações: favoritar altera apenas o selo correspondente, sem reconstruir a grade nem reiniciar suas animações.
- Validação dos dados, aviso de falha com botão **Tentar novamente** e apresentação alternativa para retratos ausentes ou que não carregaram.
- Fichas com técnica/recurso principal, habilidades, ferramentas e afiliação quando cadastrada. A apresentação acompanha a versão escolhida da personagem.
- **Copiar link da ficha** compartilha personagem e versão, preservando a pasta do GitHub Pages. Links copiados removem busca e filtro de favoritos; a navegação local preserva esses filtros ao fechar a ficha.
- Retratos WebP em três resoluções, escolhidos pelo navegador conforme o espaço e a densidade da tela. Se um WebP falhar, o carregamento tenta o PNG original antes de mostrar as iniciais.

O catálogo contém 23 personagens e 24 retratos estilizados criados com IA para este projeto. A Maki alterna entre **Grau 4** e **Restrição Celestial** na mesma carta por um pequeno botão ⇄ no canto inferior direito, com transição suave entre os retratos e atualização da classificação e descrição. A troca também funciona pelo teclado e respeita a preferência por movimento reduzido. Os detalhes usam a versão selecionada; o favorito pertence à personagem. As imagens ficam em `assets/img/personagens/`; são ilustrações de fãs, não artes oficiais. Os atributos representam o conteúdo deste projeto, sem pretensão de serem valores oficiais da obra.

## Novidades do catálogo

- Yuki Tsukumo, Ultimate Mechamaru e Dagon, com fichas e retratos próprios em PNG e WebP.
- Navegação anterior/próximo dentro da ficha, seguindo os filtros e a ordem do catálogo. A Maki também alterna de versão sem fechar os detalhes.
- Seções recolhíveis para habilidades, ferramentas e atributos; retrato mais compacto no celular.
- Efeitos breves para Gojo, Sukuna e Maki ao abrir a ficha; a troca da Maki também anima a carta. As camadas são removidas após a animação e respeitam o modo de efeitos reduzidos.

A classificação e os recursos do Mechamaru foram conferidos no [guia da Animate Times](https://www.animatetimes.com/news/details.php?id=1650603920); a técnica de Yuki, no [guia de Yuki Tsukumo](https://eiga-manga.com/entry/jujutsu-tsukumo). As apresentações também seguem as páginas de personagens do anime citadas abaixo.

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
  versoes.js                Seleção de versões de uma mesma personagem
  ficha.js                  Apresentação dos campos da ficha
  links.js                  Links diretos, histórico e cópia com alternativa manual
  favoritos.js              Selos, persistência e avisos de armazenamento
  modal.js                  Abertura, fechamento e foco dos detalhes
  radar.js                  Gráfico, valores em texto e explicação dos atributos
  efeitos-personagens.js    Efeitos breves por personagem e limpeza das camadas
  efeitos.js                Partículas, domínios e interação com mouse
css/
  base.css                  Tema, estilos globais e controles auxiliares
  cabecalho.css             Cabeçalho, busca e filtro
  catalogo.css               Grade, cards, retratos e selos
  modal.css                 Detalhes e gráfico
  dominios.css              Cenários de domínio
  efeitos-personagens.css   Animações de Gojo, Sukuna e Maki
  animacoes.css             Animações e preferência de movimento reduzido
  responsivo.css            Telas pequenas e dispositivos de toque
data/personagens.json       Conteúdo do catálogo
assets/img/                 Imagens dos personagens
tests/                      Testes de regressão com o executor nativo do Node
scripts/otimizar_retratos.py Geração opcional dos retratos WebP (Python + Pillow)
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

Uma personagem pode declarar `versoes`, uma lista com pelo menos duas entradas. Cada versão precisa de `id` único dentro da lista e `classe`; pode substituir `descricao`, `imagem`, dimensões, `corAura` e `atributos`. Os campos não informados vêm da ficha principal. A Maki mantém os valores de atributos já cadastrados nas duas versões. A primeira versão aparece por padrão, e a seleção permanece enquanto você filtra o catálogo durante a visita. Recarregar a página sem um link direto de ficha volta à primeira versão. A busca considera as classificações de todas as versões, sem duplicar a personagem nos resultados.

Os campos opcionais `tecnica` e `afiliacao` são textos; `habilidades` e `ferramentas` são listas de textos. Eles também podem ser substituídos em cada versão. Uma lista vazia remove os itens herdados, e campos ausentes não ocupam espaço na ficha. Os resumos acompanham a fase já representada no catálogo e não pretendem listar todas as habilidades de cada personagem ao longo da obra. As informações de apresentação foram conferidas nas páginas do [elenco atual](https://jujutsukaisen.jp/character/), dos [feiticeiros](https://jujutsukaisen.jp/character/category3.php) e das [maldições e outros personagens](https://jujutsukaisen.jp/character/category4.php) do anime; nomes traduzidos podem variar entre edições.

### Links diretos

Uma URL como `?personagem=maki-07&versao=restricao-celestial` abre os detalhes da Maki despertada e sincroniza sua carta. Sem `versao`, a primeira apresentação é usada. Recarregar uma URL de ficha preserva essa apresentação. IDs de personagem desconhecidos voltam ao catálogo; versões desconhecidas voltam à primeira versão. A busca, o tipo, a classificação e a ordem podem coexistir na URL, mesmo se a ficha aberta não fizer parte do filtro. Voltar/avançar acompanha a ficha registrada no histórico. Fechar remove apenas os parâmetros da ficha.

O botão de copiar usa o endereço em que o site está aberto. Em uma prévia local, ele copia um endereço local; depois da publicação, copia o endereço público. O conteúdo continua sendo um único site estático, sem exigir regras de redirecionamento no Pages. A prévia de redes sociais não é específica por personagem.

### Atualizar os retratos otimizados

Os PNGs em `assets/img/personagens/` são as fontes preservadas. As cópias WebP ficam em `assets/img/personagens/webp/`, com larguras de 480, 800 e 1122 pixels (sem ampliar fontes menores). O campo `retratos` lista o caminho, a largura e a altura de cada opção, em ordem crescente. Ao substituir a imagem de uma versão sem informar `retratos`, o catálogo não herda as miniaturas da arte anterior.

Para gerar novamente as cópias após alterar um PNG, execute `python scripts/otimizar_retratos.py` em um ambiente com Pillow instalado. O script atualiza os caminhos e dimensões no catálogo. Essa etapa só é necessária para preparar imagens novas: executar ou publicar o site continua sem depender de Python, Pillow ou compilação. Revise o resultado visual antes de publicar.

## Verificar alterações

Com Node.js 20 ou superior instalado, execute na raiz:

```sh
node --test
```

O atalho `npm test` executa o mesmo comando, quando npm estiver disponível. Não há dependências para instalar.

Os testes cobrem recuperação de favoritos, filtros, reaproveitamento de cards, tentativas de carregamento, imagens, modal, atributos e efeitos. Como usam simulações do navegador, complemente mudanças de interface conferindo teclado, Escape, foco e telas pequenas em um navegador real.

Também são verificados os links diretos, o histórico, a alternativa de cópia manual, os campos das fichas, a recuperação do PNG e a existência dos arquivos com a capitalização exata exigida pelo Pages.

## Publicar no GitHub Pages

Este é um site estático, pronto para ser servido a partir da raiz do repositório. No GitHub, em **Settings → Pages**, selecione a publicação por branch e a pasta **/(root)** da branch que contém estes arquivos. Aguarde o resultado da publicação antes de testar o endereço exibido pelo GitHub.

Um erro 404 antes de a página carregar precisa ser verificado na configuração/publicação do Pages. O botão **Tentar novamente** recupera falhas de carregamento do catálogo depois que a página já abriu.

Consulte a [documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) se precisar alterar a origem da publicação.

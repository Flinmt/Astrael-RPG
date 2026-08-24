# Especificação do Item Arma

**Status:** implementada
**Escopo:** estrutura persistida das Armas e contratos dos catálogos oficiais de Características

## 1. Objetivo

Esta especificação define o futuro documento `Item` do tipo `weapon`. Armas serão documentos reutilizáveis que poderão existir no diretório de Itens ou em compêndios e, posteriormente, ser incorporados ao Actor `character` por seleção ou arrastar e soltar.

Esta etapa não define a aba Inventário, o fluxo completo de ataques, Talentos ou automações de combate. Esses sistemas deverão consumir os contratos estabelecidos aqui sem criar uma segunda fonte de verdade para os dados da Arma.

## 2. Estrutura da Arma

Além dos campos nativos do documento `Item`, como `name` e `img`, uma Arma possui os seguintes dados em `system`:

| Campo | Tipo | Obrigatório | Contrato |
| --- | --- | --- | --- |
| `description` | HTML enriquecido | não | Descrição livre da Arma, editada pelo editor de texto nativo do Foundry. |
| `damage` | número | sim | Valor inteiro e fixo, com mínimo de `1`. Não aceita fórmula. |
| `minorTrait` | identificador | sim | Exatamente uma opção do catálogo oficial de Características Menores. |
| `majorTrait` | identificador | sim | Exatamente uma opção do catálogo oficial de Características Maiores. |
| `rollAttribute` | identificador | sim | Exatamente um dos atributos oficiais do sistema usado na rolagem padrão. |
| `rollSkill` | identificador | sim | Exatamente uma das perícias oficiais do sistema usada na rolagem padrão. |

Estrutura conceitual:

```js
{
  description: "",
  damage: 1,
  minorTrait: "",
  majorTrait: "",
  rollAttribute: "",
  rollSkill: ""
}
```

`minorTrait`, `majorTrait`, `rollAttribute` e `rollSkill` armazenam identificadores técnicos estáveis, nunca os nomes apresentados ao usuário. Seus nomes e suas descrições são resolvidos pelos catálogos e pelas localizações do sistema.

Uma Arma recém-criada pode manter temporariamente o valor vazio nesses quatro seletores durante sua configuração. O estado vazio representa uma Arma incompleta, deve receber indicação visual clara na ficha de Item e não pode ser tratado como uma opção oficial nem receber uma escolha implícita.

`rollAttribute` e `rollSkill` definem apenas a combinação padrão da parada de dados. A Arma não executa a rolagem de forma independente nesta etapa; o futuro Inventário deve resolver os níveis correspondentes a partir do Actor que utiliza a Arma.
Qualquer Atributo oficial pode ser combinado com qualquer Perícia oficial; a ficha não aplica perfis fechados nem escolhe valores implicitamente.

## 3. Limites da primeira versão

A estrutura da Arma não contém:

- fórmula de dano;
- Característica Mágica;
- mais de uma Característica Menor ou Maior;
- quantidade, estado equipado ou outro estado do futuro Inventário;
- campos que indiquem se uma Característica está ativa;
- cópias dos nomes ou descrições das opções dos catálogos.
- execução da rolagem de ataque diretamente pela ficha da Arma.

Estados pertencentes à futura experiência de Inventário devem ser especificados separadamente antes de serem adicionados ao schema.

## 4. Características de Arma

Uma Característica de Arma é, por si só, uma palavra-chave oficial com uma definição de regra. Ela não possui tags ou palavras-chave internas e não é um documento `Item` independente.

As Características são divididas em dois catálogos fechados:

- **Características Menores**, aceitas apenas por `minorTrait`;
- **Características Maiores**, aceitas apenas por `majorTrait`.

Cada entrada possui conceitualmente:

```js
{
  id: "stable-identifier",
  label: "ASTRAEL.WeaponTraits.Category.Entry.Name",
  description: "ASTRAEL.WeaponTraits.Category.Entry.Description"
}
```

- `id` é persistido na Arma e não muda quando o texto apresentado for revisado ou traduzido.
- `label` aponta para o nome localizado da palavra-chave.
- `description` aponta para sua definição localizada.
- A categoria é determinada pelo catálogo no qual a entrada está registrada, não por dados editáveis da Arma.

Jogadores e Mestres não podem criar, renomear ou editar essas opções. Novas Características exigem atualização do sistema e inclusão simultânea nos dois idiomas.

### 4.1 Característica Menor: Oculta

- **Identificador:** `concealed`
- **Nome apresentado:** Oculta
- **Definição:** A arma pode permanecer escondida e imperceptível. Ela somente é descoberta quando alguém revista ativamente o personagem em busca de uma arma.

`Oculta` é inicialmente uma regra descritiva. Ela não oculta o documento na interface, não executa teste de detecção e não cria um fluxo automatizado de revista.

### 4.2 Característica Maior: Assassinar

- **Identificador:** `assassinate`
- **Nome apresentado:** Assassinar
- **Definição:** Adiciona o Dano da Arma como sucessos garantidos na rolagem de ataque, além de somá-lo à margem de dano.

Nesta etapa, `Assassinar` é somente descritiva. O cálculo de sucessos garantidos, a margem de dano, o vínculo com Talentos e sua apresentação em rolagens deverão ser definidos junto ao futuro fluxo de ataques. A implementação não deve antecipar essa automação.

## 5. Validação

Quando esta especificação for implementada, o sistema deve garantir que:

- `damage` seja inteiro e nunca menor que `1`;
- `minorTrait` corresponda a uma entrada do catálogo de Características Menores;
- `majorTrait` corresponda a uma entrada do catálogo de Características Maiores;
- `rollAttribute` corresponda a um atributo oficial do sistema;
- `rollSkill` corresponda a uma perícia oficial do sistema;
- uma opção de categoria incorreta não possa ocupar outro campo;
- identificadores desconhecidos sejam apresentados como dados inválidos, sem substituição silenciosa;
- a interface exponha os nomes e as descrições localizados, preservando apenas os identificadores nos dados persistidos.

## 6. Critérios de aceitação desta especificação

- O documento define uma única estrutura persistida para Armas.
- Dano é fixo, inteiro e possui mínimo `1`.
- Característica Menor e Característica Maior são singulares e obrigatórias.
- Atributo e Perícia da rolagem padrão são singulares, obrigatórios e armazenados por identificadores técnicos.
- `Oculta` e `Assassinar` constam como as primeiras Características oficiais.
- As duas Características permanecem descritivas e não introduzem automação antecipada.
- Característica Mágica e estados de Inventário permanecem fora do escopo.

## 7. Apresentação na ficha de Item

A ficha apresenta uma única página. Logo abaixo do cabeçalho existe um painel hierárquico de **Perfil de combate**; a descrição da Arma permanece visível abaixo desse painel.

No Perfil de combate, **Menor** e **Maior** dividem igualmente o painel superior, com acentos visuais oxidado e bronze respectivamente. A **Rolagem padrão** ocupa um painel separado logo abaixo e apresenta a combinação **Atributo + Perícia**.

Cada propriedade é exibida como uma etiqueta informativa cuja definição localizada aparece ao passar o mouse ou ao receber foco. Durante a edição, a etiqueta recebe um controle `×`. Removê-la limpa apenas o valor no rascunho e coloca em seu lugar um campo de pesquisa com a lista de opções oficiais da categoria. Escolher uma opção recria a etiqueta; somente salvar a Arma persiste as mudanças.

Uma propriedade vazia, desconhecida ou sem opções oficiais continua visível como pendência. A interface não cria valores provisórios nem substitui silenciosamente identificadores inválidos. Na visualização, o nome de cada característica permanece centralizado e sua definição completa aparece somente por hover ou foco.

Durante a edição, a região de Rolagem padrão oferece seletores independentes com todos os Atributos e Perícias oficiais. Na visualização, apresenta a combinação localizada no formato **Atributo + Perícia**. Valores vazios ou desconhecidos mantêm a Arma incompleta e permanecem visíveis até serem corrigidos.

A descrição usa o editor ProseMirror nativo do Foundry durante a edição. Na visualização, o HTML persistido é enriquecido pelo Foundry para apresentar formatação, links de documentos e demais recursos suportados pelo editor.

# ImplementIQ Systems: website

Site estático (HTML, CSS e JavaScript simples), pensado para o GitHub Pages. Sem build, sem dependências.

## Páginas

| Ficheiro | Conteúdo |
|---|---|
| `index.html` | Início: hero animado, sinais, serviços, método e equipa em resumo |
| `servicos.html` | Automação, Business Intelligence, integração e segurança de dados, landing page |
| `metodo.html` | Os 4 passos e os prazos habituais |
| `sobre.html` | Equipa e onde trabalhamos |
| `contacto.html` | Formulário, contacto direto e perguntas frequentes |
| `pack.html` | Pack landing page (650€) |
| `privacidade.html` | Política de Privacidade |

`style.css` é partilhado por todas. `core.js` (idioma PT/EN, menu, entrada ao deslizar), `net.js` (rede animada do hero) e `form.js` (formulário) são carregados onde fazem falta.

O cabeçalho e o rodapé estão repetidos em cada página. Se mudar o menu, altere-o em todos os `.html`.

## Ativar o formulário (obrigatório antes de publicar)

O GitHub Pages não executa código de servidor, por isso o formulário envia para um serviço externo.

1. Crie uma conta gratuita em formspree.io e um formulário novo. Receberá um endereço do tipo `https://formspree.io/f/abcdwxyz`.
2. Em `contacto.html`, substitua `https://formspree.io/f/SEU_ID` (aparece duas vezes, em `action` e em `data-endpoint`) por esse endereço.
3. Envie uma mensagem de teste. Enquanto o `SEU_ID` não for substituído, o formulário mostra um aviso e propõe o WhatsApp.

O email que receber as mensagens é o configurado no Formspree. Quando existir o email da empresa, altere-o lá.

## A completar

- Email da empresa: não aparece no site de propósito, até existir. Quando existir, acrescente em `contacto.html` (Contacto direto) e no rodapé.
- `privacidade.html`: acrescentar a designação legal, NIF e morada do responsável pelo tratamento (ver comentário no ficheiro).
- Se mudar de serviço de formulários, atualizar a secção "Quem recebe os dados" da política.
- Imagem para partilha (og:image) e endereço canónico, quando o domínio estiver definido.

## Notas de manutenção

- A fonte (Schibsted Grotesk) está em `fonts/`, sem pedidos ao Google (RGPD).
- Com "reduzir movimento" ativo no sistema, as animações são desligadas.
- Os ficheiros `working.png`, `team.png`, `shakehands.png`, `Everson.png` e `Pedro.png` já não são usados e podem ser apagados.


## Identidade visual (System Flow)

- `style.css` começa pelos tokens (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--transition-*`). Alterar cores ou espaços é mudar aí.
- O hero é um SVG animado só com CSS e SMIL (sem bibliotecas): Fragmentação, Conexão, Automação, Visibilidade. Com `prefers-reduced-motion` aparece a composição final, parada. Em telemóvel usa uma versão com menos sistemas.
- Se num telemóvel nada se mexe, verificar a definição de acessibilidade "Reduzir movimento" (iOS: Definições > Acessibilidade > Movimento).
- Fontes locais: Schibsted Grotesk (texto) e Geist Mono (etiquetas). Licenças em `fonts/`.
- O logótipo (`img/logo-mark.png`) não foi alterado.

## Adicionar um projeto à secção "Projetos"

Na `index.html`, secção `#projetos`, existe um modelo comentado de `<article class="project">` e três estados prontos (`.project-state`). Quando houver um caso verificável (e autorização do cliente), substituir o estado correspondente pelo cartão preenchido: problema, solução, o que foi construído, tecnologias, resultado observado. Não inventar números nem clientes.

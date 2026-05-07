# Teste Técnico · Founding Engineer / Forward Deployed Engineer

**LKW · 2026**

Bem-vindo. Esse é o teste técnico da vaga de Founding Engineer / Forward Deployed Engineer da LKW.

Antes de qualquer coisa: **leia este documento todo até o final** e leia também o `briefing-cliente.md`. O teste é tão sobre **o que você decide construir** quanto sobre **o que você constrói**.

---

## Por que esse teste existe

Na LKW, o trabalho começa assim: você senta com um cliente, escuta a operação real, sai de lá com 100 problemas mapeados, e tem que decidir, sozinho, qual deles vira o primeiro workflow em produção. Depois você constrói, deploya, mede e expande.

Este teste replica esse ciclo em escala pequena. Você recebe um briefing de um cliente fictício, decide o que vai construir primeiro, constrói em 4 horas, comunica suas decisões e entrega.

Não é teste de algoritmo. Não é live coding. Não tem pegadinha. É um exercício honesto que se parece com a primeira semana de quem entra na LKW.

---

## O briefing

Leia o arquivo `briefing-cliente.md` na mesma pasta.

Ele contém uma transcrição (resumida) de uma imersão de 1 dia em um cliente fictício de logística, junto com observações de campo e amostras de dados reais que essa operação processa.

A partir do briefing, você decide:

- Qual é o problema mais doloroso que vale automatizar primeiro
- O que entra no seu MVP de 4h
- O que fica de fora (e por quê)
- Como você mediria sucesso no cliente de verdade

Não tem resposta certa. Tem resposta defendida.

---

## O que construir

Construa um **sistema mínimo full-stack** que automatize **um pedaço** do fluxo descrito no briefing, escolhido por você.

O sistema precisa, no mínimo:

1. **Receber dados de entrada** de algum jeito (form, textarea, upload, API). Pode ser entrada bruta, desestruturada, como o cliente recebe hoje.
2. **Usar IA (LLM) em pelo menos um passo** do fluxo. Pode ser extração estruturada, classificação, geração de resposta, validação semântica. Você decide.
3. **Aplicar pelo menos uma regra de negócio** definida a partir do briefing.
4. **Persistir** o que rodou, com histórico mínimo (data, input, output, status). Pode ser arquivo JSON, SQLite, in-memory com seed. O importante é existir histórico.
5. **Ter uma UI mínima** que permita disparar uma execução e ver o resultado.

Em 4 horas é apertado. Você precisa cortar agressivo: pegue **o pedaço de maior impacto com menor esforço** e entregue isso bem feito. Tentar cobrir mais é o jeito mais rápido de não entregar nada.

---

## Stack

Livre. Mas algumas referências honestas:

- **Preferimos TypeScript end to end.** É a stack que você vai usar na LKW. Um candidato forte em outra stack que entrega bem em TS aqui sinaliza adaptabilidade.
- **Sugestões boas:** Next.js fullstack, ou NestJS + React + Vite, ou Remix.
- **Banco:** SQLite + Prisma resolve. Não use Postgres se vai gastar 1h configurando Docker.
- **LLM:** OpenAI, Anthropic, Google ou local. Use a chave que você já tem. Se não tiver, avisa que a gente provê.
- **Hospedagem:** não precisa subir em produção. Rodar local com `npm install && npm run dev` resolve.

Você não vai ser penalizado por escolher stack diferente. Você vai ser penalizado por gastar tempo configurando ferramenta em vez de entregar.

---

## Use IA o quanto quiser

Cursor, Claude Code, ChatGPT, Copilot, agentes, MCPs, o que você quiser. Aliás, **a gente espera que você use**.

Esse não é um teste de "será que ele sabe escrever for loop sem IA". É um teste de "será que ele entrega coisa boa rápido, do jeito que a LKW realmente trabalha".

O que pedimos é só uma coisa: na sua entrega, **mostre como você usou IA**. Prompts, ferramentas, decisões. A gente vai ler tudo.

---

## Tempo

**Alvo: 4 horas.** Pode ser em uma sessão única ou em duas sessões de 2 horas.

É pouco tempo de propósito. A gente quer ver como você prioriza, corta escopo e usa IA pra acelerar quando o relógio tá apertado. É exatamente o que acontece num diagnóstico real de cliente.

Se em 4h você ainda não terminou, **entregue o que tem** e explique o que faltou. Saber parar é parte do teste. Quem manda 12h de trabalho sinaliza problema diferente de quem entrega o essencial em 4h.

A gente lê tudo em até 5 dias úteis e dá retorno pra todo mundo, mesmo quem não avança.

---

## O que entregar

1. **Link de repositório público no GitHub** (ou GitLab/Bitbucket).

2. **README do projeto** com:
   - Como rodar localmente em 1 ou 2 comandos
   - O que está implementado e o que não está
   - Decisões importantes que você tomou
   - **Seção Reflexão** (obrigatória) respondendo às 5 perguntas abaixo

3. **Loom (ou Tella, Vimeo, YouTube unlisted) de 3 a 5 minutos** com:
   - Demo do que você construiu
   - Por que escolheu esse pedaço do briefing
   - O que você cortou e por quê
   - Como você usou IA durante o teste

### Reflexão (responder no README, em texto corrido)

1. **Por que você escolheu esse pedaço do briefing pra automatizar primeiro?** O que você descartou e por quê?

2. **O que você cortou pra caber em 4h?** Liste pelo menos 3 coisas que você não fez de propósito.

3. **Se tivesse mais 4 horas, o que você faria a seguir?** Em ordem.

4. **Como você usou IA nesse teste?** Cite ferramentas, tipos de prompt, onde a IA acelerou e onde ela atrapalhou.

5. **Se isso fosse cliente real e o LLM custasse dinheiro, como você levaria pra produção?** Pense em latência, custo, falha do modelo, edge cases, observabilidade.

---

## Como avaliamos

A gente lê o repo, o README e assiste o Loom. Avaliamos cinco dimensões com peso parecido:

- **Decisão de produto.** Você escolheu o pedaço certo? Cortou o suficiente? Defendeu bem a escolha?
- **Qualidade do código.** Legível, organizado, não over-engineered. A gente prefere 200 linhas claras a 2000 linhas com abstração demais.
- **Fluência com IA.** O prompt foi pensado? Você lidou com falha do modelo? Validou o output? Considerou custo e latência?
- **Comunicação.** README e Loom claros, objetivos, sem encheção de linguiça. Bom FDE comunica decisão de forma curta.
- **Ownership.** Você fez algo a mais que mostra atenção? Pegou edge case? Pensou em quem vai operar isso depois?

---

## O que NÃO importa nesse teste

Não perca tempo com:

- Cobertura de testes alta. Um ou dois testes em algo crítico já é sinal.
- Autenticação, login, RBAC, multi-tenancy. Pula.
- Deploy em produção. Rodar local resolve.
- Design impecável de UI. Tailwind padrão tá ótimo. Quer usar shadcn? Beleza.
- Cobrir tudo do briefing. Pelo contrário, te penaliza.
- Documentação de API tipo Swagger. README curto resolve.
- Reescrever do zero algo que tem biblioteca pronta. Use a biblioteca.

Se você se pegar fazendo qualquer um desses itens, pare. Você está no teste errado.

---

## Como mandar

Quando terminar, responda o e-mail que iniciou esse processo (ou mande pra `pablo@izzicupoborges.com` + `andressa.moukachar@izzicupoborges.com`) com:

- Assunto: `Teste Técnico - LKW - <Seu Nome>`
- Link do repositório
- Link do Loom
- Tempo total que você gastou (honesto, vai te ajudar)

A gente responde em até 5 dias úteis com decisão e feedback.

---

## Dúvidas durante o teste

Se travar em algo do briefing, **decida sozinho** e documente a decisão na reflexão. Em cliente real, é exatamente isso que você vai fazer.

Se for dúvida operacional do teste em si (algo claramente quebrado, ambíguo demais, problema de acesso), pode mandar e-mail. A gente responde rápido.

---

Boa sorte. A gente realmente quer que você entre.

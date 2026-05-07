# Briefing do Cliente · Transportes Verdebrasil

> **Cliente fictício, criado para esse teste técnico. Qualquer semelhança com cliente real da LKW é coincidência.**

---

## Quem é o cliente

**Transportes Verdebrasil LTDA**
Transportadora de médio porte, sede em Goiânia/GO, 6 filiais (GO, MG, MS, BA, TO, DF). Faturamento anual em torno de R$ 180 milhões. Frota mista: 60 caminhões próprios e ~120 agregados (terceiros).

Trabalha com **carga geral fracionada e cheia**, atendendo principalmente embarcadores do agro, indústria de bebidas e varejo regional.

A operação comercial é coordenada por **Marília**, gerente comercial em Goiânia, que tem 4 analistas de cotação reportando pra ela. Esses analistas são quem recebe e responde os pedidos de cotação dos clientes.

---

## Visão geral da operação de cotação

Hoje, todo pedido de cotação chega pelos seguintes canais, sem padrão:

- **WhatsApp** (cerca de 65% dos pedidos): mensagens de texto livre, áudios curtos, fotos de planilhas, prints de e-mail. Cada cliente embarcador escreve do seu jeito.
- **E-mail** (cerca de 25%): formato livre, alguns vêm com planilha em anexo, outros são texto corrido.
- **Telefone** (cerca de 10%): a analista anota num bloco e depois lança no sistema.

**Volume:** 60 a 90 cotações por dia, distribuídas entre os 4 analistas. Picos na segunda de manhã chegam a 30 cotações na primeira hora.

**Tempo médio por cotação:** 8 a 15 minutos do recebimento ao envio da resposta. Quando o cliente manda um e-mail confuso ou um áudio de 2 minutos, sobe pra 25 minutos.

**Taxa de fechamento:** cerca de 22% das cotações viram frete. O resto é descartado pelo cliente, ignorado, ou simplesmente "esquecido" depois.

---

## Como uma cotação é processada hoje (passo a passo)

A analista (vamos chamar de **Júlia**, uma das 4) faz o seguinte fluxo:

### Passo 1 · Receber e ler

Júlia abre WhatsApp Business, lê a mensagem do cliente. Exemplos reais (anonimizados) de mensagens que chegam:

> "Bom dia Marília, preciso de cotação para amanhã, tenho 12 toneladas de fertilizante saindo de Rio Verde GO indo para Patos de Minas, tem caminhão? Cliente é grande, valor justo por favor."

> "oi tudo bem, mando aqui 4 cargas pra cotar, tudo de Anápolis pra interior de SP, tudo carga seca, tem capacidade essa semana?"

> "Marilia bom dia. Cotação urgente. Saindo de Goiânia segunda 06h. Destino Salvador. Carga: pallets de bebida (cerveja em lata, 800 caixas, peso aprox 14t, volume cubado em torno de 30m3). Preciso cavalinho refrigerado? Não, temperatura ambiente serve. Prazo entrega: terça à tarde sem falta."

> "{áudio de 1m48s onde o cliente fala enrolado e cita 2 endereços, 1 prazo, e pergunta sobre 2 viagens diferentes na mesma mensagem}"

### Passo 2 · Extrair dados

Júlia identifica manualmente, pra cada cotação:

- **Origem:** cidade, estado, e quando dá, o CEP ou endereço aproximado
- **Destino:** mesma coisa
- **Tipo de carga:** seca, refrigerada, perigosa, fracionada, viva
- **Peso e volume estimados** (quando o cliente fala)
- **Prazo de coleta e prazo de entrega**
- **Restrições especiais:** veículo específico, escolta, agendamento, janela de descarga

Quando o cliente não falou alguma dessas coisas (acontece em mais ou menos metade das cotações), Júlia ou pergunta de volta no WhatsApp, ou chuta com base em cliente histórico.

### Passo 3 · Verificar viabilidade

Júlia abre 3 abas:

1. **Sistema interno (TMS):** verifica se tem veículo disponível na origem ou perto, na data pedida.
2. **Planilha de polígonos de atendimento:** confere se a origem e o destino estão dentro da área que a Verdebrasil atende. Polígonos foram desenhados manualmente em 2022 e não são atualizados há tempo.
3. **Google Maps:** confere distância e rota pra ter ideia de tempo de viagem.

Se a rota cobre uma região onde a Verdebrasil não tem retorno garantido, ela considera "ponta de rota" e adiciona um custo extra (a regra é mais ou menos: se a cidade de destino não tem outra carga saindo pra origem em até 3 dias, é ponta de rota).

### Passo 4 · Calcular preço

Verdebrasil tem uma **planilha mestre de tarifas** com colunas por:

- Estado de origem e estado de destino
- Faixa de quilometragem (até 200 km, 200 a 500 km, 500 a 1000 km, 1000 a 2000 km, 2000+ km)
- Tipo de carga (seca, refrigerada, fracionada, perigosa)
- Tipo de veículo (Toco, Truck, Carreta, Bitrem)

Júlia abre a planilha, encontra a célula correta, multiplica por peso ou volume (depende da regra), soma o adicional de ponta de rota se aplicável, soma pedágio estimado (outra planilha), e chega num número. Esse processo leva uns 3 a 5 minutos.

### Passo 5 · Responder

Júlia escreve uma mensagem de WhatsApp ou um e-mail com o número, validade da cotação (geralmente 48h) e termos de pagamento. Ela copia um template e ajusta o caso.

### Passo 6 · Lançar no sistema

Se o cliente confirmar (em algum momento depois), Júlia lança a cotação no TMS, gera ordem de coleta, e a operação assume.

---

## O que está dando errado hoje

Marília listou em uma reunião com a LKW os problemas que mais incomodam:

1. **"A gente perde cotação porque demora pra responder."** Quando uma analista demora mais de 1 hora pra responder, em quase metade dos casos o cliente já fechou com outra transportadora. Em pico de segunda de manhã, isso acontece muito.

2. **"O cliente manda áudio e a Júlia precisa parar tudo pra ouvir."** Áudios longos quebram o fluxo. Algumas analistas evitam ouvir áudio e ficam pedindo o cliente "manda escrito por favor", o que irrita o cliente.

3. **"Cada analista cota diferente."** Mesma rota, mesmo tipo de carga, dois clientes parecidos: às vezes saem preços com diferença de 15%. Marília suspeita que tem analista olhando a planilha errada ou esquecendo o adicional de ponta de rota.

4. **"Tem cotação que a gente nem responde."** Cotação que chega no fim do dia ou em fim de semana às vezes some no meio do WhatsApp. Marília não tem visibilidade do que entrou e ainda não foi respondido.

5. **"A planilha de tarifas vive desatualizada."** Diesel sobe, custo muda, mas a planilha é manual e demora dias pra atualizar. Cotações saem com preço defasado.

6. **"Quando bate prazo apertado, a gente fala um número e depois descobre que não dá."** Não tem checagem real de capacidade no momento da cotação. Compromete e depois corre atrás.

---

## Dados disponíveis (simulados, fornecidos para o teste)

Pra te ajudar, na pasta `dados-fake/` (você cria conforme precisar; **não são fornecidos**, gere os seus se for útil) você pode imaginar que existem:

- 30 a 50 mensagens reais simuladas (texto livre, no estilo dos exemplos acima)
- Uma planilha-mestre de tarifas em CSV/JSON (você inventa um formato razoável)
- Uma lista de polígonos atendidos (cidades cobertas, em CSV ou GeoJSON simplificado)
- Uma lista de veículos com status simulado (disponível/em viagem)

**Você não precisa gerar dados reais.** Pode mockar, hardcodar, gerar com IA, o que for mais rápido. O importante é que o sistema funcione com dados plausíveis.

---

## Restrições reais do cliente

- **A planilha mestre de tarifas é sagrada.** Marília não topa que a IA "decida" preço sozinha. Pode propor, mas o número final tem que sair da planilha (regras determinísticas).

- **Não dá pra trocar o TMS.** O TMS atual é antigo, mas crítico. Qualquer automação tem que conviver com ele, não substituir.

- **WhatsApp é onde o cliente está.** Não adianta pedir pro cliente preencher um form bonitinho. Ele vai mandar áudio e foto de planilha mesmo. (Para o teste, você pode simplificar e usar textarea, mas considere isso na reflexão.)

- **Júlia e as outras 3 analistas têm que continuar no controle.** A meta não é demitir ninguém. É liberar elas pra cuidar das cotações complexas e fechar mais negócio. A automação é assistente, não substituta. Pelo menos no começo.

- **Equipe de TI pequena.** Verdebrasil tem 1 analista de TI interno. A solução tem que ser operada pelo time da LKW (ou seja: simples de entender por quem não construiu).

---

## O que o cliente sonha (mas não pediu explicitamente)

Em conversa de café, Marília soltou frases como:

- "Queria conseguir responder cotação simples em 2 minutos sem precisar do analista."
- "Queria saber, num painel, quantas cotações entraram hoje, quantas a gente respondeu, quantas estão paradas."
- "Queria que a IA lesse o áudio do cliente e me trouxesse já o resumo do que ele tá pedindo."
- "Queria que a planilha de tarifas atualizasse o diesel sozinha."

Você não precisa atender nenhum desses sonhos. Mas se atender algum bem feito, é sinal forte de FDE pensando como dono.

---

## Sua missão no teste

Releia tudo isso. Decida **um pedaço** do fluxo que vale automatizar primeiro. Construa esse pedaço bem feito em 6 a 8 horas. Comunique a decisão na entrega.

Boa sorte.

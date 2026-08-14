# Roteiro — demo HyperFlow (entrevista Tech Lead)

Uso: cartão no celular → demo 2 min → extensão 4 min só se o Lead engajar. Pico dura **~18 s**: fala **enquanto** roda.

---

## 1. Cartão de celular

Copiar, printar, colar no Notes. Não ler como discurso — ancorar.

```
Sou engenheiro .NET. Entrego código — e carrego a dor do sistema.

Faculdade ensina a fazer funcionar. Produção cobra o que acontece
quando cresce, quebra e fica caro. Servidor tem fatura: Redis, fila
e banco são onde latência e dinheiro se encontram. Qualidade
(Sonar, teste integrado) não é enfeite — é o que segura a dívida.
Eu olho cada fase: carga, falha, custo, recuperação.

Me dá 2 a 4 minutos. Eu abro o HyperFlow e mostro isso na tela.

Não estou vendendo perfeição. Estou vendendo caminho:
eu sei onde dói, e eu sei por onde começar.
```

---

## 2. Versão 2 minutos (obrigatória)

**Aviso:** o botão vira `Parar pico` e some sozinho em ~18 s. Não espera o pico acabar pra falar. Arrasta a réplica **no meio** do pico.

Onde olhar: canvas (cards), chip `GCP …/h` no header, card flutuante **Custo Estimado de Nuvem (GCP/Hora)** no canto do canvas, painel **Telemetria & Logs** à direita (`Queue Depth`, `Redis Hit`, `PG Latency`, `Mensagens mortas`).

| Tempo | Ação na tela | Fala (curta, decorável) |
| --- | --- | --- |
| **0:00** | Canvas no baseline. Aponta da esquerda pra direita: `API Gateway` → `Redis Cache` → `RabbitMQ Orders` → `orders-worker` / `notify-worker` → `PostgreSQL Primary`. Linha vermelha tracejada sobe pro `Dead Letter Queue`. Header: `Throughput` ~120 RPS. FinOps ~**R$ 12,50/h**. | “Palco de um pedido: entra no Gateway, cache, fila, workers, banco. A linha vermelha é a DLQ — onde a mensagem vai quando o caminho feliz morre. Agora isso custa uns doze e cinquenta a hora. Barato. Quietinho.” |
| **0:20** | Clica **`Disparar Pico de 10k req/min`**. Banner: `Pico de carga em andamento`. Header vira `Parar pico`. Chip GCP fica âmbar. Fala **sem parar**. | “Pico. Não é ‘funciona na minha máquina’. É dez mil request por minuto caindo no mesmo grafo.” |
| **0:22–0:35** | Olha FinOps subindo. `RabbitMQ Orders` → métrica **Fila**. Direita: `Queue Depth`. `Redis Cache` → **Hit rate**. Frase do FinOps: `Cache Redis reduz hits no Postgres`. | “Custo sobe. Fila engorda. Cache segura o banco — ou a fatura come o Postgres. Redis barato; query cara. Quem não olha isso, escala o problema.” |
| **0:32** | Na sidebar **Componentes**, arrasta **`Réplica / Container`** pro canvas (perto dos workers). Não precisa conectar. Log: réplica adicionada, capacidade sobe. | “Sobe réplica no meio do pico. Capacidade não é slide — é card que você joga na hora. Fila alivia. Custo também muda: escala não é de graça.” |
| **0:40** | Card **`PostgreSQL Primary`** → **`Simular falha`**. Card fica chaos (`CHAOS · DOWN`). Banner `Chaos ativo`. | “Banco cai. Escrita quebra. Leitura ainda pode viver de cache — degradação, não apagão. É isso que eu projeto: o que continua de pé.” |
| **0:50** | Linha vermelha esquenta. Card **`Dead Letter Queue`**: **Mensagens mortas**. Direita: mesmo número. Clica **`Reprocessar (Requeue)`**. Fila do RabbitMQ recebe de volta. Motivo: `Requeue manual`. | “Mensagem não some. Cai na DLQ. Reprocessar é decisão — não é log e rezar. Eu quero ver o caminho de volta.” |
| **1:20** | Para. Mãos fora do mouse. | “Não estou vendendo perfeição. Estou vendendo caminho: eu sei onde dói, e eu sei por onde começar.” |

Se o pico acabar no meio: segue. Chaos e DLQ continuam. Não clica `Reset` no meio da fala.

Plano B se a réplica não “ interromper” visual: arrasta um **`RabbitMQ`** extra — pressão da fila redistribui.

---

## 3. Extensão para 4 minutos (só se o Lead puxar)

Não empilha. Um beat, respira, pergunta com o olho se ainda tem espaço.

| Beat | Ação | Fala |
| --- | --- | --- |
| Redis | Card **`Redis Cache`** → **`Estourar memória`** (`CHAOS · OOM`). **Hit rate** cai. FinOps sobe. Pode aparecer `fora de controle`. Restaura com **`Restaurar`**. | “Cache morre, o banco vira a conta. Hit cai, GCP sobe. Redis não é detalhe — é alavanca de custo.” |
| Qualidade | Arrasta **`SonarQube`** e **`Teste Integrado`**. Quality gate / cobertura no card. | “Isso não é enfeite no desenho. Gate e teste integrado são parte da arquitetura: o que passa pra produção e o que o contrato ainda segura quando o pico quebra o caminho.” |
| Modelar | Hover num card → lápis (`Renomear`) ou duplo clique no título. `X` no canto = `Remover nó`. | “Dá pra modelar na hora. Nome, tira, joga outro. Topologia não é PowerPoint.” |
| Reset | Header → **`Reset`**. | “Reset preserva o grafo, zera métricas. O desenho fica; a dor recomeça do zero.” |

Se o Lead já está falando: para a extensão. Deixa ele dirigir.

---

## 4. Como pedir a palavra

**Tech Lead, tom formal**

> Posso te pedir dois a quatro minutos? Eu abro um simulador que eu montei — HyperFlow — e te mostro como eu penso carga, falha e custo. Depois a gente conversa em cima disso.

**Spec / conversa mais solta**

> Me deixa dois minutos na tela? Eu não quero te contar arquitetura — quero te mostrar o sistema sofrendo. Aí você me corta quando quiser.

Se disserem “pode ir”: abre o browser já no HyperFlow. Sem preâmbulo de cinco frases.

---

## 5. Se perguntarem (Q&A honesto)

Corta no ponto. Não vira palestra.

**É sistema real?**  
Não. Modelo no browser. O ponto é o raciocínio — carga, falha, fila, custo — visível. No dia a dia isso vira .NET, fila de verdade, observabilidade de verdade.

**Billing GCP é real?**  
Não. Fórmula ilustrativa. Serve pra não discutir arquitetura sem olhar fatura.

**Por que o demo não é .NET?**  
O raciocínio é de arquitetura. No dia a dia eu entrego .NET. HyperFlow é o laboratório visual — pra caber em dois minutos, não pra substituir o código.

**IA?**  
Lapida quem já tem o básico. Sem o básico, só acelera o buraco.

**Testes?**  
Unitário é o mínimo. O que muda o jogo é contrato, carga e falha — o que o sistema faz quando o vizinho cai.

**Chaos no header (`Chaos · N`)?**  
São falhas injetadas. `Restaurar todas as falhas` limpa tudo. Por card: `Restaurar`.

**Por que DLQ e não retry infinito?**  
Retry sem teto vira DDoS interno. DLQ é o lugar onde a gente admite: isso precisa de olho.

---

## 6. O que NÃO falar

- “Arquiteto tipo Google / Facebook / FAANG.”
- Relativizar unit test (“unitário não é obrigatório”).
- Discurso de oito assuntos: Kafka + Redis + Sonar + cloud + QA + servidor, sem provar um.
- Se defender antes (“não sou perfeito”, “ainda estou aprendendo a ser arquiteto”).
- Enumerar ferramenta no lugar de mostrar dor.
- Pedir desculpa pelo demo não ser produção.
- Esperar o pico acabar em silêncio.
- Prometer que o HyperFlow “é o sistema da empresa”.
- Falar 4 minutos se o Lead já entendeu em 90 segundos.

---

## 7. Setup — 5 minutos antes da call

1. `npm run dev` — HyperFlow no browser. Uma aba só.
2. Canvas no **baseline** (topologia inicial). Se bagunçou: **`Reset`**, ou recarrega a página.
3. Zoom fit: controles do React Flow, canto inferior esquerdo — ícone de encaixar a view. Todo o grafo visível, inclusive `Dead Letter Queue`.
4. Fecha Slack, e-mail, abas. Full screen (F11). Sidebar **Componentes** visível — vai arrastar **`Réplica / Container`**.
5. Ensaio: **um take cronometrado** da tabela de 2 min. Se passar de 2:15, corta fala, não corta clique.

Checklist visual no 0:00:

- Header: `Disparar Pico de 10k req/min` (não `Parar pico`)
- GCP ~ `R$ 12,50/h`
- Sem banner `Pico de carga` / `Chaos ativo`
- Sem botão `Chaos · N`

---

*Labels conferidos no código (Header, Sidebar, palette, FinOps, nós, store: spike 18 s, baseline R$ 12,50).*

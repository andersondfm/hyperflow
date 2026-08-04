# HyperFlow

Simulador visual interativo de arquitetura de **microsserviços** e **sistemas distribuídos**.

O HyperFlow permite modelar topologias com nós de infraestrutura (API Gateway, Redis, RabbitMQ, PostgreSQL e Workers), observar métricas em tempo real e disparar picos de tráfego para estudar degradação, pressão em filas e comportamento de circuit breakers.

![Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![React Flow](https://img.shields.io/badge/@xyflow/react-12-FF4A00)

---

## Propósito

Ferramenta educacional e de demonstração para times de engenharia que precisam:

- Visualizar o fluxo de requisições entre serviços
- Simular picos de carga (~10k req/min) e ver impacto em RPS, hit rate, profundidade de fila e latência
- Observar sinais de saturação (overflow de fila, circuit breaker aberto, latência alta)
- Experimentar topologias arrastando componentes para um canvas infinito

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| Estilo | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Canvas | `@xyflow/react` (React Flow 12) |
| Estado | Zustand (simulador de carga global) |
| Ícones | Lucide React |

---

## Arquitetura da interface

```
┌─────────────────────────────────────────────────────────────┐
│  Header  ·  HyperFlow  ·  Throughput  ·  Disparar Pico     │
├──────────┬──────────────────────────────┬───────────────────┤
│ Sidebar  │                              │  Telemetria       │
│ Toolbox  │     Canvas infinito          │  · métricas       │
│ (drag)   │     React Flow + nodes       │  · gráfico RPS    │
│          │     edges animadas           │  · event log      │
└──────────┴──────────────────────────────┴───────────────────┘
```

### Nós customizados

| Nó | Indicadores |
| --- | --- |
| **API Gateway / Load Balancer** | RPS, conexões ativas, error rate |
| **Redis Cache** | Hit/Miss rate, memória, keys |
| **RabbitMQ** | Profundidade da fila, publish/consume, alerta de overflow |
| **PostgreSQL** | Latência, queries ativas, conexões, cache hit |
| **Worker** | Status ativo/isolado, Circuit Breaker, processados/s |

### Motor de simulação

O store Zustand (`src/store/simulationStore.ts`) + engine (`src/lib/simulationEngine.ts`):

1. Mantém métricas por nó e histórico de vazão
2. Faz *ticks* periódicos via `useSimulationTicker`
3. No botão **Disparar Pico de 10k req/min**, multiplica a carga (~×10) por ~18s
4. Propaga efeitos: fila sobe (amarelo → vermelho / overflow), latência do PG sobe, circuit breaker pode abrir, edges animam “pacotes”

---

## Como rodar localmente

### Pré-requisitos

- Node.js **20+** (recomendado)
- npm 10+

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Abra o endereço exibido no terminal (geralmente `http://localhost:5173`).

### Build de produção

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Estrutura do projeto

```
src/
├── components/
│   ├── canvas/          # React Flow + edges animadas
│   ├── layout/          # Header, Sidebar, Telemetry, Dashboard
│   ├── nodes/           # Nós customizados de infraestrutura
│   └── telemetry/       # Gráfico de vazão + log stream
├── data/
│   └── initialFlow.ts   # Topologia inicial de referência
├── hooks/
│   └── useSimulationTicker.ts
├── lib/
│   ├── simulationEngine.ts
│   └── utils.ts
├── store/
│   └── simulationStore.ts
├── types/
│   └── nodes.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Uso rápido

1. Explore a topologia padrão no canvas (Gateway → Redis / RabbitMQ / Postgres → Workers)
2. Arraste novos componentes da sidebar para o canvas
3. Conecte nós pelas alças laterais
4. Clique em **Disparar Pico de 10k req/min**
5. Observe telemetria, cores de saúde nos nós e pacotes nas conexões
6. Use **Reset** para voltar ao baseline

---

## Roadmap sugerido

- [ ] Persistência da topologia (localStorage / export JSON)
- [ ] Políticas configuráveis de circuit breaker e DLQ
- [ ] Cenários de falha (partition, slow DB, cache stampede)
- [ ] Replay de traces sintéticos
- [ ] Colaboração multiplayer no canvas

---

## Licença

Projeto de demonstração — uso livre para aprendizado e prototipagem.

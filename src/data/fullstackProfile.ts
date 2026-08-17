/**
 * Conteúdo da aba Full Stack .NET + React.
 *
 * `PROFILE` é o resumo que aparece na tela; o resto do arquivo é o roteiro técnico
 * de cada camada e de cada etapa da entrega.
 */

export const PROFILE = {
  role: 'Full Stack .NET + React',
  headline: 'Engenheiro de Software · Arquiteto hands-on',
  years: '20+ anos',
  /** Recurso usado no exemplo de request — troque para o domínio da vaga (faturas, notas...). */
  resource: 'pedidos',
  tagline:
    '20+ anos de engenharia: do componente React ao índice do SQL Server — com mensageria, teste, quality gate e deploy no caminho.',
  highlights: [
    '.NET 8/9 e ASP.NET Core com Clean Architecture, SOLID, DDD e TDD',
    'Mensageria distribuída: RabbitMQ para fila, Kafka quando preciso de replay',
    'SQL Server, Oracle, MySQL, MongoDB e Redis em cenários críticos',
    'React 19 e Angular 17 no front, TypeScript strict',
    'Docker, Kubernetes, GitHub Actions, SonarQube, Dynatrace e Grafana',
    'WorkBia: ERP SaaS industrial que projetei e desenvolvi com OpenAI, prompt engineering e NLP',
  ],
} as const

export const CloudProviders = {
  Azure: 'azure',
  Aws: 'aws',
  DigitalOcean: 'do',
} as const

export type CloudProvider = (typeof CloudProviders)[keyof typeof CloudProviders]

export const CLOUD_LABEL: Record<CloudProvider, string> = {
  [CloudProviders.Azure]: 'Azure',
  [CloudProviders.Aws]: 'AWS',
  [CloudProviders.DigitalOcean]: 'DigitalOcean',
}

export const CLOUD_SHORT: Record<CloudProvider, string> = {
  [CloudProviders.Azure]: 'Azure',
  [CloudProviders.Aws]: 'AWS',
  [CloudProviders.DigitalOcean]: 'DO',
}

export const RequestKinds = {
  Read: 'read',
  Write: 'write',
  Insight: 'insight',
} as const

export type RequestKind = (typeof RequestKinds)[keyof typeof RequestKinds]

/** Duas formas honestas de fazer a escrita — cada uma promete uma resposta diferente. */
export const WriteStrategies = {
  Outbox: 'outbox',
  QueueFirst: 'queueFirst',
} as const

export type WriteStrategy = (typeof WriteStrategies)[keyof typeof WriteStrategies]

export const WRITE_STRATEGY_META: Record<
  WriteStrategy,
  { label: string; status: string; hint: string; recommended: boolean }
> = {
  [WriteStrategies.Outbox]: {
    label: 'Outbox',
    status: '201',
    hint: 'Padrão de mercado: commit e evento na mesma transação. Cliente recebe o ID na hora; projeção e cache saem fora do tempo da resposta.',
    recommended: true,
  },
  [WriteStrategies.QueueFirst]: {
    label: 'Fila primeiro',
    status: '202',
    hint: 'Quando o requisito é absorver pico ou sobreviver a banco lento. Cliente recebe protocolo, não ID — precisa de endpoint de status.',
    recommended: false,
  },
}

export type LayerIconKey =
  | 'react'
  | 'api'
  | 'application'
  | 'domain'
  | 'messaging'
  | 'redis'
  | 'sql'
  | 'mongo'
  | 'ai'

export interface RuntimeLayer {
  id: string
  title: string
  /** Camada na linguagem de DDD / Clean Architecture. */
  layer: string
  tech: string
  icon: LayerIconKey
  /** Latência simulada em ms. */
  baseMs: number
  /** Em quais tipos de request essa camada entra. */
  kinds: readonly RequestKind[]
  /** O que falar quando o card acender. */
  bullets: readonly string[]
  cloud: Record<CloudProvider, string>
  tags: readonly string[]
}

export const RUNTIME_LAYERS: readonly RuntimeLayer[] = [
  {
    id: 'react',
    title: 'React SPA',
    layer: 'Apresentação',
    tech: 'React 19 + TypeScript (também Angular 17)',
    icon: 'react',
    baseMs: 14,
    kinds: [RequestKinds.Read, RequestKinds.Write, RequestKinds.Insight],
    bullets: [
      'Componente burro: estado de servidor separado do estado de UI',
      'Formulário valida no cliente, mas a regra de verdade mora no domínio',
      'Carregamento, erro e estado vazio são requisito, não detalhe',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Static Web Apps + Front Door',
      [CloudProviders.Aws]: 'S3 + CloudFront',
      [CloudProviders.DigitalOcean]: 'App Platform (static) + Spaces CDN',
    },
    tags: ['React', 'TypeScript', 'Clean Code'],
  },
  {
    id: 'api',
    title: 'API .NET',
    layer: 'Borda / Contrato',
    tech: 'ASP.NET Core · .NET 8/9',
    icon: 'api',
    baseMs: 5,
    kinds: [RequestKinds.Read, RequestKinds.Write, RequestKinds.Insight],
    bullets: [
      'DTO de entrada e saída — entidade de domínio não vaza pela API',
      'Validação no contrato, erro em ProblemDetails, versionamento na rota',
      'JWT e rate limit antes de qualquer regra rodar',
    ],
    cloud: {
      [CloudProviders.Azure]: 'App Service / Container Apps + APIM',
      [CloudProviders.Aws]: 'ECS Fargate + ALB / API Gateway',
      [CloudProviders.DigitalOcean]: 'App Platform / Droplet com Docker',
    },
    tags: ['API', 'ASP.NET Core'],
  },
  {
    id: 'application',
    title: 'Application',
    layer: 'Caso de uso',
    tech: 'Handler CQRS + Unit of Work',
    icon: 'application',
    baseMs: 4,
    kinds: [RequestKinds.Read, RequestKinds.Write, RequestKinds.Insight],
    bullets: [
      'Orquestra o caso de uso — não decide regra de negócio',
      'Transação, idempotência e publicação de evento vivem aqui',
      'Command separado de Query: escrita e leitura têm modelos diferentes',
    ],
    cloud: {
      [CloudProviders.Azure]: 'mesma imagem de container',
      [CloudProviders.Aws]: 'mesma imagem de container',
      [CloudProviders.DigitalOcean]: 'mesma imagem de container',
    },
    tags: ['Clean Architecture', 'CQRS', 'SOLID'],
  },
  {
    id: 'domain',
    title: 'Domain',
    layer: 'Núcleo (DDD)',
    tech: 'Agregado, Entidade, Value Object',
    icon: 'domain',
    baseMs: 2,
    kinds: [RequestKinds.Write],
    bullets: [
      'A invariante é garantida aqui — objeto inválido não existe',
      'Sem EF Core, sem HttpClient: o domínio não conhece infraestrutura',
      'Nome de classe é nome do negócio (linguagem ubíqua)',
      'É a camada que eu escrevo com teste primeiro — TDD paga aqui',
    ],
    cloud: {
      [CloudProviders.Azure]: 'independente de nuvem',
      [CloudProviders.Aws]: 'independente de nuvem',
      [CloudProviders.DigitalOcean]: 'independente de nuvem',
    },
    tags: ['DDD', 'TDD', 'SOLID'],
  },
  {
    id: 'sqlserver',
    title: 'SQL Server',
    layer: 'Persistência transacional',
    tech: 'EF Core + migrations',
    icon: 'sql',
    baseMs: 21,
    kinds: [RequestKinds.Write],
    bullets: [
      'Fonte da verdade da escrita: transação, constraint e índice',
      'Migration versionada no repositório e aplicada no deploy',
      'Consulta olhada no plano de execução — N+1 não passa em review',
      'Mesmo raciocínio quando o legado é Oracle ou MySQL',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Azure SQL Database',
      [CloudProviders.Aws]: 'RDS for SQL Server',
      [CloudProviders.DigitalOcean]: 'Droplet com SQL Server em container (não é gerenciado)',
    },
    tags: ['SQL Server', 'EF Core'],
  },
  {
    id: 'messaging',
    title: 'RabbitMQ / Kafka',
    layer: 'Mensageria',
    tech: 'Outbox + consumidor idempotente',
    icon: 'messaging',
    baseMs: 6,
    kinds: [RequestKinds.Write],
    bullets: [
      'Publicar antes do commit é evento fantasma: anuncia o que talvez não exista',
      'Outbox grava o evento na mesma transação do dado — depois o dispatcher publica',
      'Consumidor idempotente: reprocessar não duplica efeito',
      'RabbitMQ para trabalho por fila; Kafka quando preciso de replay e ordem por partição',
      'Fila primeiro é o oposto: aceito, devolvo 202 e o worker persiste — absorve pico',
      'DLQ com política de retry — mensagem ruim não trava o consumidor',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Service Bus / Event Hubs (Kafka)',
      [CloudProviders.Aws]: 'SQS / Amazon MSK (Kafka)',
      [CloudProviders.DigitalOcean]: 'RabbitMQ em DOKS / Droplet',
    },
    tags: ['RabbitMQ', 'Kafka', 'Resiliência'],
  },
  {
    id: 'mongo',
    title: 'MongoDB',
    layer: 'Read model / projeção',
    tech: 'Documento pronto para a tela',
    icon: 'mongo',
    baseMs: 7,
    kinds: [RequestKinds.Read, RequestKinds.Write, RequestKinds.Insight],
    bullets: [
      'Leitura sai de um documento já montado — sem join caro',
      'Projeção atualizada pelo evento de domínio da escrita',
      'Consistência eventual assumida no contrato, não escondida',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Cosmos DB for MongoDB',
      [CloudProviders.Aws]: 'DocumentDB',
      [CloudProviders.DigitalOcean]: 'Managed MongoDB',
    },
    tags: ['MongoDB', 'CQRS'],
  },
  {
    id: 'redis',
    title: 'Redis',
    layer: 'Infra · Cache-aside',
    tech: 'StackExchange.Redis',
    icon: 'redis',
    baseMs: 2,
    kinds: [RequestKinds.Read, RequestKinds.Write, RequestKinds.Insight],
    bullets: [
      'Cache-aside: procura no cache, cai na fonte, popula de volta',
      'TTL curto + invalidação por evento — cache velho é bug silencioso',
      'Chave versionada para não servir contrato antigo depois do deploy',
      'No fluxo de IA, guarda a resposta: mesma pergunta não paga token duas vezes',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Azure Cache for Redis',
      [CloudProviders.Aws]: 'ElastiCache (Redis)',
      [CloudProviders.DigitalOcean]: 'Managed Redis',
    },
    tags: ['Redis', 'Performance', 'FinOps'],
  },
  {
    id: 'ai',
    title: 'IA · OpenAI',
    layer: 'Insight (WorkBia)',
    tech: 'GPT + prompt engineering + NLP',
    icon: 'ai',
    baseMs: 890,
    kinds: [RequestKinds.Insight],
    bullets: [
      'Prompt é código: versionado, revisado em PR e testado com caso de regressão',
      'Saída validada contra schema antes de virar dado — não confio no texto cru',
      'Timeout, retry e fallback: IA fora do ar não derruba o fluxo do usuário',
      'Custo por token é requisito — cache e limite de contexto entram no design',
      'É o coração do WorkBia: dado bruto do ERP virando decisão de negócio',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Azure OpenAI Service',
      [CloudProviders.Aws]: 'Amazon Bedrock / OpenAI API',
      [CloudProviders.DigitalOcean]: 'OpenAI API direto (sem serviço gerenciado)',
    },
    tags: ['OpenAI', 'NLP', 'Prompt Engineering'],
  },
] as const

export type PipelineIconKey =
  | 'github'
  | 'build'
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'load'
  | 'sonar'
  | 'deploy'
  | 'observability'

export interface PipelineStep {
  id: string
  title: string
  subtitle: string
  icon: PipelineIconKey
  /** Duração simulada da etapa, em ms de animação. */
  durationMs: number
  bullets: readonly string[]
  cloud: Record<CloudProvider, string>
  tags: readonly string[]
}

export const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    id: 'github',
    title: 'GitHub',
    subtitle: 'Pull request',
    icon: 'github',
    durationMs: 420,
    bullets: [
      'Trunk-based, PR pequeno e revisável — não PR de 40 arquivos',
      'Branch protegida: sem review e sem check verde, não entra',
      'Commit descreve intenção; histórico é documentação',
    ],
    cloud: {
      [CloudProviders.Azure]: 'GitHub Actions / Azure DevOps',
      [CloudProviders.Aws]: 'GitHub Actions / CodePipeline',
      [CloudProviders.DigitalOcean]: 'GitHub Actions',
    },
    tags: ['GitHub', 'Code Review'],
  },
  {
    id: 'build',
    title: 'Build',
    subtitle: 'dotnet build + vite build',
    icon: 'build',
    durationMs: 600,
    bullets: [
      'Warning como erro: o compilador é o primeiro revisor',
      'Front e back no mesmo workflow YML — quebra em um trava o outro',
      'Imagem Docker versionada pelo SHA do commit',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Azure Container Registry',
      [CloudProviders.Aws]: 'Amazon ECR',
      [CloudProviders.DigitalOcean]: 'DO Container Registry',
    },
    tags: ['GitHub Actions', 'Docker'],
  },
  {
    id: 'unit',
    title: 'Testes de unidade',
    subtitle: 'xUnit + Vitest (TDD/BDD)',
    icon: 'unit',
    durationMs: 620,
    bullets: [
      'Teste primeiro na regra de negócio — o domínio nasce testado',
      'Cenário escrito em linguagem de negócio (BDD) quando a regra é discutida com o time',
      'Rápido e sem infraestrutura: roda em segundos, roda sempre',
    ],
    cloud: {
      [CloudProviders.Azure]: 'runner do GitHub Actions',
      [CloudProviders.Aws]: 'runner do GitHub Actions',
      [CloudProviders.DigitalOcean]: 'runner do GitHub Actions',
    },
    tags: ['TDD', 'BDD', 'xUnit'],
  },
  {
    id: 'integration',
    title: 'Teste integrado',
    subtitle: 'WebApplicationFactory + Testcontainers',
    icon: 'integration',
    durationMs: 880,
    bullets: [
      'Sobe SQL Server, Redis, Mongo e RabbitMQ em container e testa de verdade',
      'Pega o que o unitário não pega: mapeamento, migration, serialização',
      'Sem mock de banco mentindo que está tudo bem',
    ],
    cloud: {
      [CloudProviders.Azure]: 'container job no pipeline',
      [CloudProviders.Aws]: 'container job no pipeline',
      [CloudProviders.DigitalOcean]: 'container job no pipeline',
    },
    tags: ['Teste integrado', 'Testcontainers'],
  },
  {
    id: 'e2e',
    title: 'E2E',
    subtitle: 'Cypress no fluxo crítico',
    icon: 'e2e',
    durationMs: 780,
    bullets: [
      'Fluxo crítico testado no navegador, não na intenção',
      'Ambiente efêmero com dado semeado — sem depender de base compartilhada',
      'Poucos e estáveis: E2E flaky é pior que E2E ausente',
    ],
    cloud: {
      [CloudProviders.Azure]: 'slot de staging',
      [CloudProviders.Aws]: 'ambiente efêmero no ECS',
      [CloudProviders.DigitalOcean]: 'app de preview',
    },
    tags: ['Cypress', 'Qualidade'],
  },
  {
    id: 'load',
    title: 'Teste de carga',
    subtitle: 'K6 com p95 como critério',
    icon: 'load',
    durationMs: 760,
    bullets: [
      'Carga no pipeline: p95 e taxa de erro são critério de aceite, não curiosidade',
      'Compara com o baseline da versão anterior — regressão de performance é bug',
      'É aqui que eu acho o gargalo antes do cliente achar (a aba Arquitetura mostra o efeito)',
    ],
    cloud: {
      [CloudProviders.Azure]: 'job de carga + Application Insights',
      [CloudProviders.Aws]: 'job de carga + CloudWatch',
      [CloudProviders.DigitalOcean]: 'job de carga + Grafana',
    },
    tags: ['K6', 'Performance'],
  },
  {
    id: 'sonar',
    title: 'SonarQube',
    subtitle: 'Quality gate',
    icon: 'sonar',
    durationMs: 800,
    bullets: [
      'Gate no PR: cobertura do código novo, duplicação, security hotspot',
      'Gate vermelho bloqueia merge — qualidade não é combinado verbal',
      'Dívida técnica fica visível e priorizada, não no boca a boca',
    ],
    cloud: {
      [CloudProviders.Azure]: 'SonarCloud / SonarQube self-hosted',
      [CloudProviders.Aws]: 'SonarCloud / SonarQube self-hosted',
      [CloudProviders.DigitalOcean]: 'SonarQube em Droplet',
    },
    tags: ['SonarQube', 'Clean Code'],
  },
  {
    id: 'deploy',
    title: 'Deploy',
    subtitle: 'Docker + Kubernetes',
    icon: 'deploy',
    durationMs: 800,
    bullets: [
      'Rolling update no Kubernetes com health check e readiness probe',
      'Migration compatível com a versão anterior — deploy sem downtime',
      'Rollback é botão, não milagre. Segredo em cofre, nunca no appsettings',
    ],
    cloud: {
      [CloudProviders.Azure]: 'AKS / Container Apps + Key Vault',
      [CloudProviders.Aws]: 'EKS / ECS Fargate + Secrets Manager',
      [CloudProviders.DigitalOcean]: 'DOKS / App Platform',
    },
    tags: ['Kubernetes', 'CD'],
  },
  {
    id: 'observability',
    title: 'Observabilidade',
    subtitle: 'Dynatrace + Grafana',
    icon: 'observability',
    durationMs: 620,
    bullets: [
      'OpenTelemetry + Serilog com correlation id ponta a ponta',
      'Dashboard no Grafana, trace e diagnóstico no Dynatrace',
      'Alerta em cima de sintoma do usuário: erro, latência, fila crescendo',
      'Sem isso, o próximo incidente vira achismo',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Application Insights + Grafana',
      [CloudProviders.Aws]: 'CloudWatch + X-Ray + Grafana',
      [CloudProviders.DigitalOcean]: 'Grafana self-hosted',
    },
    tags: ['Dynatrace', 'Grafana', 'Observabilidade'],
  },
] as const

/** Regra do quality gate usada na simulação. */
export const QUALITY_GATE = {
  minCoverage: 80,
  /** Antes de aplicar TDD. */
  coverageBefore: 71.4,
  smellsBefore: 7,
  /** Depois de escrever o teste que faltava. */
  coverageAfter: 86.2,
  smellsAfter: 1,
} as const

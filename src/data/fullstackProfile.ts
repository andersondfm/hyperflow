/**
 * Conteúdo da aba Full Stack .NET + React.
 *
 * Personalize `PROFILE` com os dados do seu currículo antes da apresentação:
 * o restante do arquivo é o roteiro técnico que aparece na tela.
 */

export const PROFILE = {
  role: 'Full Stack .NET + React',
  /** Recurso usado no exemplo de request — mantém o mesmo domínio do canvas de arquitetura. */
  resource: 'pedidos',
  /** Aparece no cabeçalho da aba. Ajuste para o seu tempo de casa / domínio. */
  tagline: 'Do componente React ao índice do SQL Server — com teste, gate e deploy no caminho',
} as const

export const CloudProviders = {
  Azure: 'azure',
  Aws: 'aws',
} as const

export type CloudProvider = (typeof CloudProviders)[keyof typeof CloudProviders]

export const CLOUD_LABEL: Record<CloudProvider, string> = {
  [CloudProviders.Azure]: 'Azure',
  [CloudProviders.Aws]: 'AWS',
}

export const RequestKinds = {
  Read: 'read',
  Write: 'write',
} as const

export type RequestKind = (typeof RequestKinds)[keyof typeof RequestKinds]

export type LayerIconKey =
  | 'react'
  | 'api'
  | 'application'
  | 'domain'
  | 'redis'
  | 'sql'
  | 'mongo'

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
    tech: 'React 19 + TypeScript',
    icon: 'react',
    baseMs: 14,
    kinds: [RequestKinds.Read, RequestKinds.Write],
    bullets: [
      'Componente burro, estado de servidor separado do estado de UI',
      'Formulário valida no cliente, mas a regra de verdade mora no domínio',
      'Estado de carregamento e erro são requisito, não detalhe',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Static Web Apps + Front Door',
      [CloudProviders.Aws]: 'S3 + CloudFront',
    },
    tags: ['Clean Code', 'TypeScript strict'],
  },
  {
    id: 'api',
    title: 'API .NET',
    layer: 'Borda / Contrato',
    tech: 'ASP.NET Core · Minimal API',
    icon: 'api',
    baseMs: 5,
    kinds: [RequestKinds.Read, RequestKinds.Write],
    bullets: [
      'DTO de entrada e saída — entidade de domínio não vaza pela API',
      'Validação no contrato, erro em ProblemDetails, versionamento na rota',
      'Autenticação JWT e rate limit antes de qualquer regra rodar',
    ],
    cloud: {
      [CloudProviders.Azure]: 'App Service / Container Apps + APIM',
      [CloudProviders.Aws]: 'ECS Fargate + ALB / API Gateway',
    },
    tags: ['API', 'Clean Code'],
  },
  {
    id: 'application',
    title: 'Application',
    layer: 'Caso de uso',
    tech: 'Handler / CQRS + Unit of Work',
    icon: 'application',
    baseMs: 4,
    kinds: [RequestKinds.Read, RequestKinds.Write],
    bullets: [
      'Orquestra o caso de uso — não decide regra de negócio',
      'Transação, idempotência e publicação de evento vivem aqui',
      'Command separado de Query: escrita e leitura têm modelos diferentes',
    ],
    cloud: {
      [CloudProviders.Azure]: 'mesma imagem de container',
      [CloudProviders.Aws]: 'mesma imagem de container',
    },
    tags: ['DDD', 'CQRS'],
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
      'Domain Event sai daqui e alimenta a projeção de leitura',
    ],
    cloud: {
      [CloudProviders.Azure]: 'independente de nuvem',
      [CloudProviders.Aws]: 'independente de nuvem',
    },
    tags: ['DDD', 'TDD'],
  },
  {
    id: 'redis',
    title: 'Redis',
    layer: 'Infra · Cache-aside',
    tech: 'StackExchange.Redis',
    icon: 'redis',
    baseMs: 2,
    kinds: [RequestKinds.Read],
    bullets: [
      'Cache-aside: procura no cache, cai na fonte, popula de volta',
      'TTL curto + invalidação por evento — cache velho é bug silencioso',
      'Chave versionada para não servir contrato antigo depois do deploy',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Azure Cache for Redis',
      [CloudProviders.Aws]: 'ElastiCache (Redis)',
    },
    tags: ['Redis', 'Performance'],
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
    ],
    cloud: {
      [CloudProviders.Azure]: 'Azure SQL Database',
      [CloudProviders.Aws]: 'RDS for SQL Server',
    },
    tags: ['SQL Server', 'EF Core'],
  },
  {
    id: 'mongo',
    title: 'MongoDB',
    layer: 'Read model / projeção',
    tech: 'Documento pronto para a tela',
    icon: 'mongo',
    baseMs: 7,
    kinds: [RequestKinds.Read, RequestKinds.Write],
    bullets: [
      'Leitura sai de um documento já montado — sem join caro',
      'Projeção atualizada pelo evento de domínio da escrita',
      'Consistência eventual assumida no contrato, não escondida',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Cosmos DB for MongoDB',
      [CloudProviders.Aws]: 'DocumentDB',
    },
    tags: ['MongoDB', 'CQRS'],
  },
] as const

export type PipelineIconKey =
  | 'github'
  | 'build'
  | 'unit'
  | 'integration'
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
    durationMs: 500,
    bullets: [
      'Trunk-based, PR pequeno e revisável — não PR de 40 arquivos',
      'Branch protegida: sem review e sem check verde, não entra',
      'Commit descreve intenção; histórico é documentação',
    ],
    cloud: {
      [CloudProviders.Azure]: 'GitHub Actions / Azure DevOps',
      [CloudProviders.Aws]: 'GitHub Actions / CodePipeline',
    },
    tags: ['GitHub', 'Code Review'],
  },
  {
    id: 'build',
    title: 'Build',
    subtitle: 'dotnet build + vite build',
    icon: 'build',
    durationMs: 700,
    bullets: [
      'Warning como erro: o compilador é o primeiro revisor',
      'Front e back no mesmo pipeline — quebra em um trava o outro',
      'Imagem Docker versionada pelo SHA do commit',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Azure Container Registry',
      [CloudProviders.Aws]: 'Amazon ECR',
    },
    tags: ['CI', 'Docker'],
  },
  {
    id: 'unit',
    title: 'Testes de unidade',
    subtitle: 'xUnit + Vitest (TDD)',
    icon: 'unit',
    durationMs: 800,
    bullets: [
      'Teste primeiro na regra de negócio — o domínio nasce testado',
      'Rápido e sem infraestrutura: roda em segundos, roda sempre',
      'Cobertura é sintoma, não meta; o alvo é a regra crítica coberta',
    ],
    cloud: {
      [CloudProviders.Azure]: 'runner do GitHub Actions',
      [CloudProviders.Aws]: 'runner do GitHub Actions',
    },
    tags: ['TDD', 'xUnit'],
  },
  {
    id: 'integration',
    title: 'Teste integrado',
    subtitle: 'WebApplicationFactory + Testcontainers',
    icon: 'integration',
    durationMs: 1_100,
    bullets: [
      'Sobe SQL Server, Redis e Mongo em container e testa de verdade',
      'Pega o que o unitário não pega: mapeamento, migration, serialização',
      'Sem mock de banco mentindo que está tudo bem',
    ],
    cloud: {
      [CloudProviders.Azure]: 'container job no pipeline',
      [CloudProviders.Aws]: 'container job no pipeline',
    },
    tags: ['Teste integrado', 'Testcontainers'],
  },
  {
    id: 'sonar',
    title: 'SonarQube',
    subtitle: 'Quality gate',
    icon: 'sonar',
    durationMs: 900,
    bullets: [
      'Gate no PR: cobertura do código novo, duplicação, security hotspot',
      'Gate vermelho bloqueia merge — qualidade não é combinado verbal',
      'Dívida técnica fica visível e priorizada, não no boca a boca',
    ],
    cloud: {
      [CloudProviders.Azure]: 'SonarCloud / SonarQube self-hosted',
      [CloudProviders.Aws]: 'SonarCloud / SonarQube self-hosted',
    },
    tags: ['Sonar', 'Clean Code'],
  },
  {
    id: 'deploy',
    title: 'Deploy',
    subtitle: 'Blue/green + migration',
    icon: 'deploy',
    durationMs: 900,
    bullets: [
      'Migration compatível com a versão anterior — deploy sem downtime',
      'Health check antes de receber tráfego; rollback é botão, não milagre',
      'Segredo em cofre, nunca no appsettings do repositório',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Container Apps + Key Vault',
      [CloudProviders.Aws]: 'ECS Fargate + Secrets Manager',
    },
    tags: ['Cloud', 'CD'],
  },
  {
    id: 'observability',
    title: 'Observabilidade',
    subtitle: 'Log, métrica e trace',
    icon: 'observability',
    durationMs: 700,
    bullets: [
      'OpenTelemetry + Serilog com correlation id ponta a ponta',
      'Alerta em cima de sintoma do usuário: erro, latência, fila',
      'Sem isso, o próximo incidente vira achismo',
    ],
    cloud: {
      [CloudProviders.Azure]: 'Application Insights',
      [CloudProviders.Aws]: 'CloudWatch + X-Ray',
    },
    tags: ['Observabilidade', 'SRE'],
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

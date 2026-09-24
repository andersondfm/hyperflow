export const Lifetimes = {
  Transient: 'transient',
  Scoped: 'scoped',
  Singleton: 'singleton',
} as const

export type Lifetime = (typeof Lifetimes)[keyof typeof Lifetimes]

export interface LifetimeGuide {
  id: Lifetime
  title: string
  rule: string
  /** Instâncias vistas em: request 1 (duas resoluções) e request 2 (uma resolução). */
  instances: readonly [string, string, string]
  where: readonly string[]
  register: string
  refused: string
  because: readonly string[]
}

export const LIFETIME_GUIDES: readonly LifetimeGuide[] = [
  {
    id: Lifetimes.Transient,
    title: 'Transient',
    rule: 'Uma instância nova em cada injeção.',
    instances: ['#1', '#2', '#3'],
    where: [
      'Validador sem estado, mapeador, política pura.',
      'Strategy que não guarda campo entre chamadas.',
      'Qualquer classe barata de criar e que não segura conexão.',
    ],
    register: 'builder.Services.AddTransient<IOrderPolicy, OrderPolicy>();',
    refused: 'DbContext, HttpClient e Redis como Transient',
    because: [
      'DbContext transient no mesmo request vira duas unidades de trabalho. O que um viu, o outro não commitou.',
      'new HttpClient() a cada resolve esgota socket. No .NET 9 eu registro IHttpClientFactory, e o factory é singleton.',
      'Transient serve para objeto leve. Conexão não é objeto leve.',
    ],
  },
  {
    id: Lifetimes.Scoped,
    title: 'Scoped',
    rule: 'Uma instância por request HTTP. A próxima request ganha outra.',
    instances: ['#1', '#1', '#2'],
    where: [
      'AppDbContext. AddDbContext já registra como Scoped.',
      'Unit of Work e repositório que guardam esse contexto.',
      'Handler do caso de uso (criar pedido, importar lote): vive e morre com a request.',
      'Usuário atual lido do token, dentro desta request.',
    ],
    register: `builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<CreateOrderHandler>();`,
    refused: 'Injetar Scoped dentro de Singleton',
    because: [
      'O Singleton é criado uma vez e segura o Scoped para sempre. O DbContext não é thread-safe e ainda fica obsoleto.',
      'O container do .NET avisa isso em desenvolvimento. Em produção, vira dado cruzado entre requests.',
      'BackgroundService é Singleton. Lá dentro eu abro um escopo com IServiceScopeFactory.CreateScope() a cada ciclo.',
    ],
  },
  {
    id: Lifetimes.Singleton,
    title: 'Singleton',
    rule: 'Uma instância para o processo inteiro. Toda request vê a mesma.',
    instances: ['#1', '#1', '#1'],
    where: [
      'IMemoryCache e HybridCache: o cache precisa sobreviver à request.',
      'ConnectionMultiplexer do Redis. Criar um por request é o jeito lento de usar Redis.',
      'IHttpClientFactory e IOptions<T>: configuração lida uma vez, thread-safe.',
      'Tabela de rate limit em memória, se o limite é do processo e não do usuário.',
    ],
    register: `builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(redis));

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<ICepClient, CepClient>();`,
    refused: 'Singleton com campo que muda por request',
    because: [
      'Tem que ser thread-safe. Duas requests escrevendo no mesmo campo sem lock corrompem estado.',
      'Não guarda DbContext, não guarda HttpContext, não guarda o usuário logado.',
      'Se o dado é da request, o lifetime é Scoped. Singleton é infraestrutura compartilhada.',
    ],
  },
]

export const OTHER_REGISTRATIONS: readonly { title: string; text: string }[] = [
  {
    title: 'IHttpClientFactory',
    text: 'O factory é singleton. O client tipado é criado pelo factory. Eu não dou new HttpClient() e não guardo um client estático para sempre: DNS velho é o bug silencioso.',
  },
  {
    title: 'BackgroundService',
    text: 'O hosted service é singleton. Para usar DbContext no loop, crio um escopo novo a cada volta. Sem isso, o contexto vive o tempo do processo.',
  },
  {
    title: 'Keyed services (.NET 8, segue no 9)',
    text: 'Dois clientes HTTP com a mesma interface: AddKeyedScoped ou FromKeyedServices("erp"). Uso quando o tipo é o mesmo e o destino muda.',
  },
  {
    title: 'IOptionsMonitor<T>',
    text: 'Opções são singleton. Monitor enxerga mudança de configuração sem reiniciar o processo. Não leio appsettings com File.Read dentro do handler.',
  },
]

import { NodeKinds } from '@/types/nodes'
import { ApiGatewayNode } from './ApiGatewayNode'
import { RedisNode } from './RedisNode'
import { RabbitMQNode } from './RabbitMQNode'
import { PostgresNode } from './PostgresNode'
import { WorkerNode } from './WorkerNode'
import { ContainerNode } from './ContainerNode'
import { IntegrationTestNode } from './IntegrationTestNode'
import { SonarNode } from './SonarNode'
import { DlqNode } from './DlqNode'

export const nodeTypes = {
  [NodeKinds.ApiGateway]: ApiGatewayNode,
  [NodeKinds.Redis]: RedisNode,
  [NodeKinds.RabbitMQ]: RabbitMQNode,
  [NodeKinds.Postgres]: PostgresNode,
  [NodeKinds.Worker]: WorkerNode,
  [NodeKinds.Container]: ContainerNode,
  [NodeKinds.IntegrationTest]: IntegrationTestNode,
  [NodeKinds.Sonar]: SonarNode,
  [NodeKinds.Dlq]: DlqNode,
} as const

export {
  ApiGatewayNode,
  RedisNode,
  RabbitMQNode,
  PostgresNode,
  WorkerNode,
  ContainerNode,
  IntegrationTestNode,
  SonarNode,
  DlqNode,
}

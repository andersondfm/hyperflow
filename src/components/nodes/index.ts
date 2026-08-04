import { NodeKinds } from '@/types/nodes'
import { ApiGatewayNode } from './ApiGatewayNode'
import { RedisNode } from './RedisNode'
import { RabbitMQNode } from './RabbitMQNode'
import { PostgresNode } from './PostgresNode'
import { WorkerNode } from './WorkerNode'

export const nodeTypes = {
  [NodeKinds.ApiGateway]: ApiGatewayNode,
  [NodeKinds.Redis]: RedisNode,
  [NodeKinds.RabbitMQ]: RabbitMQNode,
  [NodeKinds.Postgres]: PostgresNode,
  [NodeKinds.Worker]: WorkerNode,
} as const

export {
  ApiGatewayNode,
  RedisNode,
  RabbitMQNode,
  PostgresNode,
  WorkerNode,
}

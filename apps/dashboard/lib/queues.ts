import { Queue } from "bullmq";
import { Redis } from "ioredis";

/**
 * Process-wide Redis connection and BullMQ queues for the dashboard.
 * Route handlers must not open a new connection per request.
 */
let redisClient: Redis | null = null;

export function getSharedRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return redisClient;
}

const queues = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection: getSharedRedis() });
    queues.set(name, queue);
  }
  return queue;
}

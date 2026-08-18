import { invalidateGuildConfigCache, onGuildConfigChanged } from "@sentinel/database";
import { getRedis, publishConfigUpdate } from "./redis.js";

const CONFIG_CHANNEL_PREFIX = "mrx:config:";

export function bindGuildConfigPublish(): void {
  onGuildConfigChanged((guildId) => {
    void publishConfigUpdate(guildId).catch(() => undefined);
  });
}

export function startConfigCacheInvalidation(): void {
  const subscriber = getRedis().duplicate();
  void subscriber.psubscribe(`${CONFIG_CHANNEL_PREFIX}*`).catch(() => undefined);
  subscriber.on("pmessage", (_pattern: string, channel: string) => {
    if (!channel.startsWith(CONFIG_CHANNEL_PREFIX)) return;
    const guildId = channel.slice(CONFIG_CHANNEL_PREFIX.length);
    if (guildId) invalidateGuildConfigCache(guildId);
  });
}

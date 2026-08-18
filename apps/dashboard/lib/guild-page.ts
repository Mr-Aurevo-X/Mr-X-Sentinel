import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getGuildConfig, prisma } from "@sentinel/database";
import type { GuildConfig } from "@sentinel/shared";
import { authOptions, canManageGuild } from "@/lib/auth";
import { getSharedRedis } from "@/lib/queues";

export async function requireGuildAccess(guildId: string): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!(await canManageGuild(guildId))) redirect("/guilds");
}

async function redisLockdown(guildId: string): Promise<boolean> {
  try {
    const val = await getSharedRedis().get(`mrx:lockdown:${guildId}`);
    return val === "1";
  } catch {
    return false;
  }
}

export async function loadGuildConfigPage(guildId: string): Promise<{
  config: GuildConfig;
  lockdown: boolean;
}> {
  await requireGuildAccess(guildId);
  const config = await getGuildConfig(guildId);
  let guild = await prisma.guild.findUnique({ where: { id: guildId } });
  if (!guild) {
    guild = await prisma.guild.create({
      data: { id: guildId, config: config as object },
    });
  }
  const lockdown = guild.lockdown || (await redisLockdown(guildId));
  return { config, lockdown };
}

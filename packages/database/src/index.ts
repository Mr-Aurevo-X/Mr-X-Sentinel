import { PrismaClient } from "@prisma/client";
import {
  defaultGuildConfig,
  parseGuildConfig,
  type GuildConfig,
} from "@sentinel/shared";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function getOrCreateGuild(guildId: string) {
  const existing = await prisma.guild.findUnique({ where: { id: guildId } });
  if (existing) return existing;

  return prisma.guild.create({
    data: {
      id: guildId,
      config: defaultGuildConfig() as object,
    },
  });
}

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  const guild = await getOrCreateGuild(guildId);
  return parseGuildConfig(guild.config);
}

export async function updateGuildConfig(
  guildId: string,
  patch: Partial<GuildConfig>,
): Promise<GuildConfig> {
  const current = await getGuildConfig(guildId);
  const merged = parseGuildConfig({ ...current, ...patch });
  await prisma.guild.update({
    where: { id: guildId },
    data: { config: merged as object },
  });
  return merged;
}

export async function isWhitelisted(
  guildId: string,
  userId: string,
  ownerId: string,
): Promise<{ whitelisted: boolean; level: "OWNER" | "EXTRA_OWNER" | "TRUSTED" | null }> {
  if (userId === ownerId) {
    return { whitelisted: true, level: "OWNER" };
  }
  const entry = await prisma.whitelistEntry.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
  if (!entry) return { whitelisted: false, level: null };
  return { whitelisted: true, level: entry.level };
}

export async function nextCaseNumber(guildId: string): Promise<number> {
  const last = await prisma.modCase.findFirst({
    where: { guildId },
    orderBy: { caseNumber: "desc" },
    select: { caseNumber: true },
  });
  return (last?.caseNumber ?? 0) + 1;
}

export * from "@prisma/client";

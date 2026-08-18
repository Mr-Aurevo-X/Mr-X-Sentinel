import { prisma } from "@sentinel/database";
import { SecurityPanel } from "@/components/panels/SecurityPanel";
import { loadGuildConfigPage } from "@/lib/guild-page";

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { config } = await loadGuildConfigPage(guildId);
  const [whitelist, cases] = await Promise.all([
    prisma.whitelistEntry.findMany({ where: { guildId } }),
    prisma.modCase.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        caseNumber: true,
        type: true,
        targetId: true,
        moderatorId: true,
        reason: true,
        active: true,
        createdAt: true,
      },
    }),
  ]);
  return (
    <SecurityPanel
      guildId={guildId}
      initialConfig={config}
      whitelist={whitelist}
      cases={cases.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
    />
  );
}

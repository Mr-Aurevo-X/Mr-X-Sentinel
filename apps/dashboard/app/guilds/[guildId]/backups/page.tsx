import { prisma } from "@sentinel/database";
import { BackupsPanel } from "@/components/panels/BackupsPanel";
import { requireGuildAccess } from "@/lib/guild-page";

export default async function BackupsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);
  const snapshots = await prisma.snapshot.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, label: true, createdAt: true, sizeBytes: true },
  });
  return (
    <BackupsPanel
      guildId={guildId}
      snapshots={snapshots.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
    />
  );
}

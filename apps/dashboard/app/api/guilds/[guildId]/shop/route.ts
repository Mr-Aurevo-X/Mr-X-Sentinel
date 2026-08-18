import { NextResponse } from "next/server";
import { prisma } from "@sentinel/database";
import { assertCanManageGuild } from "@/lib/auth";

const SNOWFLAKE = /^\d{17,20}$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const items = await prisma.shopItem.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const body = (await req.json()) as { name?: string; price?: number; roleId?: string | null };
  const name = body.name?.trim() ?? "";
  const price = Number(body.price);
  const roleId = body.roleId?.trim() || null;
  if (!name || !Number.isInteger(price) || price < 1) {
    return NextResponse.json({ error: "name or price invalid" }, { status: 400 });
  }
  if (roleId && !SNOWFLAKE.test(roleId)) {
    return NextResponse.json({ error: "roleId invalid" }, { status: 400 });
  }
  const item = await prisma.shopItem.create({
    data: { guildId, name: name.slice(0, 80), price, roleId },
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const denied = await assertCanManageGuild(guildId);
  if (denied) return denied;
  const itemId = new URL(req.url).searchParams.get("itemId") ?? "";
  if (!itemId) return NextResponse.json({ error: "itemId invalid" }, { status: 400 });
  await prisma.shopItem.deleteMany({ where: { id: itemId, guildId } });
  return NextResponse.json({ ok: true });
}

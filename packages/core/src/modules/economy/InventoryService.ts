import { prisma } from "@sentinel/database";
import { formatMoney, REDIS_KEYS, SHOP_CATALOG, type ShopCatalogEntry } from "@sentinel/shared";
import { getRedis } from "../../redis.js";
import { economyService } from "./EconomyService.js";

const ROB_PAIR_COOLDOWN_SEC = 3600;
const SHIELD_DURATION_MS = 86_400_000;

export class InventoryService {
  async list(guildId: string, userId: string) {
    await economyService.getOrCreateWallet(guildId, userId);
    const rows = await prisma.userInventoryItem.findMany({
      where: { guildId, userId },
      orderBy: { itemKey: "asc" },
    });
    return rows
      .map((r) => {
        const entry = SHOP_CATALOG[r.itemKey];
        if (!entry) return null;
        return { key: r.itemKey, entry, qty: r.quantity };
      })
      .filter((x): x is { key: string; entry: ShopCatalogEntry; qty: number } => x != null);
  }

  async addItem(guildId: string, userId: string, itemKey: string, quantity = 1) {
    await economyService.getOrCreateWallet(guildId, userId);
    await prisma.userInventoryItem.upsert({
      where: { guildId_userId_itemKey: { guildId, userId, itemKey } },
      create: { guildId, userId, itemKey, quantity },
      update: { quantity: { increment: quantity } },
    });
  }

  async buyCatalog(guildId: string, userId: string, itemKey: string) {
    const entry = SHOP_CATALOG[itemKey];
    if (!entry) throw new Error("Article inconnu.");
    const wallet = await economyService.getOrCreateWallet(guildId, userId);
    if (wallet.cash < entry.price) {
      throw new Error(`Pas assez d'argent. Il te manque ${formatMoney(entry.price - wallet.cash)}.`);
    }
    await prisma.userWallet.update({
      where: { guildId_userId: { guildId, userId } },
      data: { cash: { decrement: entry.price } },
    });
    await this.addItem(guildId, userId, itemKey);
    return entry;
  }

  async useItem(guildId: string, userId: string, itemKey: string) {
    const entry = SHOP_CATALOG[itemKey];
    if (!entry) throw new Error("Article inconnu.");
    const row = await prisma.userInventoryItem.findUnique({
      where: { guildId_userId_itemKey: { guildId, userId, itemKey } },
    });
    if (!row || row.quantity < 1) throw new Error("Tu n'as pas cet objet.");

    if (entry.effect === "shield") {
      await prisma.userWallet.update({
        where: { guildId_userId: { guildId, userId } },
        data: { robShieldUntil: new Date(Date.now() + SHIELD_DURATION_MS) },
      });
    } else if (entry.effect === "mystery") {
      const reward = Math.floor(Math.random() * 2000) + 200;
      await prisma.userWallet.update({
        where: { guildId_userId: { guildId, userId } },
        data: { cash: { increment: reward } },
      });
    }

    if (row.quantity <= 1) {
      await prisma.userInventoryItem.delete({
        where: { guildId_userId_itemKey: { guildId, userId, itemKey } },
      });
    } else {
      await prisma.userInventoryItem.update({
        where: { guildId_userId_itemKey: { guildId, userId, itemKey } },
        data: { quantity: { decrement: 1 } },
      });
    }
    return entry;
  }

  async hasRobShield(guildId: string, userId: string): Promise<boolean> {
    const w = await economyService.getOrCreateWallet(guildId, userId);
    return w.robShieldUntil != null && w.robShieldUntil.getTime() > Date.now();
  }

  async checkRobPairCooldown(guildId: string, thiefId: string, victimId: string): Promise<void> {
    const redis = getRedis();
    const key = REDIS_KEYS.robCooldown(guildId, thiefId, victimId);
    const exists = await redis.get(key);
    if (exists) throw new Error("Tu as déjà braqué cette personne récemment. Attends 1h.");
  }

  async setRobPairCooldown(guildId: string, thiefId: string, victimId: string): Promise<void> {
    const redis = getRedis();
    await redis.setex(REDIS_KEYS.robCooldown(guildId, thiefId, victimId), ROB_PAIR_COOLDOWN_SEC, "1");
  }
}

export const inventoryService = new InventoryService();

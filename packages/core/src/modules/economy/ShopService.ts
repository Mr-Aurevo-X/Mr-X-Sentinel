import { prisma } from "@sentinel/database";
import type { Client, GuildMember } from "discord.js";
import { economyService } from "./EconomyService.js";
import { logService } from "../../services/LogService.js";

export class ShopService {
  async list(guildId: string) {
    return prisma.shopItem.findMany({ where: { guildId }, orderBy: { price: "asc" } });
  }

  async add(guildId: string, name: string, price: number, roleId?: string) {
    return prisma.shopItem.create({ data: { guildId, name, price, roleId: roleId ?? null } });
  }

  async buy(member: GuildMember, itemId: string, client: Client) {
    const item = await prisma.shopItem.findFirst({
      where: { id: itemId, guildId: member.guild.id },
    });
    if (!item) throw new Error("Article introuvable.");
    const wallet = await economyService.getOrCreateWallet(member.guild.id, member.id);
    if (wallet.cash < item.price) throw new Error("Pas assez de coins.");
    await prisma.userWallet.update({
      where: { guildId_userId: { guildId: member.guild.id, userId: member.id } },
      data: { cash: { decrement: item.price } },
    });
    if (item.roleId) {
      await member.roles.add(item.roleId, "Achat boutique Mr-X Sentinel").catch(() => undefined);
    }
    await logService.log(client, member.guild.id, "economy", {
      title: "Achat boutique",
      description: `<@${member.id}> a acheté **${item.name}** (${item.price} coins)`,
      actorId: member.id,
    });
    return item;
  }
}

export const shopService = new ShopService();

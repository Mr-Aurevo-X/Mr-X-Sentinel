import type {
  ButtonInteraction,
  Client,
  GuildMember,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from "discord.js";
import { parseCustomId } from "@sentinel/shared";
import type { ModerationService } from "@sentinel/core";
import { withComponent } from "./commands/middleware.js";
import { assertComponentAccess, assertTier } from "./commands/permissions.js";
import { buildHelpEmbed } from "./ui/embeds.js";
import { buildHelpTierRows } from "./views/HelpView.js";
import { buildSentinelMasterHubRows } from "./views/HubViews.js";
import type { ComponentHandler } from "./interactions/types.js";
import {
  handleBlackjackComponent,
  handleEcoComponent,
  handleEconomyRewardComponent,
  handleFonctionnementComponent,
  handleFunComponent,
  handleLeaderboardComponent,
  handleMinijeuComponent,
  handleSentinelComponent,
} from "./interactions/hub.js";
import { handleModComponent, handleModPanelComponent } from "./interactions/mod.js";
import { handleModal, handleTicketComponent } from "./interactions/ticket.js";
import { buildLogsPanel, handleLogsComponent } from "./interactions/logs.js";
import {
  handleAutomodComponent,
  handleLevelsComponent,
  handleMusicComponent,
  handleSuggestComponent,
  handleTemplateComponent,
  handleVerifyComponent,
  handleWelcomeComponent,
} from "./interactions/extras.js";

export { handleModal, buildLogsPanel };

const HELP_TIER_ACCESS: Record<string, import("./commands/permissions.js").AccessTier> = {
  public: "public",
  staff: "mod",
  owner: "guild_owner",
  bot_owner: "bot_owner",
};

const COMPONENT_HANDLERS: Record<string, ComponentHandler> = {
  fonctionnement: handleFonctionnementComponent,
  eco: handleEcoComponent,
  lb: handleLeaderboardComponent,
  sentinel: handleSentinelComponent,
  economy: handleEconomyRewardComponent,
  fun: handleFunComponent,
  minijeu: handleMinijeuComponent,
  bj: handleBlackjackComponent,
  mod: handleModComponent,
  modpanel: handleModPanelComponent,
  automod: handleAutomodComponent,
  welcome: handleWelcomeComponent,
  levels: handleLevelsComponent,
  suggest: handleSuggestComponent,
  verify: handleVerifyComponent,
  ticket: handleTicketComponent,
  music: handleMusicComponent,
  logs: handleLogsComponent,
  template: handleTemplateComponent,
};

export async function handleComponent(
  interaction: ButtonInteraction | StringSelectMenuInteraction | UserSelectMenuInteraction,
  client: Client,
  moderation: ModerationService,
): Promise<void> {
  if (!interaction.guild) return;

  await withComponent(interaction, async () => {
    const guild = interaction.guild!;
    const parsed = parseCustomId(interaction.customId);
    if (!parsed) return;

    if (parsed.module === "help" && parsed.action === "tier" && interaction.isStringSelectMenu()) {
      const tier = interaction.values[0] ?? "public";
      const need = HELP_TIER_ACCESS[tier] ?? "public";
      assertTier(
        { guild, user: interaction.user } as Parameters<typeof assertTier>[0],
        interaction.member as GuildMember,
        need,
      );
      await interaction.update({
        embeds: [buildHelpEmbed(tier as "public" | "staff" | "owner" | "bot_owner")],
        components: buildHelpTierRows(),
      });
      return;
    }

    await assertComponentAccess(interaction, parsed.module, parsed.action);

    const handler = COMPONENT_HANDLERS[parsed.module];
    if (!handler) return;
    await handler({ interaction, client, moderation, guild, parsed });
  });
}

export function buildSentinelHub() {
  return buildSentinelMasterHubRows();
}

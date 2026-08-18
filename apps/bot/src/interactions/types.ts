import type {
  ButtonInteraction,
  Client,
  Guild,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from "discord.js";
import type { ModerationService } from "@sentinel/core";

export type ComponentInteraction =
  | ButtonInteraction
  | StringSelectMenuInteraction
  | UserSelectMenuInteraction;

export type ParsedCustomId = { module: string; action: string; extra?: string };

export type ComponentCtx = {
  interaction: ComponentInteraction;
  client: Client;
  moderation: ModerationService;
  guild: Guild;
  parsed: ParsedCustomId;
};

export type ComponentHandler = (ctx: ComponentCtx) => Promise<void>;

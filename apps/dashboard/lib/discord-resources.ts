export type DiscordChannelOption = {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
};

export type DiscordRoleOption = {
  id: string;
  name: string;
  managed: boolean;
  position: number;
};

export type DiscordResources = {
  channels: DiscordChannelOption[];
  roles: DiscordRoleOption[];
  available: boolean;
};

export const TEXT_CHANNEL_TYPES = new Set([0, 5, 15]);
export const VOICE_CHANNEL_TYPES = new Set([2, 13]);
export const CATEGORY_CHANNEL_TYPE = 4;

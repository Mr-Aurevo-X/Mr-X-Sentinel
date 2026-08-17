import { setupCommands } from "./setup.js";
import { moderationCommands } from "./moderation.js";
import { securityCommands } from "./security.js";
import { infoCommands } from "./info.js";
import { adminCommands } from "./admin.js";
import { ticketsCommands } from "./tickets.js";
import { funCommands } from "./fun.js";
import { economyCommands } from "./economy.js";
import { levelsCommands } from "./levels.js";
import { communityCommands } from "./community.js";
import { musicCommands } from "./music.js";
import { ownerCommands } from "./owner.js";
import { extendedCommands } from "./extended.js";

export const commands = [
  ...setupCommands,
  ...moderationCommands,
  ...securityCommands,
  ...infoCommands,
  ...adminCommands,
  ...ticketsCommands,
  ...funCommands,
  ...economyCommands,
  ...levelsCommands,
  ...communityCommands,
  ...musicCommands,
  ...ownerCommands,
  ...extendedCommands,
];

import type { GuildFeatures } from "@sentinel/shared";
import { isModuleEnabled } from "./registry.js";

export function shouldRunAutomod(features: GuildFeatures, automodEnabled: boolean): boolean {
  return isModuleEnabled(features, "automod") && automodEnabled;
}

export function shouldRunAntiNuke(features: GuildFeatures, antiNukeEnabled: boolean): boolean {
  return isModuleEnabled(features, "security") && antiNukeEnabled;
}

export function shouldRunAntiRaid(features: GuildFeatures, antiRaidEnabled: boolean): boolean {
  return isModuleEnabled(features, "security") && antiRaidEnabled;
}

export function shouldRunPermissionGuard(features: GuildFeatures): boolean {
  return isModuleEnabled(features, "security");
}

export function shouldRunSnapshots(features: GuildFeatures): boolean {
  return isModuleEnabled(features, "snapshots");
}

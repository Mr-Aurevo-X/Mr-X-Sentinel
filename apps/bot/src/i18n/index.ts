import i18next from "i18next";

const resources = {
  fr: {
    translation: {
      ready: "mr-x-sentinel en ligne — {{guilds}} serveurs",
      setup_complete: "Configuration terminée pour **{{guild}}**",
      lockdown_on: "Lockdown activé.",
      lockdown_off: "Lockdown désactivé.",
      backup_created: "Snapshot créé: `{{id}}`",
      whitelist_added: "{{user}} ajouté à la whitelist ({{level}}).",
      no_permission: "Permission refusée.",
    },
  },
  en: {
    translation: {
      ready: "mr-x-sentinel online — {{guilds}} guilds",
      setup_complete: "Setup complete for **{{guild}}**",
      lockdown_on: "Lockdown enabled.",
      lockdown_off: "Lockdown disabled.",
      backup_created: "Snapshot created: `{{id}}`",
      whitelist_added: "{{user}} added to whitelist ({{level}}).",
      no_permission: "Permission denied.",
    },
  },
};

await i18next.init({
  lng: "fr",
  fallbackLng: "en",
  resources,
});

export { i18next };

export function t(key: string, lng = "fr", vars?: Record<string, string>): string {
  return i18next.t(key, { lng, ...vars });
}

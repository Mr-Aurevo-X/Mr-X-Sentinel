export type OauthMissing = {
  clientId: boolean;
  clientSecret: boolean;
  nextAuthSecret: boolean;
};

export function readOauthMissing(): OauthMissing {
  return {
    clientId: !process.env.DISCORD_CLIENT_ID?.trim(),
    clientSecret: !process.env.DISCORD_CLIENT_SECRET?.trim(),
    nextAuthSecret: !process.env.NEXTAUTH_SECRET?.trim(),
  };
}

export function oauthIsReady(missing: OauthMissing): boolean {
  return !missing.clientId && !missing.clientSecret && !missing.nextAuthSecret;
}

export function loginOauthHint(error: string | undefined, missing: OauthMissing): string | null {
  const names = [
    missing.clientId ? "DISCORD_CLIENT_ID" : null,
    missing.clientSecret ? "DISCORD_CLIENT_SECRET" : null,
    missing.nextAuthSecret ? "NEXTAUTH_SECRET" : null,
  ].filter((name): name is string => Boolean(name));

  if (names.length > 0) {
    return `OAuth incomplet dans le .env à la racine : ${names.join(", ")}. Portal Discord → OAuth2 → Client Secret, et redirect http://localhost:3000/api/auth/callback/discord`;
  }

  switch (error) {
    case undefined:
    case "":
      return null;
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
      return "Discord a refusé la connexion. Vérifie DISCORD_CLIENT_SECRET et le redirect OAuth (http://localhost:3000/api/auth/callback/discord).";
    case "AccessDenied":
      return "Connexion refusée. Réessaie ou autorise l’application Discord.";
    default:
      return "Connexion Discord interrompue. Réessaie, ou vérifie le .env.";
  }
}

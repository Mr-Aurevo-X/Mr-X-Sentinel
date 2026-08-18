import { loginOauthHint, oauthIsReady, readOauthMissing } from "@/lib/login-oauth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const missing = readOauthMissing();
  return <LoginForm hint={loginOauthHint(error, missing)} ready={oauthIsReady(missing)} />;
}

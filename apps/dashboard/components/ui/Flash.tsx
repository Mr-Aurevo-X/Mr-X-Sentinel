export function Flash({ text }: { text: string }) {
  if (!text) return null;
  const error = text.toLowerCase().includes("erreur") || text.toLowerCase().includes("invalide");
  return <p className={error ? "flash flash-error" : "flash"}>{text}</p>;
}

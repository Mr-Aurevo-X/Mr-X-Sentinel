"use client";

import { useState } from "react";
import type { GuildConfig } from "@sentinel/shared";
import { useDiscordResources } from "@/hooks/useDiscordResources";
import { useGuildConfig } from "@/hooks/useGuildConfig";
import { RoleSelect } from "@/components/RoleSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Flash } from "@/components/ui/Flash";
import { Guide } from "@/components/ui/Guide";
import { Tile } from "@/components/ui/Tile";

type ShopItem = { id: string; name: string; price: number; roleId: string | null };

export function EconomyPanel({
  guildId,
  initialConfig,
  shop,
}: {
  guildId: string;
  initialConfig: GuildConfig;
  shop: ShopItem[];
}) {
  const { config, setConfig, saving, message, setMessage, save } = useGuildConfig(guildId, initialConfig);
  const resources = useDiscordResources(guildId);
  const [items, setItems] = useState(shop);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(100);
  const [roleId, setRoleId] = useState<string | null>(null);

  function pair(
    minKey: "dailyMin" | "workMin" | "crimeMin",
    maxKey: "dailyMax" | "workMax" | "crimeMax",
    min: number,
    max: number,
  ) {
    setConfig({ ...config, economy: { ...config.economy, [minKey]: min, [maxKey]: max } });
  }

  async function addItem() {
    const res = await fetch(`/api/guilds/${guildId}/shop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, roleId }),
    });
    if (!res.ok) {
      setMessage("Erreur boutique.");
      return;
    }
    const data = (await res.json()) as { item: ShopItem };
    setItems((current) => [data.item, ...current]);
    setName("");
    setMessage("Article ajouté.");
  }

  async function removeItem(itemId: string) {
    const res = await fetch(`/api/guilds/${guildId}/shop?itemId=${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setItems((current) => current.filter((item) => item.id !== itemId));
      setMessage("Article retiré.");
    }
  }

  return (
    <>
      <p className="hero-kicker">Économie</p>
      <h1>Récompenses et boutique</h1>
      <Guide
        who="Toi règles les fourchettes et la boutique. Les membres jouent avec /daily /work /crime /shop dans Discord. Rien n’est débité depuis le panel."
        how="Sauvegarde les montants. Un article boutique = nom + prix + rôle optionnel (donné à l’achat via /buy)."
      >
        Économie du serveur. Coupe le module Économie dans Vue d&apos;ensemble si tu n&apos;en veux pas du tout.
      </Guide>
      <Flash text={message} />
      <Tile
        title="Montants"
        help="Le bot tire un nombre au hasard entre min et max. Si min > max, il utilise min. Weekly / monthly sont fixes côté bot."
        staticTile
      >
        <Field
          label="Daily min / max"
          hint="/daily une fois par 24 h. Fourchette de pièces gagnées."
        >
          <div className="row">
            <input
              type="number"
              value={config.economy.dailyMin}
              onChange={(e) => pair("dailyMin", "dailyMax", parseInt(e.target.value, 10) || 0, config.economy.dailyMax)}
            />
            <input
              type="number"
              value={config.economy.dailyMax}
              onChange={(e) => pair("dailyMin", "dailyMax", config.economy.dailyMin, parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </Field>
        <Field label="Work min / max" hint="/work une fois par heure. Souvent plus bas que le daily.">
          <div className="row">
            <input
              type="number"
              value={config.economy.workMin}
              onChange={(e) => pair("workMin", "workMax", parseInt(e.target.value, 10) || 0, config.economy.workMax)}
            />
            <input
              type="number"
              value={config.economy.workMax}
              onChange={(e) => pair("workMin", "workMax", config.economy.workMin, parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </Field>
        <Field
          label="Crime min / max"
          hint="/crime toutes les 2 h. Gain si succès, amende possible si attrapé (~40 %)."
        >
          <div className="row">
            <input
              type="number"
              value={config.economy.crimeMin}
              onChange={(e) => pair("crimeMin", "crimeMax", parseInt(e.target.value, 10) || 0, config.economy.crimeMax)}
            />
            <input
              type="number"
              value={config.economy.crimeMax}
              onChange={(e) => pair("crimeMin", "crimeMax", config.economy.crimeMin, parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </Field>
        <button className="btn" disabled={saving} onClick={() => void save({ economy: config.economy })}>
          Sauvegarder économie
        </button>
      </Tile>
      <div style={{ marginTop: "1rem" }}>
        <Tile
          title="Boutique"
          help="Articles achetés avec /buy. Un rôle optionnel est donné au membre. Retirer un article ne retire pas le rôle déjà donné."
          staticTile
        >
          {items.length === 0 ? <EmptyState>Aucun article.</EmptyState> : null}
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prix</th>
                <th>Rôle</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.price}</td>
                  <td>{item.roleId ?? "—"}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => void removeItem(item.id)}>
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ marginTop: "0.8rem" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'article" />
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value, 10) || 1)}
              title="Prix en pièces"
            />
            <RoleSelect
              guildId={guildId}
              resources={resources}
              value={roleId}
              onChange={(id) => setRoleId(typeof id === "string" ? id : null)}
            />
            <button className="btn" onClick={() => void addItem()}>
              Ajouter
            </button>
          </div>
          <p className="field-hint">Nom + prix. Le sélecteur de rôle est optionnel — vide = cosmétique sans rôle.</p>
        </Tile>
      </div>
    </>
  );
}

export type ShopCatalogEntry = {
  label: string;
  emoji: string;
  price: number;
  description: string;
  category: "consumables" | "tech" | "style" | "luxury" | "special";
  effect?: "shield" | "mystery" | "work_boost";
};

export const SHOP_CATALOG: Record<string, ShopCatalogEntry> = {
  pizza: { label: "Pizza", emoji: "🍕", price: 250, description: "Une bonne pizza bien chaude.", category: "consumables" },
  burger: { label: "Burger", emoji: "🍔", price: 400, description: "Un burger bien gras.", category: "consumables" },
  energydrink: { label: "Energy Drink", emoji: "🥤", price: 600, description: "Boisson énergisante.", category: "consumables" },
  headphones: { label: "Headphones", emoji: "🎧", price: 1200, description: "Casque audio.", category: "tech" },
  keyboard: { label: "Keyboard", emoji: "⌨️", price: 1800, description: "Clavier mécanique.", category: "tech" },
  gamingmouse: { label: "Gaming Mouse", emoji: "🖱️", price: 2200, description: "Souris gaming.", category: "tech" },
  vipticket: { label: "VIP Ticket", emoji: "🎟️", price: 2500, description: "Ticket VIP collector.", category: "style" },
  hoodie: { label: "Hoodie", emoji: "👕", price: 3200, description: "Hoodie édition limitée.", category: "style" },
  smartphone: { label: "Smartphone", emoji: "📱", price: 5500, description: "Smartphone haut de gamme.", category: "tech" },
  pc: { label: "PC", emoji: "🖥️", price: 8000, description: "Setup gaming.", category: "tech" },
  mysterybox: { label: "Mystery Box", emoji: "🎁", price: 1500, description: "Boîte mystère.", category: "consumables", effect: "mystery" },
  drone: { label: "Drone", emoji: "🚁", price: 9500, description: "Drone dernier cri.", category: "luxury" },
  motorbike: { label: "Motorbike", emoji: "🏍️", price: 18000, description: "Moto nerveuse.", category: "luxury" },
  car: { label: "Car", emoji: "🚗", price: 35000, description: "Voiture de luxe.", category: "luxury" },
  shield: { label: "Bouclier anti-rob", emoji: "🛡️", price: 5000, description: "Protection 24h contre les braquages.", category: "special", effect: "shield" },
};

import { 
  Sword, 
  Shield, 
  Zap, 
  Flame, 
  Target, 
  Wind, 
  Crown, 
  Sparkles, 
  Crosshair, 
  Heart, 
  RotateCw,
  Skull
} from "lucide-react";

export interface HeroSkill {
  id: string;
  name: string;
  type: 'passive' | 'skill1' | 'skill2' | 'ultimate';
  cooldown: number; // in seconds
  manaCost: number;
  damage: number;
  range: number;
  description: string;
  icon?: any;
}

export interface HeroSkin {
  id: string;
  name: string;
  tier: 'Elite' | 'Special' | 'Epic' | 'Collector' | 'Legend';
  priceAlx: number;
  color: string;
  glowColor: string;
  bonusAtk: number;
  bonusHp: number;
  avatarUrl: string;
  tagline: string;
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  role: 'Assassin' | 'Mage' | 'Marksman' | 'Fighter' | 'Tank' | 'Support';
  priceAlx: number; // 0 means free default
  hp: number;
  mana: number;
  atk: number;
  magic: number;
  armor: number;
  speed: number;
  range: number;
  color: string;
  portrait: string;
  skills: {
    passive: HeroSkill;
    skill1: HeroSkill;
    skill2: HeroSkill;
    ultimate: HeroSkill;
  };
  skins: HeroSkin[];
}

export interface MobaItem {
  id: string;
  name: string;
  category: 'attack' | 'magic' | 'defense' | 'movement';
  cost: number;
  desc: string;
  atk?: number;
  magic?: number;
  hp?: number;
  mana?: number;
  armor?: number;
  speed?: number;
  lifesteal?: number;
  passiveName?: string;
  passiveDesc?: string;
}

export interface EmblemSet {
  id: string;
  name: string;
  role: string;
  icon: string;
  description: string;
  baseStats: {
    atk?: number;
    magic?: number;
    hp?: number;
    armor?: number;
    critChance?: number;
    speed?: number;
    pen?: number;
  };
  talentName: string;
  talentDesc: string;
}

export const MOBA_HEROES: Hero[] = [
  {
    id: "ali_vanguard",
    name: "Alucard (Ali Vanguard)",
    title: "Demon Hunter Sovereign",
    role: "Fighter",
    priceAlx: 0, // Free Starter
    hp: 550,
    mana: 200,
    atk: 45,
    magic: 0,
    armor: 28,
    speed: 3.5,
    range: 45,
    color: "#3b82f6",
    portrait: "⚔️",
    skills: {
      passive: {
        id: "vanguard_passive",
        name: "Pursuit Blade",
        type: "passive",
        cooldown: 0,
        manaCost: 0,
        damage: 0,
        range: 0,
        description: "Setelah menggunakan skill, serangan berikutnya melesat cepat ke target dengan +25% Physical Damage."
      },
      skill1: {
        id: "vanguard_s1",
        name: "Groundsplitter",
        type: "skill1",
        cooldown: 5,
        manaCost: 35,
        damage: 110,
        range: 160,
        description: "Melompat ke depan menghempas tanah, memberikan 110 Physical Damage dan efek slow 40%."
      },
      skill2: {
        id: "vanguard_s2",
        name: "Whirling Smash",
        type: "skill2",
        cooldown: 4,
        manaCost: 30,
        damage: 140,
        range: 90,
        description: "Memutar pedang iblis secara melingkar 360°, memberikan 140 Physical Damage ke semua musuh sekitar."
      },
      ultimate: {
        id: "vanguard_ult",
        name: "Fission Wave",
        type: "ultimate",
        cooldown: 18,
        manaCost: 60,
        damage: 260,
        range: 240,
        description: "Meningkatkan Lifesteal +100% dan melepaskan gelombang tebasan raksasa berdaya hancur 260 Damage!"
      }
    },
    skins: [
      {
        id: "vanguard_lightborn",
        name: "Lightborn Sovereign",
        tier: "Epic",
        priceAlx: 5,
        color: "#fbbf24",
        glowColor: "#f59e0b",
        bonusAtk: 12,
        bonusHp: 80,
        avatarUrl: "👑",
        tagline: "Ksatria cahaya agung bertatahkan emas murni AliBank."
      },
      {
        id: "vanguard_obsidian",
        name: "Obsidian Demon",
        tier: "Collector",
        priceAlx: 10,
        color: "#dc2626",
        glowColor: "#991b1b",
        bonusAtk: 20,
        bonusHp: 150,
        avatarUrl: "🔥",
        tagline: "Kekuatan kegelapan purba dengan tebasan api obsidian."
      }
    ]
  },
  {
    id: "layla_ranger",
    name: "Layla (Darmedia Ranger)",
    title: "Shining Energy Gunner",
    role: "Marksman",
    priceAlx: 0, // Free Starter
    hp: 420,
    mana: 250,
    atk: 52,
    magic: 0,
    armor: 18,
    speed: 3.3,
    range: 190,
    color: "#eab308",
    portrait: "🎯",
    skills: {
      passive: {
        id: "layla_passive",
        name: "Malefic Gun",
        type: "passive",
        cooldown: 0,
        manaCost: 0,
        damage: 0,
        range: 0,
        description: "Damage tembakan Layla meningkat seiring jarak musuh, menghasilkan hingga +140% Damage maksimum."
      },
      skill1: {
        id: "layla_s1",
        name: "Malefic Bomb",
        type: "skill1",
        cooldown: 4,
        manaCost: 40,
        damage: 130,
        range: 220,
        description: "Menembakkan bola energi lurus ke depan, memberikan 130 Physical Damage dan meningkatkan movement speed +40%."
      },
      skill2: {
        id: "layla_s2",
        name: "Void Projectile",
        type: "skill2",
        cooldown: 6,
        manaCost: 45,
        damage: 100,
        range: 170,
        description: "Menembakkan peluru energi yang meledak di target, memberikan slow 60% selama 1.5 detik."
      },
      ultimate: {
        id: "layla_ult",
        name: "Destruction Rush",
        type: "ultimate",
        cooldown: 20,
        manaCost: 80,
        damage: 320,
        range: 350,
        description: "Meriam laser raksasa menembakkan sinar energi berjarak ekstrem, membakar semua musuh dalam satu garis lurus!"
      }
    },
    skins: [
      {
        id: "layla_cyber",
        name: "Cyber Spectre",
        tier: "Special",
        priceAlx: 5,
        color: "#06b6d4",
        glowColor: "#0891b2",
        bonusAtk: 15,
        bonusHp: 60,
        avatarUrl: "🤖",
        tagline: "Penembak jitu masa depan dengan senjata laser plasma cyber."
      },
      {
        id: "layla_anime",
        name: "Miss Hikari Anime",
        tier: "Legend",
        priceAlx: 12,
        color: "#ec4899",
        glowColor: "#db2777",
        bonusAtk: 24,
        bonusHp: 120,
        avatarUrl: "✨",
        tagline: "Gadis mecha kosmik legendaris dengan animasi partikel sakura."
      }
    ]
  },
  {
    id: "gusion_shadow",
    name: "Gusion (Ali Shadowblade)",
    title: "Holy Blade Assassin",
    role: "Assassin",
    priceAlx: 4, // Buyable with 4 ALX
    hp: 460,
    mana: 280,
    atk: 40,
    magic: 65,
    armor: 22,
    speed: 3.8,
    range: 60,
    color: "#8b5cf6",
    portrait: "🗡️",
    skills: {
      passive: {
        id: "gusion_passive",
        name: "Dagger Specialist",
        type: "passive",
        cooldown: 0,
        manaCost: 0,
        damage: 0,
        range: 0,
        description: "Tiap skill cast menyimpan rune belati, memperkuat basic attack berikutnya dengan 15% Max HP musuh."
      },
      skill1: {
        id: "gusion_s1",
        name: "Sword Spike",
        type: "skill1",
        cooldown: 5,
        manaCost: 35,
        damage: 90,
        range: 200,
        description: "Melempar belati ke musuh, tekan lagi untuk berkedip (blink) ke belakang musuh dan menusuknya!"
      },
      skill2: {
        id: "gusion_s2",
        name: "Shadowblade Slaughter",
        type: "skill2",
        cooldown: 5,
        manaCost: 50,
        damage: 160,
        range: 150,
        description: "Melemparkan 5 belati bayangan ke depan dalam kipas, lalu memanggilnya kembali menusuk musuh dua kali!"
      },
      ultimate: {
        id: "gusion_ult",
        name: "Incandescence",
        type: "ultimate",
        cooldown: 15,
        manaCost: 65,
        damage: 180,
        range: 180,
        description: "Dash kilat ke target, seketika ME-RESET SEMUA COOLDOWN Skill 1 dan Skill 2 untuk combo mematikan!"
      }
    },
    skins: [
      {
        id: "gusion_cosmic",
        name: "Cosmic Gleam",
        tier: "Legend",
        priceAlx: 15,
        color: "#6366f1",
        glowColor: "#4f46e5",
        bonusAtk: 20,
        bonusHp: 100,
        avatarUrl: "🌌",
        tagline: "Pembunuh antar bintang dengan belati rasi bintang galaksi."
      }
    ]
  },
  {
    id: "tigreal_titan",
    name: "Tigreal (Dzulfikar Titan)",
    title: "Warrior of Dawn",
    role: "Tank",
    priceAlx: 3, // Buyable with 3 ALX
    hp: 750,
    mana: 220,
    atk: 32,
    magic: 0,
    armor: 48,
    speed: 3.1,
    range: 40,
    color: "#10b981",
    portrait: "🛡️",
    skills: {
      passive: {
        id: "tigreal_passive",
        name: "Fearless Aegis",
        type: "passive",
        cooldown: 0,
        manaCost: 0,
        damage: 0,
        range: 0,
        description: "Mendapat 1 stack perisai tiap serangan, setelah 4 stack memblokir 100% basic attack berikutnya!"
      },
      skill1: {
        id: "tigreal_s1",
        name: "Attack Wave",
        type: "skill1",
        cooldown: 6,
        manaCost: 40,
        damage: 90,
        range: 170,
        description: "Menghantam tanah mengirim gelombang kejut, memberi 90 Physical Damage dan slow 30%."
      },
      skill2: {
        id: "tigreal_s2",
        name: "Sacred Hammer",
        type: "skill2",
        cooldown: 7,
        manaCost: 55,
        damage: 120,
        range: 120,
        description: "Mendorong musuh ke depan dengan perisai baja lalu menghempaskan mereka ke udara (airborne)!"
      },
      ultimate: {
        id: "tigreal_ult",
        name: "Implosion",
        type: "ultimate",
        cooldown: 22,
        manaCost: 75,
        damage: 220,
        range: 130,
        description: "Menancapkan pedang suci ke tanah, MENYEDOT SEMUA MUSUH sekitar ke tengah dan men-stun selama 1.8 detik!"
      }
    },
    skins: [
      {
        id: "tigreal_baron",
        name: "Gold Baron Titan",
        tier: "Collector",
        priceAlx: 8,
        color: "#eab308",
        glowColor: "#ca8a04",
        bonusAtk: 10,
        bonusHp: 250,
        avatarUrl: "🏰",
        tagline: "Perisai emas kokoh benteng moneter kerajaan AliBank."
      }
    ]
  },
  {
    id: "kagura_frost",
    name: "Kagura (Alix Frostweaver)",
    title: "Onmyouji Master",
    role: "Mage",
    priceAlx: 4, // Buyable with 4 ALX
    hp: 440,
    mana: 350,
    atk: 30,
    magic: 80,
    armor: 20,
    speed: 3.4,
    range: 170,
    color: "#a855f7",
    portrait: "🔮",
    skills: {
      passive: {
        id: "kagura_passive",
        name: "Yin Yang Gathering",
        type: "passive",
        cooldown: 0,
        manaCost: 0,
        damage: 0,
        range: 0,
        description: "Saat payung Seimei kembali ke tangannya, Kagura memperoleh shield 280 HP dan men-stun musuh sekitar."
      },
      skill1: {
        id: "kagura_s1",
        name: "Seimei Umbrella Open",
        type: "skill1",
        cooldown: 3.5,
        manaCost: 45,
        damage: 140,
        range: 200,
        description: "Melemparkan payung sihir ke area target, memberi 140 Magic Damage dan slow 60%."
      },
      skill2: {
        id: "kagura_s2",
        name: "Rasho Umbrella Flee",
        type: "skill2",
        cooldown: 8,
        manaCost: 50,
        damage: 80,
        range: 150,
        description: "Menghilangkan semua efek debuff (Purify) dan melompat teleport ke lokasi payungnya."
      },
      ultimate: {
        id: "kagura_ult",
        name: "Yin Yang Overturn",
        type: "ultimate",
        cooldown: 18,
        manaCost: 85,
        damage: 300,
        range: 180,
        description: "Badai sihir dahsyat meledak di sekitar payung, menarik semua musuh dan mengoyak HP mereka dengan 300 Magic Damage!"
      }
    },
    skins: [
      {
        id: "kagura_cherry",
        name: "Cherry Witch",
        tier: "Epic",
        priceAlx: 7,
        color: "#f43f5e",
        glowColor: "#e11d48",
        bonusAtk: 10,
        bonusHp: 100,
        avatarUrl: "🌸",
        tagline: "Penyihir bunga sakura dengan kelopak bunga berputar mistis."
      }
    ]
  },
  {
    id: "chou_kungfu",
    name: "Chou (Kungfu Master)",
    title: "Master of Jeet Kune Do",
    role: "Fighter",
    priceAlx: 5, // Buyable with 5 ALX
    hp: 520,
    mana: 200,
    atk: 48,
    magic: 0,
    armor: 30,
    speed: 3.7,
    range: 45,
    color: "#f97316",
    portrait: "🥋",
    skills: {
      passive: {
        id: "chou_passive",
        name: "Only Fast",
        type: "passive",
        cooldown: 0,
        manaCost: 0,
        damage: 0,
        range: 0,
        description: "Setelah bergerak 8 langkah, serangan berikutnya 180% Critical Damage dan memperlambat musuh 80%."
      },
      skill1: {
        id: "chou_s1",
        name: "Jeet Kune Do",
        type: "skill1",
        cooldown: 5,
        manaCost: 30,
        damage: 120,
        range: 100,
        description: "Combo 3 pukulan beruntun; pukulan ketiga melemparkan musuh ke udara (airborne knockup)!"
      },
      skill2: {
        id: "chou_s2",
        name: "Shunpo",
        type: "skill2",
        cooldown: 5,
        manaCost: 25,
        damage: 60,
        range: 110,
        description: "Dash cepat ke depan, menjadi KEBAL CROWD CONTROL (Immune) serta memperoleh shield tebal."
      },
      ultimate: {
        id: "chou_ult",
        name: "The Way of Dragon",
        type: "ultimate",
        cooldown: 20,
        manaCost: 65,
        damage: 280,
        range: 110,
        description: "Tendangan berputar mematikan menendang musuh terbang jauh ke belakang ke hadapan turret/tim Anda!"
      }
    },
    skins: [
      {
        id: "chou_dragon",
        name: "Dragon Boy Chou",
        tier: "Collector",
        priceAlx: 10,
        color: "#ef4444",
        glowColor: "#b91c1c",
        bonusAtk: 18,
        bonusHp: 120,
        avatarUrl: "🐉",
        tagline: "Pendekar naga legendaris dengan aura tinju kobaran api."
      }
    ]
  }
];

export const MOBA_ITEMS: MobaItem[] = [
  // Attack
  {
    id: "blade_despair",
    name: "Blade of Despair",
    category: "attack",
    cost: 300,
    atk: 35,
    speed: 0.3,
    desc: "+35 Physical ATK, +0.3 Speed",
    passiveName: "Despair",
    passiveDesc: "Menyerang musuh dengan HP di bawah 50% meningkatkan ATK sebesar 25%."
  },
  {
    id: "hunter_strike",
    name: "Hunter Strike",
    category: "attack",
    cost: 220,
    atk: 22,
    speed: 0.5,
    desc: "+22 Physical ATK, +0.5 Speed",
    passiveName: "Retribution",
    passiveDesc: "Memberikan damage 5 kali beruntun menambah 50% Movement Speed sesaat."
  },
  {
    id: "haas_claws",
    name: "Haas's Claws",
    category: "attack",
    cost: 200,
    atk: 20,
    lifesteal: 25,
    desc: "+20 Physical ATK, +25% Lifesteal",
    passiveName: "Insanity",
    passiveDesc: "Memulihkan HP setiap kali memukul hero atau minion musuh."
  },
  {
    id: "malefic_roar",
    name: "Malefic Roar",
    category: "attack",
    cost: 240,
    atk: 26,
    desc: "+26 Physical ATK, Armor Buster",
    passiveName: "Armor Buster",
    passiveDesc: "Menembus pertahanan armor Turret dan Tank musuh sebesar 35%."
  },
  // Magic
  {
    id: "holy_crystal",
    name: "Holy Crystal",
    category: "magic",
    cost: 280,
    magic: 38,
    desc: "+38 Magic Power",
    passiveName: "Mystery",
    passiveDesc: "Meningkatkan Magic Attack ekstra sebesar 25% - 35%."
  },
  {
    id: "glowing_wand",
    name: "Glowing Wand",
    category: "magic",
    cost: 220,
    magic: 24,
    hp: 80,
    desc: "+24 Magic Power, +80 HP",
    passiveName: "Scorch",
    passiveDesc: "Memberikan efek bakar api berkelanjutan selama 3 detik pada target."
  },
  {
    id: "lightning_truncheon",
    name: "Lightning Truncheon",
    category: "magic",
    cost: 240,
    magic: 28,
    mana: 100,
    desc: "+28 Magic Power, +100 Mana",
    passiveName: "Resonate",
    passiveDesc: "Setiap 6 detik, skill memantul ke 3 musuh di dekatnya memberi petir."
  },
  // Defense
  {
    id: "immortality",
    name: "Immortality",
    category: "defense",
    cost: 260,
    hp: 200,
    armor: 15,
    desc: "+200 HP, +15 Physical Armor",
    passiveName: "Immortal",
    passiveDesc: "Hidup kembali 2.5 detik setelah tereliminasi dengan 16% HP dan shield!"
  },
  {
    id: "athena_shield",
    name: "Athena's Shield",
    category: "defense",
    cost: 230,
    hp: 180,
    armor: 12,
    desc: "+180 HP, +12 Magic Defense",
    passiveName: "Shielding",
    passiveDesc: "Mengurangi Magic Damage yang diterima sebesar 25% selama 3 detik."
  },
  {
    id: "antique_cuirass",
    name: "Antique Cuirass",
    category: "defense",
    cost: 240,
    hp: 220,
    armor: 20,
    desc: "+220 HP, +20 Physical Armor",
    passiveName: "Deter",
    passiveDesc: "Mengurangi Physical Attack musuh saat menyerang Anda sebesar 8%."
  },
  // Movement / Boots
  {
    id: "warrior_boots",
    name: "Warrior Boots",
    category: "movement",
    cost: 110,
    speed: 0.9,
    armor: 12,
    desc: "+0.9 Speed, +12 Armor",
    passiveName: "Valor",
    passiveDesc: "Pertahanan fisik bertambah setiap terkena basic attack."
  },
  {
    id: "magic_shoes",
    name: "Magic Shoes",
    category: "movement",
    cost: 110,
    speed: 0.9,
    mana: 60,
    desc: "+0.9 Speed, +10% CDR, +60 Mana",
    passiveName: "Cooldown",
    passiveDesc: "Mengurangi waktu tunggu (cooldown) semua skill sebesar 10%."
  },
  {
    id: "swift_boots",
    name: "Swift Boots",
    category: "movement",
    cost: 110,
    speed: 0.9,
    atk: 8,
    desc: "+0.9 Speed, +8 Attack Speed",
    passiveName: "Swift",
    passiveDesc: "Meningkatkan kecepatan ayunan senjata basic attack."
  },
  {
    id: "rapid_boots",
    name: "Rapid Boots",
    category: "movement",
    cost: 130,
    speed: 1.5,
    desc: "+1.5 Ultra Movement Speed",
    passiveName: "Speedy",
    passiveDesc: "Rotasi antar lane sangat cepat saat tidak sedang bertarung."
  }
];

export const MOBA_EMBLEMS: EmblemSet[] = [
  {
    id: "emblem_assassin",
    name: "Emblem Assassin",
    role: "Assassin / Burst",
    icon: "🗡️",
    description: "Fokus pada Physical Penetration, Attack Burst, dan Movement Speed tinggi.",
    baseStats: { atk: 15, pen: 12, speed: 0.4, critChance: 8 },
    talentName: "Killing Spree",
    talentDesc: "Mengeliminasi musuh seketika memulihkan 12% HP dan +15% Speed."
  },
  {
    id: "emblem_mage",
    name: "Emblem Mage",
    role: "Mage / Magic Burst",
    icon: "🔮",
    description: "Meningkatkan Magic Penetration, Magic Power, dan Cooldown Reduction.",
    baseStats: { magic: 22, pen: 14, speed: 0.2 },
    talentName: "Magic Worship",
    talentDesc: "Memberikan damage lebih dari 7% HP musuh membakarnya 3 kali."
  },
  {
    id: "emblem_marksman",
    name: "Emblem Marksman",
    role: "Marksman / DPS",
    icon: "🏹",
    description: "Memaksimalkan Attack Speed, Critical Damage, dan Lifesteal jarak jauh.",
    baseStats: { atk: 18, critChance: 10, speed: 0.3 },
    talentName: "Weakness Finder",
    talentDesc: "Basic attack jarak jauh berpeluang memperlambat musuh hingga 90%."
  },
  {
    id: "emblem_fighter",
    name: "Emblem Fighter",
    role: "Fighter / Brawler",
    icon: "🥊",
    description: "Keseimbangan antara Physical Attack, Physical Defense, dan Lifesteal berkelanjutan.",
    baseStats: { atk: 14, hp: 160, armor: 10 },
    talentName: "Festival of Blood",
    talentDesc: "Mendapat 8% Spell Vamp, bertambah tiap kali mengeliminasi musuh."
  },
  {
    id: "emblem_tank",
    name: "Emblem Tank",
    role: "Tank / Frontline",
    icon: "🛡️",
    description: "Ketahanan absolut dengan bonus Max HP besar, Armor, dan Magic Resistance.",
    baseStats: { hp: 320, armor: 18 },
    talentName: "Concussive Blast",
    talentDesc: "Menghasilkan ledakan sihir di sekitar setelah basic attack berdasarkan HP."
  }
];

export const BATTLE_SPELLS = [
  {
    id: "flicker",
    name: "Flicker",
    icon: "⚡",
    cooldown: 35,
    desc: "Teleportasi berjarak pendek ke arah bidikan seketika untuk mengejar atau kabur."
  },
  {
    id: "retribution",
    name: "Retribution",
    icon: "⚔️",
    cooldown: 20,
    desc: "Menghantam True Damage sebesar 250 ke Minion, Jungle Monster, Turtle, atau Lord."
  },
  {
    id: "execute",
    name: "Execute",
    icon: "💥",
    cooldown: 30,
    desc: "Memberikan True Damage eksekusi seketika ke hero lawan terdekat dengan HP tipis."
  },
  {
    id: "sprint",
    name: "Sprint",
    icon: "🏃",
    cooldown: 25,
    desc: "Meningkatkan Movement Speed +50% dan kebal terhadap efek slow selama 5 detik."
  },
  {
    id: "aegis",
    name: "Aegis",
    icon: "🛡️",
    cooldown: 35,
    desc: "Membuka perisai pelindung instan menyerap hingga 350 damage untuk Anda."
  }
];


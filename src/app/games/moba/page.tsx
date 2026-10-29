"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  ArrowLeft, 
  Gamepad2, 
  Trophy, 
  Coins, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  Heart, 
  Skull, 
  Users, 
  Crown, 
  ShoppingBag, 
  Layers, 
  Shield, 
  Sword, 
  Zap, 
  RefreshCw, 
  Check, 
  X, 
  Plus, 
  Target, 
  Flame, 
  RotateCcw,
  Loader2,
  Copy,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  MOBA_HEROES, 
  MOBA_ITEMS, 
  MOBA_EMBLEMS, 
  BATTLE_SPELLS, 
  Hero, 
  HeroSkin, 
  MobaItem, 
  EmblemSet 
} from "./moba-data";

export default function MobaGamePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'arena' | 'shop' | 'emblem' | 'builds'>('arena');
  const [gameMode, setGameMode] = useState<'solo' | 'mabar'>('solo');
  const [gameState, setGameState] = useState<'lobby' | 'selecting' | 'playing' | 'win' | 'loss'>('lobby');

  // Selected hero, skin, spell & emblem
  const [selectedHero, setSelectedHero] = useState<Hero>(MOBA_HEROES[0]);
  const [selectedSkin, setSelectedSkin] = useState<HeroSkin | null>(null);
  const [selectedSpell, setSelectedSpell] = useState(BATTLE_SPELLS[0]);
  const [selectedEmblem, setSelectedEmblem] = useState<EmblemSet>(MOBA_EMBLEMS[0]);

  // Audio system
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtx = useRef<AudioContext | null>(null);

  // In-Game match state
  const [gold, setGold] = useState(300);
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [assists, setAssists] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerExp, setPlayerExp] = useState(0);
  const [activeItems, setActiveItems] = useState<MobaItem[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  // Skill cooldowns (in seconds)
  const [cdS1, setCdS1] = useState(0);
  const [cdS2, setCdS2] = useState(0);
  const [cdUlt, setCdUlt] = useState(0);
  const [cdSpell, setCdSpell] = useState(0);
  const [isRecalling, setIsRecalling] = useState(false);
  const [recallProgress, setRecallProgress] = useState(0);

  // Kill streak & Announcer
  const [killStreak, setKillStreak] = useState(0);
  const [announcement, setAnnouncement] = useState<{ text: string; sub?: string } | null>(null);
  const announcementTimeout = useRef<any>(null);

  // Multiplayer Mabar Room state
  const [roomCode, setRoomCode] = useState("");
  const [inputRoomCode, setInputRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [isConnectingRoom, setIsConnectingRoom] = useState(false);

  // Inventory & User Data from Firestore
  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const ownedHeroes: string[] = useMemo(() => {
    const list = userData?.moba_inventory?.heroes || ['ali_vanguard', 'layla_ranger'];
    return Array.from(new Set(['ali_vanguard', 'layla_ranger', ...list]));
  }, [userData]);

  const ownedSkins: string[] = useMemo(() => {
    return userData?.moba_inventory?.skins || [];
  }, [userData]);

  const emblemLevels: Record<string, number> = useMemo(() => {
    return userData?.moba_emblems || {
      emblem_assassin: 1,
      emblem_mage: 1,
      emblem_marksman: 1,
      emblem_fighter: 1,
      emblem_tank: 1
    };
  }, [userData]);

  // Canvas & Engine refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Mobile Touch Joystick State
  const joystickContainerRef = useRef<HTMLDivElement | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickVector = useRef({ x: 0, y: 0 });

  // Game Entities inside Arena
  const gameEntities = useRef<any>({
    player: { 
      x: 100, 
      y: 350, 
      hp: 550, 
      maxHp: 550, 
      mana: 200, 
      maxMana: 200, 
      atk: 45, 
      magic: 0, 
      armor: 28, 
      speed: 3.5, 
      radius: 16,
      lifesteal: 0,
      target: null
    },
    enemyHero: { 
      x: 800, 
      y: 100, 
      hp: 500, 
      maxHp: 500, 
      atk: 40, 
      speed: 2.8, 
      radius: 16, 
      name: "Bot Layla", 
      role: "Marksman", 
      respawnTimer: 0,
      targetX: 800,
      targetY: 100
    },
    playerMinions: [],
    enemyMinions: [],
    playerTowers: [
      { id: 'p_t1', x: 260, y: 280, hp: 800, maxHp: 800, radius: 20, range: 140, lastShot: 0 },
      { id: 'p_t2', x: 140, y: 220, hp: 950, maxHp: 950, radius: 20, range: 140, lastShot: 0 }
    ],
    enemyTowers: [
      { id: 'e_t1', x: 640, y: 170, hp: 800, maxHp: 800, radius: 20, range: 140, lastShot: 0 },
      { id: 'e_t2', x: 760, y: 230, hp: 950, maxHp: 950, radius: 20, range: 140, lastShot: 0 }
    ],
    playerNexus: { x: 70, y: 380, hp: 1500, maxHp: 1500, radius: 30 },
    enemyNexus: { x: 830, y: 70, hp: 1500, maxHp: 1500, radius: 30 },
    jungleMonsters: [
      { id: 'blue_buff', x: 300, y: 140, hp: 350, maxHp: 350, atk: 15, radius: 15, name: "Blue Buff", color: "#38bdf8", respawn: 0 },
      { id: 'red_buff', x: 600, y: 320, hp: 350, maxHp: 350, atk: 18, radius: 15, name: "Red Buff", color: "#f87171", respawn: 0 },
      { id: 'turtle', x: 450, y: 220, hp: 700, maxHp: 700, atk: 25, radius: 22, name: "The Turtle", color: "#eab308", respawn: 0 }
    ],
    projectiles: [],
    particles: [],
    spawnTimer: 0
  });

  // Sound generator
  const playSfx = useCallback((type: 'shot' | 'hit' | 'skill' | 'ult' | 'coin' | 'kill' | 'tower' | 'victory' | 'defeat' | 'flicker') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'shot') {
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'skill') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'ult') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.5);
        gain.gain.setValueAtTime(0.25, now);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'kill') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        osc.frequency.setValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'coin') {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'tower') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.6);
        gain.gain.setValueAtTime(0.3, now);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'victory') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        osc.frequency.setValueAtTime(1046.50, now + 0.45);
        gain.gain.setValueAtTime(0.25, now);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === 'defeat') {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.7);
        gain.gain.setValueAtTime(0.25, now);
        osc.start(now);
        osc.stop(now + 0.7);
      } else if (type === 'flicker') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (e) {
      console.warn("Audio sfx error:", e);
    }
  }, [soundEnabled]);

  const triggerAnnouncer = useCallback((text: string, sub?: string) => {
    if (announcementTimeout.current) clearTimeout(announcementTimeout.current);
    setAnnouncement({ text, sub });
    announcementTimeout.current = setTimeout(() => {
      setAnnouncement(null);
    }, 2800);
  }, []);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[k] = true;
      if (e.key === ' ' || k === 'j') triggerBasicAttack();
      if (k === '1' || k === 'q') triggerSkill1();
      if (k === '2' || k === 'e') triggerSkill2();
      if (k === '3' || k === 'r') triggerUltimate();
      if (k === 'd' || k === 'f') triggerSpell();
      if (k === 'b') startRecall();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, cdS1, cdS2, cdUlt, cdSpell]);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (audioCtx.current) audioCtx.current.close();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Sync Multiplayer Room Listener
  useEffect(() => {
    if (!db || !roomCode || gameMode !== 'mabar') return;
    const roomRef = doc(db, "moba_rooms", roomCode);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRoomData(data);
        if (data.status === 'playing' && gameState !== 'playing') {
          startBattle(true);
        }
      }
    });
    return () => unsubscribe();
  }, [db, roomCode, gameMode, gameState]);

  // Start Battle
  const startBattle = (fromRoom = false) => {
    setGold(300);
    setKills(0);
    setDeaths(0);
    setAssists(0);
    setPlayerLevel(1);
    setPlayerExp(0);
    setActiveItems([]);
    setCdS1(0);
    setCdS2(0);
    setCdUlt(0);
    setCdSpell(0);
    setIsRecalling(false);
    setHasClaimed(false);
    setKillStreak(0);

    const bonusAtk = (selectedSkin?.bonusAtk || 0) + ((emblemLevels[selectedEmblem.id] || 1) * 0.8);
    const bonusHp = (selectedSkin?.bonusHp || 0) + ((emblemLevels[selectedEmblem.id] || 1) * 8);

    gameEntities.current = {
      player: {
        x: 100,
        y: 350,
        hp: selectedHero.hp + bonusHp,
        maxHp: selectedHero.hp + bonusHp,
        mana: selectedHero.mana,
        maxMana: selectedHero.mana,
        atk: selectedHero.atk + bonusAtk,
        magic: selectedHero.magic,
        armor: selectedHero.armor,
        speed: selectedHero.speed,
        radius: 16,
        lifesteal: 0,
        target: null
      },
      enemyHero: {
        x: 800,
        y: 100,
        hp: 520,
        maxHp: 520,
        atk: 42,
        speed: 2.8,
        radius: 16,
        name: fromRoom && roomData?.guestName ? roomData.guestName : "Bot Layla",
        role: "Marksman",
        respawnTimer: 0,
        targetX: 800,
        targetY: 100
      },
      playerMinions: [],
      enemyMinions: [],
      playerTowers: [
        { id: 'p_t1', x: 260, y: 280, hp: 800, maxHp: 800, radius: 20, range: 140, lastShot: 0 },
        { id: 'p_t2', x: 140, y: 220, hp: 950, maxHp: 950, radius: 20, range: 140, lastShot: 0 }
      ],
      enemyTowers: [
        { id: 'e_t1', x: 640, y: 170, hp: 800, maxHp: 800, radius: 20, range: 140, lastShot: 0 },
        { id: 'e_t2', x: 760, y: 230, hp: 950, maxHp: 950, radius: 20, range: 140, lastShot: 0 }
      ],
      playerNexus: { x: 70, y: 380, hp: 1500, maxHp: 1500, radius: 30 },
      enemyNexus: { x: 830, y: 70, hp: 1500, maxHp: 1500, radius: 30 },
      jungleMonsters: [
        { id: 'blue_buff', x: 300, y: 140, hp: 350, maxHp: 350, atk: 15, radius: 15, name: "Blue Buff", color: "#38bdf8", respawn: 0 },
        { id: 'red_buff', x: 600, y: 320, hp: 350, maxHp: 350, atk: 18, radius: 15, name: "Red Buff", color: "#f87171", respawn: 0 },
        { id: 'turtle', x: 450, y: 220, hp: 700, maxHp: 700, atk: 25, radius: 22, name: "The Turtle", color: "#eab308", respawn: 0 }
      ],
      projectiles: [],
      particles: [],
      spawnTimer: 0
    };

    setGameState('playing');
    triggerAnnouncer("WELCOME TO ALIBANK ARENA!", "5 Detik menuju pertempuran.");
  };

  // Joystick handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setJoystickActive(true);
    updateJoystickPos(e.touches[0]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    updateJoystickPos(e.touches[0]);
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    joystickVector.current = { x: 0, y: 0 };
  };

  const updateJoystickPos = (touch: React.Touch) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    if (dist <= maxRadius) {
      setJoystickPos({ x: dx, y: dy });
      joystickVector.current = { x: dx / maxRadius, y: dy / maxRadius };
    } else {
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * maxRadius;
      const clampedY = Math.sin(angle) * maxRadius;
      setJoystickPos({ x: clampedX, y: clampedY });
      joystickVector.current = { x: Math.cos(angle), y: Math.sin(angle) };
    }
  };

  // Recall action
  const startRecall = () => {
    if (isRecalling) return;
    setIsRecalling(true);
    setRecallProgress(0);
    toast({ title: "Melakukan Recall...", description: "Jangan bergerak selama 4 detik untuk kembali ke Base." });

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setRecallProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsRecalling(false);
        const player = gameEntities.current.player;
        player.x = 100;
        player.y = 350;
        player.hp = player.maxHp;
        player.mana = player.maxMana;
        playSfx('flicker');
        toast({ title: "Recall Berhasil!", description: "HP & Mana dipulihkan penuh di Base." });
      }
    }, 1000);
  };

  // Battle Spell
  const triggerSpell = () => {
    if (gameState !== 'playing' || cdSpell > 0) return;
    const player = gameEntities.current.player;
    const spell = selectedSpell;

    if (spell.id === 'flicker') {
      const dirX = joystickVector.current.x !== 0 ? joystickVector.current.x : 1;
      const dirY = joystickVector.current.y !== 0 ? joystickVector.current.y : 0;
      player.x = Math.max(30, Math.min(870, player.x + dirX * 120));
      player.y = Math.max(30, Math.min(420, player.y + dirY * 120));
      createExplosion(player.x, player.y, '#eab308', 20);
      playSfx('flicker');
    } else if (spell.id === 'retribution') {
      // Damage closest monster
      let hit = false;
      gameEntities.current.jungleMonsters.forEach((m: any) => {
        if (m.hp > 0 && Math.hypot(m.x - player.x, m.y - player.y) < 140) {
          m.hp = Math.max(0, m.hp - 250);
          createExplosion(m.x, m.y, '#ef4444', 25);
          hit = true;
          if (m.hp <= 0) {
            setGold(g => g + 100);
            playSfx('coin');
            triggerAnnouncer(`${m.name.toUpperCase()} DIKALAHKAN!`, "+100 E-Gold tim.");
          }
        }
      });
      playSfx('skill');
    } else if (spell.id === 'execute') {
      const enemy = gameEntities.current.enemyHero;
      if (enemy.hp > 0 && Math.hypot(enemy.x - player.x, enemy.y - player.y) < 140) {
        enemy.hp = Math.max(0, enemy.hp - 180);
        createExplosion(enemy.x, enemy.y, '#dc2626', 30);
        playSfx('ult');
        if (enemy.hp <= 0) handleEnemyKilled();
      }
    } else if (spell.id === 'sprint') {
      player.speed += 2.0;
      setTimeout(() => { player.speed -= 2.0; }, 5000);
      playSfx('skill');
    } else if (spell.id === 'aegis') {
      player.hp = Math.min(player.maxHp + 250, player.hp + 250);
      createExplosion(player.x, player.y, '#3b82f6', 20);
      playSfx('skill');
    }

    setCdSpell(spell.cooldown);
    const cdInt = setInterval(() => {
      setCdSpell(prev => {
        if (prev <= 1) { clearInterval(cdInt); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Basic Attack
  const triggerBasicAttack = () => {
    if (gameState !== 'playing') return;
    const player = gameEntities.current.player;

    // Find closest target
    let target: any = null;
    let minDist = selectedHero.range + 40;

    const targets = [
      gameEntities.current.enemyHero,
      ...gameEntities.current.enemyMinions,
      ...gameEntities.current.enemyTowers,
      gameEntities.current.enemyNexus,
      ...gameEntities.current.jungleMonsters
    ];

    targets.forEach((t: any) => {
      if (!t || t.hp <= 0) return;
      const d = Math.hypot(t.x - player.x, t.y - player.y);
      if (d < minDist) {
        minDist = d;
        target = t;
      }
    });

    if (target) {
      gameEntities.current.projectiles.push({
        x: player.x,
        y: player.y,
        targetX: target.x,
        targetY: target.y,
        speed: 8,
        damage: player.atk,
        color: selectedSkin?.glowColor || selectedHero.color,
        isPlayer: true,
        target
      });
      playSfx('shot');
    }
  };

  // Skill 1
  const triggerSkill1 = () => {
    if (gameState !== 'playing' || cdS1 > 0) return;
    const player = gameEntities.current.player;
    const s1 = selectedHero.skills.skill1;

    createExplosion(player.x, player.y, selectedHero.color, 20);

    const enemy = gameEntities.current.enemyHero;
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < s1.range && enemy.hp > 0) {
      enemy.hp = Math.max(0, enemy.hp - s1.damage);
      createExplosion(enemy.x, enemy.y, '#f43f5e', 25);
      if (enemy.hp <= 0) handleEnemyKilled();
    }

    setCdS1(s1.cooldown);
    playSfx('skill');

    const cd = setInterval(() => {
      setCdS1(c => {
        if (c <= 1) { clearInterval(cd); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // Skill 2
  const triggerSkill2 = () => {
    if (gameState !== 'playing' || cdS2 > 0) return;
    const player = gameEntities.current.player;
    const s2 = selectedHero.skills.skill2;

    createExplosion(player.x, player.y, selectedSkin?.color || selectedHero.color, 25);

    const enemy = gameEntities.current.enemyHero;
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < s2.range && enemy.hp > 0) {
      enemy.hp = Math.max(0, enemy.hp - s2.damage);
      createExplosion(enemy.x, enemy.y, '#f59e0b', 30);
      if (enemy.hp <= 0) handleEnemyKilled();
    }

    setCdS2(s2.cooldown);
    playSfx('skill');

    const cd = setInterval(() => {
      setCdS2(c => {
        if (c <= 1) { clearInterval(cd); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // Ultimate
  const triggerUltimate = () => {
    if (gameState !== 'playing' || cdUlt > 0) return;
    const player = gameEntities.current.player;
    const ult = selectedHero.skills.ultimate;

    createExplosion(player.x, player.y, '#fbbf24', 40);

    const enemies = [gameEntities.current.enemyHero, ...gameEntities.current.enemyMinions, ...gameEntities.current.enemyTowers, gameEntities.current.enemyNexus];
    enemies.forEach((en: any) => {
      if (en && en.hp > 0 && Math.hypot(en.x - player.x, en.y - player.y) < ult.range) {
        en.hp = Math.max(0, en.hp - ult.damage);
        createExplosion(en.x, en.y, '#ef4444', 35);
        if (en === gameEntities.current.enemyHero && en.hp <= 0) {
          handleEnemyKilled();
        }
      }
    });

    setCdUlt(ult.cooldown);
    playSfx('ult');

    const cd = setInterval(() => {
      setCdUlt(c => {
        if (c <= 1) { clearInterval(cd); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleEnemyKilled = () => {
    const nextKills = kills + 1;
    const streak = killStreak + 1;
    setKills(nextKills);
    setKillStreak(streak);
    setGold(g => g + 200);
    setPlayerExp(e => e + 150);

    playSfx('kill');

    let announcerTitle = "AN ENEMY HAS BEEN SLAIN!";
    if (streak === 1) announcerTitle = "FIRST BLOOD!";
    else if (streak === 2) announcerTitle = "DOUBLE KILL!";
    else if (streak === 3) announcerTitle = "TRIPLE KILL!";
    else if (streak === 4) announcerTitle = "MANIAC!";
    else if (streak >= 5) announcerTitle = "SAVAGE! LEGENDARY!";

    triggerAnnouncer(announcerTitle, `+200 E-Gold diperoleh.`);

    const enemy = gameEntities.current.enemyHero;
    enemy.respawnTimer = 8;
  };

  // Particle explosion helper
  const createExplosion = (x: number, y: number, color: string, count = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      gameEntities.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25 + Math.random() * 15,
        color,
        radius: Math.random() * 3 + 1
      });
    }
  };

  // Buy in-game equipment
  const buyEquipment = (item: MobaItem) => {
    if (gold < item.cost) {
      toast({ variant: "destructive", title: "E-Gold Tidak Cukup", description: "Habisi minion dan monster jungle untuk mendapat E-Gold." });
      return;
    }
    if (activeItems.length >= 6) {
      toast({ variant: "destructive", title: "Slot Build Penuh", description: "Maksimal 6 Equipment terpasang." });
      return;
    }

    setGold(g => g - item.cost);
    setActiveItems(prev => [...prev, item]);

    const player = gameEntities.current.player;
    if (item.atk) player.atk += item.atk;
    if (item.magic) player.magic += item.magic;
    if (item.hp) {
      player.maxHp += item.hp;
      player.hp += item.hp;
    }
    if (item.armor) player.armor += item.armor;
    if (item.speed) player.speed += item.speed;
    if (item.lifesteal) player.lifesteal += item.lifesteal;

    playSfx('coin');
    toast({ title: `${item.name} Terpasang!`, description: `${item.desc}` });
  };

  // Buy Hero with ALX
  const buyHeroWithAlx = async (hero: Hero) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/games/moba/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          itemType: 'hero',
          itemId: hero.id,
          itemName: hero.name,
          priceAlx: hero.priceAlx
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membeli Hero.");
      toast({ title: "Hero Terbuka!", description: `Berhasil membeli ${hero.name}!` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Pembelian Gagal", description: e.message });
    }
  };

  // Buy Skin with ALX
  const buySkinWithAlx = async (skin: HeroSkin) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/games/moba/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          itemType: 'skin',
          itemId: skin.id,
          itemName: skin.name,
          priceAlx: skin.priceAlx
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membeli Skin.");
      toast({ title: "Skin Terbuka!", description: `Berhasil mengaktifkan skin ${skin.name}!` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Pembelian Gagal", description: e.message });
    }
  };

  // Upgrade Emblem
  const upgradeEmblem = async (emblem: EmblemSet) => {
    if (!user) return;
    const currentLv = emblemLevels[emblem.id] || 1;
    if (currentLv >= 60) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/games/moba/emblem", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          emblemType: emblem.id,
          newLevel: currentLv + 1
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upgrade emblem.");
      toast({ title: "Emblem Ditingkatkan!", description: `${emblem.name} sekarang Level ${currentLv + 1}!` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upgrade Gagal", description: e.message });
    }
  };

  // Create Multiplayer Room
  const createMabarRoom = async () => {
    if (!db || !user) return;
    setIsConnectingRoom(true);
    try {
      const code = `ALX-${Math.floor(1000 + Math.random() * 9000)}`;
      const roomRef = doc(db, "moba_rooms", code);
      await setDoc(roomRef, {
        roomCode: code,
        hostId: user.uid,
        hostName: userData?.name || user.email?.split('@')[0] || "Host Ali",
        hostHero: selectedHero.name,
        status: 'waiting',
        createdAt: serverTimestamp()
      });
      setRoomCode(code);
      setIsHost(true);
      toast({ title: "Ruangan Mabar Dibuat!", description: `Kode Ruangan: ${code}. Bagikan ke teman Anda!` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Membuat Ruangan", description: e.message });
    } finally {
      setIsConnectingRoom(false);
    }
  };

  // Join Multiplayer Room
  const joinMabarRoom = async () => {
    if (!db || !user || !inputRoomCode.trim()) return;
    setIsConnectingRoom(true);
    try {
      const code = inputRoomCode.trim().toUpperCase();
      const roomRef = doc(db, "moba_rooms", code);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        throw new Error("Kode ruangan tidak ditemukan atau sudah ditutup.");
      }
      await updateDoc(roomRef, {
        guestId: user.uid,
        guestName: userData?.name || user.email?.split('@')[0] || "Challenger",
        guestHero: selectedHero.name,
        status: 'ready'
      });
      setRoomCode(code);
      setIsHost(false);
      toast({ title: "Berhasil Bergabung!", description: `Masuk ke ruangan ${code}. Menunggu Host memulai...` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Bergabung", description: e.message });
    } finally {
      setIsConnectingRoom(false);
    }
  };

  // Host starts match
  const launchMabarMatch = async () => {
    if (!db || !roomCode || !isHost) return;
    const roomRef = doc(db, "moba_rooms", roomCode);
    await updateDoc(roomRef, { status: 'playing' });
    startBattle(true);
  };

  // Claim ALX reward on win
  const claimReward = async () => {
    if (!user || isClaiming || hasClaimed) return;
    setIsClaiming(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/games/moba/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengklaim token.");
      setHasClaimed(true);
      toast({ title: "🏆 Reward ALX Diklaim!", description: `Berhasil mengklaim ${data.rewardAmount} ALX ke dompet AliBank Anda!` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Klaim Gagal", description: e.message });
    } finally {
      setIsClaiming(false);
    }
  };

  // Main Canvas Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      updatePhysics();
      renderScene(ctx);
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  // Physics Engine
  const updatePhysics = () => {
    const data = gameEntities.current;
    const player = data.player;
    const enemy = data.enemyHero;

    // 1. Move player via keyboard or virtual joystick
    let mx = joystickVector.current.x;
    let my = joystickVector.current.y;

    if (keysPressed.current['w'] || keysPressed.current['arrowup']) my -= 1;
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) my += 1;
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) mx -= 1;
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) mx += 1;

    if (mx !== 0 && my !== 0 && (keysPressed.current['w'] || keysPressed.current['s'])) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
    }

    if (mx !== 0 || my !== 0) {
      if (isRecalling) setIsRecalling(false);
      player.x = Math.max(player.radius, Math.min(900 - player.radius, player.x + mx * player.speed));
      player.y = Math.max(player.radius, Math.min(450 - player.radius, player.y + my * player.speed));
    }

    // 2. Enemy Hero AI
    if (enemy.hp > 0) {
      const dToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dToPlayer < 180) {
        if (Math.random() < 0.04) {
          data.projectiles.push({
            x: enemy.x,
            y: enemy.y,
            targetX: player.x,
            targetY: player.y,
            speed: 7,
            damage: enemy.atk,
            color: '#ef4444',
            isPlayer: false,
            target: player
          });
        }
      } else {
        const angle = Math.atan2(350 - enemy.y, 100 - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;
      }
    } else {
      enemy.respawnTimer -= 0.016;
      if (enemy.respawnTimer <= 0) {
        enemy.x = 800;
        enemy.y = 100;
        enemy.hp = enemy.maxHp;
        triggerAnnouncer("ENEMY HAS RESPAWNED!", "Waspada hero musuh kembali ke arena.");
      }
    }

    // 3. Minion Waves (Every 10s / 600 frames)
    data.spawnTimer++;
    if (data.spawnTimer % 400 === 0) {
      for (let i = 0; i < 3; i++) {
        data.playerMinions.push({
          x: 100 + (Math.random() * 20 - 10),
          y: 350 + (Math.random() * 20 - 10),
          hp: 130,
          maxHp: 130,
          atk: 8,
          speed: 1.3,
          radius: 9,
          color: '#3b82f6'
        });
        data.enemyMinions.push({
          x: 800 + (Math.random() * 20 - 10),
          y: 100 + (Math.random() * 20 - 10),
          hp: 130,
          maxHp: 130,
          atk: 8,
          speed: 1.3,
          radius: 9,
          color: '#ef4444'
        });
      }
    }

    data.playerMinions.forEach((m: any) => {
      const angle = Math.atan2(70 - m.y, 830 - m.x);
      m.x += Math.cos(angle) * m.speed;
      m.y += Math.sin(angle) * m.speed;

      data.enemyMinions.forEach((em: any) => {
        if (Math.hypot(em.x - m.x, em.y - m.y) < 25) {
          em.hp -= 0.5;
          m.hp -= 0.5;
        }
      });
    });

    data.enemyMinions.forEach((m: any) => {
      const angle = Math.atan2(380 - m.y, 70 - m.x);
      m.x += Math.cos(angle) * m.speed;
      m.y += Math.sin(angle) * m.speed;
    });

    data.playerMinions = data.playerMinions.filter((m: any) => m.hp > 0);
    data.enemyMinions = data.enemyMinions.filter((m: any) => {
      if (m.hp <= 0) {
        setGold(g => g + 35);
        setPlayerExp(e => e + 25);
        return false;
      }
      return true;
    });

    // 4. Tower defense mechanics
    data.enemyTowers.forEach((t: any) => {
      if (t.hp <= 0) return;
      if (Math.hypot(player.x - t.x, player.y - t.y) < t.range) {
        t.lastShot = (t.lastShot || 0) + 1;
        if (t.lastShot % 60 === 0) {
          data.projectiles.push({
            x: t.x,
            y: t.y,
            targetX: player.x,
            targetY: player.y,
            speed: 6,
            damage: 60,
            color: '#ef4444',
            isPlayer: false,
            target: player
          });
        }
      }
    });

    // 5. Projectiles physics
    data.projectiles.forEach((p: any) => {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 12) {
        if (p.target && p.target.hp > 0) {
          const armorMitigation = (p.target.armor || 0) * 0.3;
          const finalDamage = Math.max(5, p.damage - armorMitigation);
          p.target.hp = Math.max(0, p.target.hp - finalDamage);

          if (p.isPlayer && player.lifesteal > 0) {
            player.hp = Math.min(player.maxHp, player.hp + finalDamage * (player.lifesteal / 100));
          }

          createExplosion(p.target.x, p.target.y, p.color, 8);
          playSfx('hit');

          if (p.target === enemy && p.target.hp <= 0) {
            handleEnemyKilled();
          } else if (p.target === data.enemyNexus && p.target.hp <= 0) {
            setGameState('win');
            playSfx('victory');
            triggerAnnouncer("VICTORY!", "Anda menghancurkan Nexus musuh!");
          } else if (p.target === player && p.target.hp <= 0) {
            setDeaths(d => d + 1);
            setKillStreak(0);
            player.x = 100;
            player.y = 350;
            player.hp = player.maxHp;
            playSfx('defeat');
            triggerAnnouncer("YOU HAVE BEEN SLAIN!", "Respawn di base.");
          } else if (p.target.id?.startsWith('e_t') && p.target.hp <= 0) {
            setGold(g => g + 150);
            playSfx('tower');
            triggerAnnouncer("TURRET DESTROYED!", "+150 E-Gold tim.");
          }
        }
        p.dead = true;
      } else {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }
    });

    data.projectiles = data.projectiles.filter((p: any) => !p.dead);

    // 6. Particles
    data.particles.forEach((part: any) => {
      part.x += part.vx;
      part.y += part.vy;
      part.life -= 1;
    });
    data.particles = data.particles.filter((part: any) => part.life > 0);

    // 7. Level up check
    if (playerExp >= playerLevel * 200 && playerLevel < 15) {
      setPlayerLevel(lv => lv + 1);
      player.maxHp += 40;
      player.hp = player.maxHp;
      player.atk += 6;
      playSfx('skill');
      triggerAnnouncer(`LEVEL UP! (LV ${playerLevel + 1})`, "Status atribut meningkat.");
    }
  };

  // Render Scene
  const renderScene = (ctx: CanvasRenderingContext2D) => {
    const data = gameEntities.current;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 900, 450);

    // Draw Lanes
    ctx.strokeStyle = "rgba(51, 65, 85, 0.6)";
    ctx.lineWidth = 45;
    ctx.beginPath();
    ctx.moveTo(70, 380);
    ctx.lineTo(830, 70); // Mid Lane
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(70, 380);
    ctx.lineTo(100, 70);
    ctx.lineTo(830, 70); // Top Lane
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(70, 380);
    ctx.lineTo(830, 380);
    ctx.lineTo(830, 70); // Bot Lane
    ctx.stroke();

    // Jungle River
    ctx.strokeStyle = "rgba(14, 116, 144, 0.35)";
    ctx.lineWidth = 35;
    ctx.beginPath();
    ctx.moveTo(150, 450);
    ctx.lineTo(750, 0);
    ctx.stroke();

    // Draw Turrets
    const drawTurret = (t: any, isAlly: boolean) => {
      if (t.hp <= 0) return;
      ctx.fillStyle = isAlly ? "#3b82f6" : "#ef4444";
      ctx.shadowColor = isAlly ? "#3b82f6" : "#ef4444";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(t.x - 22, t.y - 28, 44, 4);
      ctx.fillStyle = isAlly ? "#3b82f6" : "#ef4444";
      ctx.fillRect(t.x - 22, t.y - 28, (t.hp / t.maxHp) * 44, 4);
    };

    data.playerTowers.forEach((t: any) => drawTurret(t, true));
    data.enemyTowers.forEach((t: any) => drawTurret(t, false));

    // Draw Nexus Crystal
    const drawNexus = (n: any, isAlly: boolean) => {
      ctx.fillStyle = isAlly ? "#60a5fa" : "#f87171";
      ctx.shadowColor = isAlly ? "#60a5fa" : "#f87171";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(n.x - 30, n.y - 40, 60, 5);
      ctx.fillStyle = isAlly ? "#22c55e" : "#ef4444";
      ctx.fillRect(n.x - 30, n.y - 40, (n.hp / n.maxHp) * 60, 5);
    };

    drawNexus(data.playerNexus, true);
    drawNexus(data.enemyNexus, false);

    // Draw Jungle Monsters
    data.jungleMonsters.forEach((m: any) => {
      if (m.hp <= 0) return;
      ctx.fillStyle = m.color;
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(m.name, m.x, m.y - 24);

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(m.x - 16, m.y - 18, 32, 3);
      ctx.fillStyle = m.color;
      ctx.fillRect(m.x - 16, m.y - 18, (m.hp / m.maxHp) * 32, 3);
    });

    // Draw Minions
    const drawMinions = (list: any[], color: string) => {
      list.forEach((m: any) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(m.x - 10, m.y - 14, 20, 2);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(m.x - 10, m.y - 14, (m.hp / m.maxHp) * 20, 2);
      });
    };
    drawMinions(data.playerMinions, "#3b82f6");
    drawMinions(data.enemyMinions, "#ef4444");

    // Draw Projectiles
    data.projectiles.forEach((p: any) => {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Particles
    data.particles.forEach((part: any) => {
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Hero
    const p = data.player;
    ctx.fillStyle = selectedSkin?.color || selectedHero.color;
    ctx.shadowColor = selectedSkin?.glowColor || selectedHero.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${selectedHero.name} (Lv.${playerLevel})`, p.x, p.y - 32);

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(p.x - 24, p.y - 25, 48, 5);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(p.x - 24, p.y - 25, (p.hp / p.maxHp) * 48, 5);

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(p.x - 24, p.y - 19, 48, 3);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(p.x - 24, p.y - 19, (p.mana / p.maxMana) * 48, 3);

    // Draw Enemy Hero
    const en = data.enemyHero;
    if (en.hp > 0) {
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(en.name, en.x, en.y - 30);

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(en.x - 24, en.y - 23, 48, 5);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(en.x - 24, en.y - 23, (en.hp / en.maxHp) * 48, 5);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-body select-none">
      {/* TOP NAVBAR */}
      <header className="h-16 px-4 md:px-6 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (gameState !== 'lobby') {
                if (confirm("Keluar dari pertandingan? Progress akan hilang.")) {
                  setGameState('lobby');
                }
              } else {
                router.push('/');
              }
            }} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black italic uppercase tracking-tighter leading-none">
                ALIBANK ARENA
              </h1>
              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest">
                MOBA 5V5 E-SPORTS
              </span>
            </div>
          </div>
        </div>

        {/* TOP STATS & NAVIGATION */}
        <div className="flex items-center gap-3">
          {gameState === 'playing' ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black">
                <Coins className="w-3.5 h-3.5 mr-1" /> {gold} G
              </Badge>
              <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-black">
                ⚔️ {kills} / {deaths} / {assists}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase italic">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {(userData?.cryptoBalances?.ALX || 0).toFixed(2)} ALX
              </Badge>
            </div>
          )}

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </header>

      {/* GAME LOBBY TABS */}
      {gameState === 'lobby' && (
        <div className="flex-1 flex flex-col">
          {/* NAVIGATION TABS */}
          <div className="flex items-center justify-around border-b border-white/5 bg-slate-900/40 p-2">
            {[
              { id: 'arena', label: 'BATTLE ARENA', icon: Gamepad2 },
              { id: 'shop', label: 'HERO & SKIN', icon: ShoppingBag },
              { id: 'emblem', label: 'EMBLEM SET', icon: Shield },
              { id: 'builds', label: 'EQUIPMENT', icon: Sword },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase italic transition-all ${
                  activeTab === tab.id 
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto overflow-y-auto">
            {/* TAB 1: BATTLE ARENA */}
            {activeTab === 'arena' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* HERO BANNER PREVIEW */}
                <Card className="rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 border border-white/10 p-6 md:p-8 relative overflow-hidden shadow-2xl">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="space-y-4 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase italic">
                          {selectedHero.role}
                        </Badge>
                        {selectedSkin && (
                          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black uppercase italic">
                            SKIN {selectedSkin.tier.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                        {selectedSkin?.name || selectedHero.name}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-400 font-bold max-w-lg">
                        {selectedSkin?.tagline || selectedHero.title}
                      </p>

                      {/* STATS OVERVIEW */}
                      <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Physical ATK</p>
                          <p className="text-sm font-black text-amber-400">{selectedHero.atk + (selectedSkin?.bonusAtk || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">HP Base</p>
                          <p className="text-sm font-black text-green-400">{selectedHero.hp + (selectedSkin?.bonusHp || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Armor</p>
                          <p className="text-sm font-black text-blue-400">{selectedHero.armor}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Speed</p>
                          <p className="text-sm font-black text-purple-400">{selectedHero.speed}</p>
                        </div>
                      </div>
                    </div>

                    {/* HERO AVATAR / ICON */}
                    <div className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border-4 border-amber-500/40 flex items-center justify-center text-7xl shadow-2xl relative">
                      {selectedSkin?.avatarUrl || selectedHero.portrait}
                      <div className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-20 pointer-events-none" />
                    </div>
                  </div>
                </Card>

                {/* GAME MODE SELECTION: SOLO VS MABAR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SOLO MATCH */}
                  <Card 
                    onClick={() => { setGameMode('solo'); startBattle(); }}
                    className="rounded-[2rem] bg-slate-900/60 border border-white/10 p-6 hover:border-amber-500/50 hover:bg-slate-900 transition-all cursor-pointer group shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-black italic uppercase tracking-tight text-white">
                          SOLO VS BOT PRO
                        </h3>
                        <p className="text-xs text-slate-400 font-bold">
                          Main langsung tanpa antre melawan Bot AI terlatih dengan rank Mythic.
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* MABAR ONLINE MULTIPLAYER */}
                  <Card 
                    onClick={() => setGameMode('mabar')}
                    className={`rounded-[2rem] bg-slate-900/60 border p-6 transition-all cursor-pointer group shadow-xl ${
                      gameMode === 'mabar' ? "border-amber-500 bg-amber-500/5" : "border-white/10 hover:border-amber-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-black italic uppercase tracking-tight text-white">
                          MABAR REAL-TIME MULTIPLAYER
                        </h3>
                        <p className="text-xs text-slate-400 font-bold">
                          Buat room atau gabung dengan teman user AliBank lain secara realtime!
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* MABAR ONLINE ROOM PANEL */}
                {gameMode === 'mabar' && (
                  <Card className="rounded-[2.5rem] bg-slate-900 border border-amber-500/30 p-6 md:p-8 space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-amber-400" />
                        <div>
                          <h3 className="text-lg font-black italic uppercase text-white">
                            Lobby Mabar Online
                          </h3>
                          <p className="text-xs text-slate-400 font-bold">
                            Tersinkronisasi langsung via Firestore Cloud.
                          </p>
                        </div>
                      </div>
                      {roomCode && (
                        <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1">
                          ROOM: {roomCode}
                        </Badge>
                      )}
                    </div>

                    {!roomCode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* CREATE ROOM */}
                        <div className="p-6 bg-slate-950/60 rounded-2xl border border-white/5 space-y-4">
                          <h4 className="text-sm font-black italic uppercase text-white">Buat Ruangan Baru</h4>
                          <p className="text-xs text-slate-400 font-bold">
                            Jadilah Host dan undang teman dengan membagikan 6 digit Kode Room.
                          </p>
                          <Button 
                            onClick={createMabarRoom} 
                            disabled={isConnectingRoom}
                            className="w-full h-12 gold-gradient text-white font-black italic uppercase rounded-xl"
                          >
                            {isConnectingRoom ? <Loader2 className="w-5 h-5 animate-spin" /> : "BUAT ROOM SEKARANG"}
                          </Button>
                        </div>

                        {/* JOIN ROOM */}
                        <div className="p-6 bg-slate-950/60 rounded-2xl border border-white/5 space-y-4">
                          <h4 className="text-sm font-black italic uppercase text-white">Gabung Ruangan Teman</h4>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Masukkan Kode Room (misal: ALX-1234)" 
                              value={inputRoomCode}
                              onChange={(e) => setInputRoomCode(e.target.value)}
                              className="h-12 bg-slate-900 border-white/10 rounded-xl text-xs font-mono uppercase text-white"
                            />
                            <Button 
                              onClick={joinMabarRoom} 
                              disabled={isConnectingRoom || !inputRoomCode.trim()}
                              className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black italic uppercase rounded-xl"
                            >
                              GABUNG
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ROOM WAITING LOBBY */
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          {/* HOST BOX */}
                          <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center font-black text-xl text-white">
                              👑
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-amber-400 uppercase">HOST PLAYER 1</span>
                              <p className="text-sm font-black text-white">{roomData?.hostName || "Host"}</p>
                              <Badge className="bg-blue-500/20 text-blue-400 text-[8px] font-bold mt-1">
                                {roomData?.hostHero || selectedHero.name}
                              </Badge>
                            </div>
                          </div>

                          {/* GUEST BOX */}
                          <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center font-black text-xl text-purple-300">
                              ⚔️
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-purple-400 uppercase">CHALLENGER PLAYER 2</span>
                              <p className="text-sm font-black text-white">
                                {roomData?.guestName || "Menunggu pemain..."}
                              </p>
                              {roomData?.guestHero ? (
                                <Badge className="bg-purple-500/20 text-purple-300 text-[8px] font-bold mt-1">
                                  {roomData.guestHero}
                                </Badge>
                              ) : (
                                <span className="text-[8px] text-slate-500 block mt-1 animate-pulse">Menghubungkan...</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* HOST CONTROLS */}
                        {isHost ? (
                          <Button
                            onClick={launchMabarMatch}
                            className="w-full h-14 gold-gradient text-white font-black italic uppercase text-base rounded-2xl shadow-xl tracking-wider"
                          >
                            MULAI PERTEMPURAN MABAR
                          </Button>
                        ) : (
                          <div className="text-center py-3 text-xs font-bold text-amber-400 animate-pulse">
                            Menunggu Host ({roomData?.hostName}) menekan tombol Mulai...
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                {/* HERO ROSTER SELECTION */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase italic text-slate-400 tracking-widest">
                    PILIH HERO ANDA
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {MOBA_HEROES.map(hero => {
                      const isOwned = ownedHeroes.includes(hero.id);
                      const isSelected = selectedHero.id === hero.id;

                      return (
                        <div
                          key={hero.id}
                          onClick={() => {
                            if (isOwned) {
                              setSelectedHero(hero);
                              setSelectedSkin(null);
                            } else {
                              buyHeroWithAlx(hero);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative text-center space-y-2 ${
                            isSelected 
                              ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 scale-105" 
                              : isOwned
                              ? "border-white/10 bg-slate-900/60 hover:border-white/30"
                              : "border-white/5 bg-slate-950/40 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="w-14 h-14 rounded-full mx-auto bg-slate-800 flex items-center justify-center text-3xl shadow-inner">
                            {hero.portrait}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white truncate">{hero.name.split(' ')[0]}</p>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{hero.role}</span>
                          </div>
                          {!isOwned && (
                            <Badge className="bg-amber-500 text-slate-950 text-[8px] font-black h-4 px-1 border-none">
                              {hero.priceAlx} ALX
                            </Badge>
                          )}
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-amber-400 mx-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BATTLE SPELL & EMBLEM QUICK SELECT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SPELLS */}
                  <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/10 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Battle Spell Aktif</span>
                    <div className="flex gap-2">
                      {BATTLE_SPELLS.map(spell => (
                        <button
                          key={spell.id}
                          onClick={() => setSelectedSpell(spell)}
                          className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                            selectedSpell.id === spell.id 
                              ? "border-amber-400 bg-amber-500/10 text-white" 
                              : "border-white/5 bg-slate-950 text-slate-400"
                          }`}
                        >
                          <span className="text-xl block">{spell.icon}</span>
                          <span className="text-[9px] font-black uppercase mt-1 block">{spell.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* EMBLEM */}
                  <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/10 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Emblem Set Aktif</span>
                    <div className="flex gap-2">
                      {MOBA_EMBLEMS.slice(0, 4).map(emblem => (
                        <button
                          key={emblem.id}
                          onClick={() => setSelectedEmblem(emblem)}
                          className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                            selectedEmblem.id === emblem.id 
                              ? "border-amber-400 bg-amber-500/10 text-white" 
                              : "border-white/5 bg-slate-950 text-slate-400"
                          }`}
                        >
                          <span className="text-xl block">{emblem.icon}</span>
                          <span className="text-[9px] font-black uppercase mt-1 block">Lv.{emblemLevels[emblem.id] || 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HERO & SKIN SHOP */}
            {activeTab === 'shop' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black italic uppercase text-white">TOKO HERO & SKIN KOLEKSI</h2>
                  <p className="text-xs text-slate-400 font-bold">
                    Gunakan koin ALX Anda untuk membuka hero dan skin eksklusif berstatus bonus!
                  </p>
                </div>

                {/* SKINS ROSTER */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {MOBA_HEROES.flatMap(h => h.skins.map(s => ({ ...s, heroName: h.name, heroId: h.id }))).map(skin => {
                    const isOwned = ownedSkins.includes(skin.id);

                    return (
                      <Card key={skin.id} className="rounded-3xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-xl space-y-4">
                        <div className="h-44 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 flex items-center justify-center text-7xl relative">
                          {skin.avatarUrl}
                          <Badge className="absolute top-4 right-4 bg-amber-500 text-slate-950 font-black text-[9px] uppercase">
                            {skin.tier}
                          </Badge>
                        </div>
                        <div className="p-5 space-y-3">
                          <div>
                            <h4 className="text-base font-black italic uppercase text-white">{skin.name}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{skin.heroName}</span>
                          </div>
                          <p className="text-xs text-slate-400">{skin.tagline}</p>
                          <div className="flex gap-2 text-[10px] font-bold text-amber-400">
                            <span>+{skin.bonusAtk} Physical ATK</span>
                            <span>•</span>
                            <span>+{skin.bonusHp} HP Max</span>
                          </div>
                          <Button
                            onClick={() => {
                              if (isOwned) {
                                setSelectedSkin(skin);
                                const h = MOBA_HEROES.find(hero => hero.id === skin.heroId);
                                if (h) setSelectedHero(h);
                                toast({ title: "Skin Terpasang!", description: `${skin.name} aktif untuk pertempuran.` });
                              } else {
                                buySkinWithAlx(skin);
                              }
                            }}
                            className={`w-full h-11 font-black italic uppercase text-xs rounded-xl ${
                              isOwned ? "bg-green-600 text-white" : "gold-gradient text-white"
                            }`}
                          >
                            {isOwned ? "PASANG SKIN" : `BELI DENGAN ${skin.priceAlx} ALX`}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: EMBLEM MATRIX */}
            {activeTab === 'emblem' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black italic uppercase text-white">SET EMBLEM & TALENTA</h2>
                  <p className="text-xs text-slate-400 font-bold">
                    Tingkatkan level emblem untuk menambah atribut dasar hero secara permanen.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {MOBA_EMBLEMS.map(emblem => {
                    const currentLv = emblemLevels[emblem.id] || 1;
                    return (
                      <Card key={emblem.id} className="rounded-3xl bg-slate-900 border border-white/10 p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl">
                              {emblem.icon}
                            </div>
                            <div>
                              <h4 className="text-base font-black italic uppercase text-white">{emblem.name}</h4>
                              <span className="text-[10px] font-bold text-amber-400 uppercase">LEVEL {currentLv} / 60</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => upgradeEmblem(emblem)}
                            disabled={currentLv >= 60}
                            className="h-10 px-4 gold-gradient text-white font-black text-xs uppercase rounded-xl"
                          >
                            UPGRADE (+1)
                          </Button>
                        </div>

                        <p className="text-xs text-slate-400">{emblem.description}</p>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
                          <span className="text-[9px] font-black text-amber-400 uppercase">Talenta Pasif: {emblem.talentName}</span>
                          <p className="text-xs text-slate-300 font-medium">{emblem.talentDesc}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: EQUIPMENT BUILDS */}
            {activeTab === 'builds' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black italic uppercase text-white">KATALOG EQUIPMENT MOBA</h2>
                  <p className="text-xs text-slate-400 font-bold">
                    Item build yang dapat Anda beli saat bertempur menggunakan E-Gold game.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MOBA_ITEMS.map(item => (
                    <Card key={item.id} className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-black italic uppercase text-white">{item.name}</h4>
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black">
                          {item.cost} G
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 font-bold">{item.desc}</p>
                      {item.passiveName && (
                        <p className="text-[10px] text-slate-400">
                          <span className="text-amber-400 font-bold">Pasif {item.passiveName}:</span> {item.passiveDesc}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IN-GAME BATTLE ARENA DISPLAY */}
      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
          {/* ANNOUNCER OVERLAY */}
          {announcement && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 text-center animate-in zoom-in-90 duration-200 pointer-events-none">
              <div className="px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600/90 via-amber-600/90 to-red-600/90 border-2 border-amber-400 shadow-2xl backdrop-blur-md">
                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                  {announcement.text}
                </h2>
                {announcement.sub && (
                  <p className="text-xs font-bold text-amber-200 uppercase mt-0.5 tracking-widest">
                    {announcement.sub}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CANVAS SCREEN */}
          <div className="flex-1 flex items-center justify-center p-2 relative">
            <canvas 
              ref={canvasRef} 
              width={900} 
              height={450} 
              className="w-full max-w-4xl h-auto aspect-[2/1] rounded-2xl shadow-2xl border border-white/10 bg-slate-900 object-contain"
            />

            {/* IN-GAME TOP LEFT SHOP BUTTON & MINI STATS */}
            <div className="absolute top-4 left-4 z-30 flex gap-2">
              <Button
                onClick={() => setIsShopOpen(!isShopOpen)}
                className="h-10 px-3 bg-slate-900/90 border border-amber-500/40 text-amber-400 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 backdrop-blur-md"
              >
                <ShoppingBag className="w-4 h-4" />
                SHOP ({gold} G)
              </Button>
            </div>

            {/* QUICK BUY BAR (CURRENT ITEMS) */}
            <div className="absolute top-4 right-4 z-30 flex gap-1">
              {activeItems.map((item, idx) => (
                <div key={idx} className="w-8 h-8 rounded-lg bg-slate-900/90 border border-white/20 flex items-center justify-center text-xs font-black text-amber-400 shadow-md">
                  {item.name[0]}
                </div>
              ))}
            </div>
          </div>

          {/* IN-GAME SHOP MODAL */}
          {isShopOpen && (
            <div className="absolute inset-4 z-40 bg-slate-950/95 border border-amber-500/40 rounded-3xl p-6 overflow-y-auto space-y-4 backdrop-blur-lg">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-lg font-black italic uppercase text-white">EQUIPMENT SHOP ({gold} E-GOLD)</h3>
                <Button onClick={() => setIsShopOpen(false)} className="p-2 bg-white/10 text-white rounded-xl">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {MOBA_ITEMS.map(item => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between">
                        <h4 className="text-xs font-black uppercase text-white">{item.name}</h4>
                        <span className="text-xs font-black text-amber-400">{item.cost} G</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-1">{item.desc}</p>
                    </div>
                    <Button 
                      onClick={() => buyEquipment(item)}
                      disabled={gold < item.cost}
                      className="w-full h-8 mt-2 gold-gradient text-white text-[10px] font-black uppercase rounded-lg"
                    >
                      Beli
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ON-SCREEN CONTROLS (JOYSTICK & SKILLS) */}
          <div className="h-44 bg-slate-950/90 border-t border-white/10 px-4 md:px-12 flex items-center justify-between z-20">
            {/* VIRTUAL JOYSTICK (LEFT) */}
            <div 
              ref={joystickContainerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-28 h-28 rounded-full bg-slate-900/80 border-2 border-white/20 flex items-center justify-center relative touch-none select-none"
            >
              <div 
                style={{ transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)` }}
                className="w-12 h-12 rounded-full gold-gradient shadow-lg flex items-center justify-center pointer-events-none"
              >
                <div className="w-4 h-4 rounded-full bg-white/40" />
              </div>
            </div>

            {/* ACTION & SKILL BUTTONS (RIGHT) */}
            <div className="flex items-center gap-3">
              {/* RECALL */}
              <button
                onClick={startRecall}
                className="w-12 h-12 rounded-2xl bg-slate-900 border border-blue-500/40 text-blue-400 font-black text-[10px] flex flex-col items-center justify-center active:scale-95 transition-transform"
              >
                <RotateCcw className="w-4 h-4 mb-0.5" />
                RECALL
              </button>

              {/* BATTLE SPELL */}
              <button
                onClick={triggerSpell}
                disabled={cdSpell > 0}
                className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-500/40 text-amber-400 font-black text-[10px] flex flex-col items-center justify-center relative active:scale-95 transition-transform disabled:opacity-50"
              >
                <span className="text-base">{selectedSpell.icon}</span>
                {cdSpell > 0 && (
                  <span className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center text-xs font-black text-white">
                    {cdSpell}s
                  </span>
                )}
              </button>

              {/* SKILL 1 */}
              <button
                onClick={triggerSkill1}
                disabled={cdS1 > 0}
                className="w-14 h-14 rounded-full bg-slate-900 border-2 border-blue-500 text-blue-400 font-black text-xs flex items-center justify-center relative active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-blue-500/10"
              >
                S1
                {cdS1 > 0 && (
                  <span className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-xs font-black text-white">
                    {cdS1}s
                  </span>
                )}
              </button>

              {/* SKILL 2 */}
              <button
                onClick={triggerSkill2}
                disabled={cdS2 > 0}
                className="w-14 h-14 rounded-full bg-slate-900 border-2 border-purple-500 text-purple-400 font-black text-xs flex items-center justify-center relative active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-purple-500/10"
              >
                S2
                {cdS2 > 0 && (
                  <span className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-xs font-black text-white">
                    {cdS2}s
                  </span>
                )}
              </button>

              {/* SKILL 3 (ULTIMATE) */}
              <button
                onClick={triggerUltimate}
                disabled={cdUlt > 0}
                className="w-16 h-16 rounded-full gold-gradient text-white font-black text-sm flex items-center justify-center relative active:scale-95 transition-transform disabled:opacity-50 shadow-xl shadow-amber-500/20"
              >
                ULT
                {cdUlt > 0 && (
                  <span className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-xs font-black text-white">
                    {cdUlt}s
                  </span>
                )}
              </button>

              {/* BASIC ATTACK BUTTON */}
              <button
                onClick={triggerBasicAttack}
                className="w-18 h-18 w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center shadow-2xl active:scale-90 transition-transform border-4 border-amber-300"
              >
                <Sword className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER VICTORY / DEFEAT SCREEN */}
      {(gameState === 'win' || gameState === 'loss') && (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 rounded-[2.5rem] bg-slate-900 border border-amber-500/40 text-center space-y-6 shadow-2xl">
            <div className="text-6xl animate-bounce">
              {gameState === 'win' ? "🏆" : "💀"}
            </div>
            <div className="space-y-2">
              <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${
                gameState === 'win' ? "text-amber-400" : "text-rose-500"
              }`}>
                {gameState === 'win' ? "VICTORY!" : "DEFEAT"}
              </h2>
              <p className="text-xs font-bold text-slate-400">
                {gameState === 'win' ? "Pertempuran luar biasa! Gelar MVP diraih." : "Pertahanan Nexus runtuh."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">KDA Akhir</span>
                <span className="font-black text-white">{kills} / {deaths} / {assists}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total E-Gold</span>
                <span className="font-black text-amber-400">{gold} G</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Level Akhir</span>
                <span className="font-black text-blue-400">Level {playerLevel}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {gameState === 'win' && (
                <Button
                  onClick={claimReward}
                  disabled={isClaiming || hasClaimed}
                  className="w-full h-14 gold-gradient text-white font-black italic uppercase text-sm rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  {isClaiming ? <Loader2 className="w-5 h-5 animate-spin" /> : hasClaimed ? "REWARD SUDAH DIKLAIM" : "KLAIM 0.1 ALX REWARD"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setGameState('lobby')}
                className="w-full h-12 rounded-xl font-black italic uppercase border-white/10 text-white hover:bg-white/5"
              >
                KEMBALI KE LOBBY
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

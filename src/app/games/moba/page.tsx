"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, 
  Gamepad2, 
  Trophy, 
  Coins, 
  Info,
  Loader2,
  Sword,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Heart,
  Skull
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

// Hero Classes Config
const HEROES = [
  {
    id: "ali_vanguard",
    name: "Ali Vanguard",
    type: "Fighter",
    hp: 400,
    atk: 18,
    speed: 3.2,
    color: "#3b82f6", // Neon Blue
    skillName: "Shield Slam",
    skillDesc: "Menghempaskan perisai, memberikan 50 damage instan ke musuh.",
    description: "Pertahanan tinggi, serangan jarak dekat tangguh."
  },
  {
    id: "alix_frost",
    name: "Alix Frostweaver",
    type: "Mage",
    hp: 280,
    atk: 25,
    speed: 2.8,
    color: "#a855f7", // Neon Purple
    skillName: "Blizzard Blast",
    skillDesc: "Membekukan area, memberikan 80 damage ke musuh dalam range.",
    description: "Daya hancur sihir luar biasa, HP sedang."
  },
  {
    id: "darmedia_ranger",
    name: "Darmedia Ranger",
    type: "Marksman",
    hp: 240,
    atk: 32,
    speed: 3.6,
    color: "#eab308", // Gold/Yellow
    skillName: "Storm Arrow",
    skillDesc: "Tembakan cepat bertubi-tubi, memberikan 100 damage.",
    description: "Serangan jarak jauh berdaya hancur tinggi, pertahanan rendah."
  }
];

// In-Game Items Config
const ITEMS = [
  { id: "sword", name: "Sword of ALX", cost: 150, atk: 12, hp: 0, speed: 0, icon: Sword, desc: "+12 Attack" },
  { id: "shield", name: "Shield of Dzulfikar", cost: 150, atk: 0, hp: 120, speed: 0, icon: Shield, desc: "+120 Health" },
  { id: "boots", name: "Boots of Swiftness", cost: 100, atk: 0, hp: 0, speed: 0.8, icon: Zap, desc: "+0.8 Speed" }
];

export default function MobaGamePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'win' | 'loss'>('lobby');
  const [selectedHero, setSelectedHero] = useState<any>(HEROES[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gold, setGold] = useState(0);
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [activeItems, setActiveItems] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);

  // Audio system ref
  const audioCtx = useRef<AudioContext | null>(null);

  // User database reference
  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  // Canvas and game variables ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Game entities refs
  const gameEntities = useRef<any>({
    player: { x: 80, y: 320, hp: 100, maxHp: 100, atk: 10, speed: 3, radius: 15 },
    enemyHero: { x: 720, y: 80, hp: 350, maxHp: 350, atk: 15, speed: 2, radius: 15, targetX: 720, targetY: 80 },
    playerMinions: [],
    enemyMinions: [],
    playerTowers: [
      { x: 250, y: 250, hp: 500, maxHp: 500, radius: 22, range: 120, lastShot: 0 },
      { x: 120, y: 200, hp: 600, maxHp: 600, radius: 22, range: 120, lastShot: 0 }
    ],
    enemyTowers: [
      { x: 550, y: 150, hp: 500, maxHp: 500, radius: 22, range: 120, lastShot: 0 },
      { x: 680, y: 200, hp: 600, maxHp: 600, radius: 22, range: 120, lastShot: 0 }
    ],
    playerNexus: { x: 50, y: 350, hp: 1000, maxHp: 1000, radius: 30 },
    enemyNexus: { x: 750, y: 50, hp: 1000, maxHp: 1000, radius: 30 },
    projectiles: [],
    particles: [],
    spawnTimer: 0
  });

  useEffect(() => {
    setMounted(true);
    return () => {
      if (audioCtx.current) audioCtx.current.close();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        triggerAutoAttack();
      }
      if (e.key.toLowerCase() === 'q') {
        triggerSkill();
      }
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
  }, [gameState, selectedHero, cooldown]);

  // Audio synthesizer using Web Audio API
  const playSynthesizedSound = (type: 'shoot' | 'explode' | 'coin' | 'skill' | 'defeat') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'shoot') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'explode') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'coin') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'skill') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'defeat') {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("Sound synth error:", e);
    }
  };

  const triggerAutoAttack = () => {
    if (gameState !== 'playing') return;
    const player = gameEntities.current.player;
    // Find closest enemy entity
    let closestEnemy: any = null;
    let minDist = 180; // range limit

    const enemies = [
      gameEntities.current.enemyHero,
      ...gameEntities.current.enemyMinions,
      ...gameEntities.current.enemyTowers,
      gameEntities.current.enemyNexus
    ];

    enemies.forEach((enemy: any) => {
      if (!enemy || enemy.hp <= 0) return;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < minDist) {
        minDist = dist;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      // Shoot projectile
      gameEntities.current.projectiles.push({
        x: player.x,
        y: player.y,
        targetX: closestEnemy.x,
        targetY: closestEnemy.y,
        speed: 7,
        damage: player.atk,
        color: selectedHero.color,
        isPlayerFriendly: true,
        target: closestEnemy
      });
      playSynthesizedSound('shoot');
    }
  };

  const triggerSkill = () => {
    if (gameState !== 'playing' || cooldown > 0) return;
    const player = gameEntities.current.player;
    const enemyHero = gameEntities.current.enemyHero;

    // Apply special visual splash
    createVisualExplosion(player.x, player.y, selectedHero.color, 25);
    
    // Skill damage to enemy hero if in range
    const dist = Math.hypot(enemyHero.x - player.x, enemyHero.y - player.y);
    if (dist < 200 && enemyHero.hp > 0) {
      enemyHero.hp = Math.max(0, enemyHero.hp - (selectedHero.id === 'ali_vanguard' ? 50 : (selectedHero.id === 'alix_frost' ? 80 : 100)));
      createVisualExplosion(enemyHero.x, enemyHero.y, "#f43f5e", 30);
      
      if (enemyHero.hp <= 0) {
        setKills(k => k + 1);
        setGold(g => g + 200);
        playSynthesizedSound('explode');
        toast({ title: "Hero Defeated!", description: `Anda membunuh enemy hero! +200 E-Gold.` });
      }
    }

    setCooldown(6); // 6s cooldown
    playSynthesizedSound('skill');

    // Start cooldown countdown
    const cdInterval = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) {
          clearInterval(cdInterval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  // Buy item handler
  const handleBuyItem = (item: any) => {
    if (gold < item.cost) {
      toast({ variant: "destructive", title: "E-Gold Kurang", description: "Habisi minion musuh untuk mengumpulkan E-Gold." });
      return;
    }
    
    setGold(g => g - item.cost);
    setActiveItems(items => [...items, item.id]);
    playSynthesizedSound('coin');

    // Upgrade stats
    const player = gameEntities.current.player;
    player.atk += item.atk;
    player.maxHp += item.hp;
    player.hp += item.hp;
    player.speed += item.speed;

    toast({ title: `${item.name} Dibeli`, description: `${item.desc} ditambahkan ke status Hero Anda.` });
  };

  const createVisualExplosion = (x: number, y: number, color: string, count = 10) => {
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

  // Main game initializer
  const startGame = () => {
    setGold(0);
    setKills(0);
    setDeaths(0);
    setHasClaimed(false);
    setActiveItems([]);
    setCooldown(0);

    // Set stats based on selected class
    gameEntities.current = {
      player: { 
        x: 80, 
        y: 320, 
        hp: selectedHero.hp, 
        maxHp: selectedHero.hp, 
        atk: selectedHero.atk, 
        speed: selectedHero.speed, 
        radius: 14 
      },
      enemyHero: { 
        x: 720, 
        y: 80, 
        hp: selectedHero.hp * 0.9, 
        maxHp: selectedHero.hp * 0.9, 
        atk: selectedHero.atk * 0.8, 
        speed: selectedHero.speed * 0.8, 
        radius: 14, 
        targetX: 720, 
        targetY: 80, 
        respawnTimer: 0 
      },
      playerMinions: [],
      enemyMinions: [],
      playerTowers: [
        { x: 260, y: 260, hp: 500, maxHp: 500, radius: 18, range: 110, lastShot: 0 },
        { x: 140, y: 220, hp: 600, maxHp: 600, radius: 18, range: 110, lastShot: 0 }
      ],
      enemyTowers: [
        { x: 540, y: 140, hp: 500, maxHp: 500, radius: 18, range: 110, lastShot: 0 },
        { x: 660, y: 180, hp: 600, maxHp: 600, radius: 18, range: 110, lastShot: 0 }
      ],
      playerNexus: { x: 50, y: 350, hp: 1200, maxHp: 1200, radius: 26 },
      enemyNexus: { x: 750, y: 50, hp: 1200, maxHp: 1200, radius: 26 },
      projectiles: [],
      particles: [],
      spawnTimer: 0
    };

    setGameState('playing');
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      updateGamePhysics();
      renderGameScreen(ctx);
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  const updateGamePhysics = () => {
    const data = gameEntities.current;
    const player = data.player;
    const enemyHero = data.enemyHero;

    // 1. Move Player
    let dx = 0;
    let dy = 0;
    if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= 1;
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += 1;
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= 1;
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      // Normalize speed
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    player.x = Math.max(player.radius, Math.min(800 - player.radius, player.x + dx * player.speed));
    player.y = Math.max(player.radius, Math.min(400 - player.radius, player.y + dy * player.speed));

    // 2. Spawn Minions periodically (every 10 seconds / 600 frames)
    data.spawnTimer++;
    if (data.spawnTimer % 450 === 0) {
      // Spawn 3 player minions
      for (let i = 0; i < 3; i++) {
        data.playerMinions.push({
          x: 50 + Math.random() * 20 - 10,
          y: 350 + Math.random() * 20 - 10,
          hp: 120,
          maxHp: 120,
          atk: 5,
          speed: 1.2,
          radius: 8,
          color: '#3b82f6',
          target: null
        });
      }
      // Spawn 3 enemy minions
      for (let i = 0; i < 3; i++) {
        data.enemyMinions.push({
          x: 750 + Math.random() * 20 - 10,
          y: 50 + Math.random() * 20 - 10,
          hp: 120,
          maxHp: 120,
          atk: 5,
          speed: 1.2,
          radius: 8,
          color: '#ef4444',
          target: null
        });
      }
    }

    // 3. Move & Fight Player Minions (March towards top-right base)
    data.playerMinions.forEach((minion: any) => {
      // Find closest enemy target (minion, hero, tower, nexus)
      let target: any = null;
      let targetDist = 1000;

      const enemies = [
        enemyHero,
        ...data.enemyMinions,
        ...data.enemyTowers,
        data.enemyNexus
      ];

      enemies.forEach((enemy: any) => {
        if (!enemy || enemy.hp <= 0) return;
        const d = Math.hypot(enemy.x - minion.x, enemy.y - minion.y);
        if (d < targetDist) {
          targetDist = d;
          target = enemy;
        }
      });

      if (target && targetDist < 80) {
        // Attack range
        if (targetDist < 25) {
          // Combat hit
          if (Math.random() < 0.05) {
            target.hp = Math.max(0, target.hp - minion.atk);
            createVisualExplosion(target.x, target.y, '#ef4444', 3);
            if (target.hp <= 0 && target === enemyHero) {
              setKills(k => k + 1);
              setGold(g => g + 200);
              playSynthesizedSound('explode');
            }
          }
        } else {
          // Move towards target
          const angle = Math.atan2(target.y - minion.y, target.x - minion.x);
          minion.x += Math.cos(angle) * minion.speed;
          minion.y += Math.sin(angle) * minion.speed;
        }
      } else {
        // Move towards enemy base (top-right)
        const angle = Math.atan2(50 - minion.y, 750 - minion.x);
        minion.x += Math.cos(angle) * minion.speed;
        minion.y += Math.sin(angle) * minion.speed;
      }
    });

    // 4. Move & Fight Enemy Minions (March towards bottom-left base)
    data.enemyMinions.forEach((minion: any) => {
      let target: any = null;
      let targetDist = 1000;

      const enemies = [
        player,
        ...data.playerMinions,
        ...data.playerTowers,
        data.playerNexus
      ];

      enemies.forEach((enemy: any) => {
        if (!enemy || enemy.hp <= 0) return;
        const d = Math.hypot(enemy.x - minion.x, enemy.y - minion.y);
        if (d < targetDist) {
          targetDist = d;
          target = enemy;
        }
      });

      if (target && targetDist < 80) {
        if (targetDist < 25) {
          if (Math.random() < 0.05) {
            target.hp = Math.max(0, target.hp - minion.atk);
            createVisualExplosion(target.x, target.y, '#3b82f6', 3);
            if (target.hp <= 0 && target === player) {
              handlePlayerDeath();
            }
          }
        } else {
          const angle = Math.atan2(target.y - minion.y, target.x - minion.x);
          minion.x += Math.cos(angle) * minion.speed;
          minion.y += Math.sin(angle) * minion.speed;
        }
      } else {
        const angle = Math.atan2(350 - minion.y, 50 - minion.x);
        minion.x += Math.cos(angle) * minion.speed;
        minion.y += Math.sin(angle) * minion.speed;
      }
    });

    // 5. Enemy Hero AI
    if (enemyHero.hp > 0) {
      // Simple logic: defend the closest tower, otherwise target player or player base
      let target: any = null;
      let targetDist = 1000;

      const enemies = [
        player,
        ...data.playerMinions
      ];

      enemies.forEach((enemy: any) => {
        if (!enemy || enemy.hp <= 0) return;
        const d = Math.hypot(enemy.x - enemyHero.x, enemy.y - enemyHero.y);
        if (d < targetDist) {
          targetDist = d;
          target = enemy;
        }
      });

      if (target && targetDist < 200) {
        // Chase and shoot
        if (targetDist > 100) {
          const angle = Math.atan2(target.y - enemyHero.y, target.x - enemyHero.x);
          enemyHero.x += Math.cos(angle) * enemyHero.speed;
          enemyHero.y += Math.sin(angle) * enemyHero.speed;
        } else {
          // Shoot fire project
          if (Math.random() < 0.02) {
            data.projectiles.push({
              x: enemyHero.x,
              y: enemyHero.y,
              targetX: target.x,
              targetY: target.y,
              speed: 5,
              damage: enemyHero.atk,
              color: '#ef4444',
              isPlayerFriendly: false,
              target
            });
            playSynthesizedSound('shoot');
          }
        }
      } else {
        // Guard mid map
        const guardX = 400;
        const guardY = 200;
        const d = Math.hypot(guardX - enemyHero.x, guardY - enemyHero.y);
        if (d > 20) {
          const angle = Math.atan2(guardY - enemyHero.y, guardX - enemyHero.x);
          enemyHero.x += Math.cos(angle) * enemyHero.speed;
          enemyHero.y += Math.sin(angle) * enemyHero.speed;
        }
      }
    } else {
      // Respawn timer
      enemyHero.respawnTimer++;
      if (enemyHero.respawnTimer > 300) {
        enemyHero.hp = enemyHero.maxHp;
        enemyHero.x = 720;
        enemyHero.y = 80;
        enemyHero.respawnTimer = 0;
        toast({ title: "Enemy Hero Respawned", description: "Musuh kembali mempertahankan base mereka!" });
      }
    }

    // 6. Projectiles Physics
    data.projectiles.forEach((p: any, index: number) => {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < p.speed) {
        // Hit target
        if (p.target && p.target.hp > 0) {
          p.target.hp = Math.max(0, p.target.hp - p.damage);
          createVisualExplosion(p.target.x, p.target.y, p.color, 8);
          
          // Check death
          if (p.target.hp <= 0) {
            if (p.target === player) {
              handlePlayerDeath();
            } else if (p.target === enemyHero) {
              setKills(k => k + 1);
              setGold(g => g + 200);
              playSynthesizedSound('explode');
              toast({ title: "Hero Defeated!", description: "Anda membunuh enemy hero! +200 E-Gold." });
            } else if (p.target === data.enemyNexus) {
              setGameState('win');
              playSynthesizedSound('defeat');
            } else if (p.target === data.playerNexus) {
              setGameState('loss');
              playSynthesizedSound('defeat');
            } else {
              // Minion or tower kill
              setGold(g => g + 40);
              playSynthesizedSound('coin');
            }
          }
        }
        data.projectiles.splice(index, 1);
      } else {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }
    });

    // 7. Tower Attacks
    const handleTowerShooting = (towers: any[], targets: any[], isFriendly: boolean) => {
      towers.forEach((tower: any) => {
        if (tower.hp <= 0) return;
        
        // Find target in range
        let shootTarget: any = null;
        let minDist = tower.range;

        targets.forEach((tar: any) => {
          if (!tar || tar.hp <= 0) return;
          const d = Math.hypot(tar.x - tower.x, tar.y - tower.y);
          if (d < minDist) {
            minDist = d;
            shootTarget = tar;
          }
        });

        if (shootTarget) {
          const now = Date.now();
          if (now - tower.lastShot > 1500) { // 1.5s shot cooldown
            data.projectiles.push({
              x: tower.x,
              y: tower.y,
              targetX: shootTarget.x,
              targetY: shootTarget.y,
              speed: 4,
              damage: 40,
              color: isFriendly ? '#60a5fa' : '#f87171',
              isPlayerFriendly: isFriendly,
              target: shootTarget
            });
            tower.lastShot = now;
            playSynthesizedSound('shoot');
          }
        }
      });
    };

    // Player towers target enemy minions, then enemy hero
    handleTowerShooting(data.playerTowers, [...data.enemyMinions, enemyHero], true);
    // Enemy towers target player minions, then player hero
    handleTowerShooting(data.enemyTowers, [...data.playerMinions, player], false);

    // 8. Clean dead entities
    data.playerMinions = data.playerMinions.filter((m: any) => m.hp > 0);
    data.enemyMinions = data.enemyMinions.filter((m: any) => m.hp > 0);
    data.playerTowers = data.playerTowers.filter((t: any) => t.hp > 0);
    data.enemyTowers = data.enemyTowers.filter((t: any) => t.hp > 0);

    // 9. Update particles
    data.particles.forEach((part: any, index: number) => {
      part.x += part.vx;
      part.y += part.vy;
      part.life--;
      if (part.life <= 0) data.particles.splice(index, 1);
    });
  };

  const handlePlayerDeath = () => {
    setDeaths(d => d + 1);
    const data = gameEntities.current;
    
    createVisualExplosion(data.player.x, data.player.y, '#eab308', 35);
    playSynthesizedSound('explode');

    toast({ variant: "destructive", title: "You Defeated", description: "Hero Anda tewas! Menunggu respawn..." });
    
    // Move player back to base and heal
    data.player.x = 80;
    data.player.y = 320;
    data.player.hp = data.player.maxHp;
  };

  const renderGameScreen = (ctx: CanvasRenderingContext2D) => {
    const data = gameEntities.current;
    
    // Clear screen with neon dark color
    ctx.fillStyle = "#0f172a"; // Slate-900
    ctx.fillRect(0, 0, 800, 400);

    // Draw Lane boundary lines
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 40;
    ctx.beginPath();
    ctx.moveTo(80, 320);
    ctx.lineTo(720, 80);
    ctx.stroke();

    // Draw river
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
    ctx.fillRect(360, 0, 80, 400);

    // Draw Nexus/Bases
    const drawNexus = (nexus: any, color: string, label: string) => {
      if (nexus.hp <= 0) return;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(nexus.x, nexus.y, nexus.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw HP Bar
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(nexus.x - 30, nexus.y - 45, 60, 6);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(nexus.x - 30, nexus.y - 45, (nexus.hp / nexus.maxHp) * 60, 6);
      
      // Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "9px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, nexus.x, nexus.y - 50);
    };

    drawNexus(data.playerNexus, "#2563eb", "ALLIED NEXUS");
    drawNexus(data.enemyNexus, "#dc2626", "ENEMY NEXUS");

    // Draw Towers
    const drawTowers = (towers: any[], color: string, glow: string) => {
      towers.forEach((t: any) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = glow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // HP bar
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(t.x - 20, t.y - 30, 40, 5);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(t.x - 20, t.y - 30, (t.hp / t.maxHp) * 40, 5);
      });
    };

    drawTowers(data.playerTowers, "#1e3a8a", "#60a5fa");
    drawTowers(data.enemyTowers, "#7f1d1d", "#f87171");

    // Draw Minions
    const drawMinions = (minions: any[]) => {
      minions.forEach((m: any) => {
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();

        // HP mini bar
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(m.x - 10, m.y - 14, 20, 3);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(m.x - 10, m.y - 14, (m.hp / m.maxHp) * 20, 3);
      });
    };

    drawMinions(data.playerMinions);
    drawMinions(data.enemyMinions);

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
    const player = data.player;
    ctx.fillStyle = selectedHero.color;
    ctx.shadowColor = selectedHero.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player Hero HP Bar
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(player.x - 22, player.y - 26, 44, 5);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(player.x - 22, player.y - 26, (player.hp / player.maxHp) * 44, 5);

    // Draw Enemy Hero
    const enemyHero = data.enemyHero;
    if (enemyHero.hp > 0) {
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(enemyHero.x, enemyHero.y, enemyHero.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Enemy Hero HP Bar
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(enemyHero.x - 22, enemyHero.y - 26, 44, 5);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(enemyHero.x - 22, enemyHero.y - 26, (enemyHero.hp / enemyHero.maxHp) * 44, 5);
    }
  };

  // Claim ALX Reward
  const claimReward = async () => {
    if (!user || isClaiming || hasClaimed) return;
    setIsClaiming(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/games/moba/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengklaim token.");
      }

      setHasClaimed(true);
      toast({
        title: "Reward Diklaim!",
        description: `Berhasil mengklaim ${data.rewardAmount} ALX ke akun AliBank Anda!`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Klaim Gagal",
        description: err.message
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 relative overflow-hidden">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-0 w-full h-96 gold-gradient opacity-5 blur-[100px]" />
      
      {/* TOP HEADER */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (gameState !== 'playing') {
                router.push('/');
              } else {
                if (confirm("Keluar dari game? Progress akan hilang.")) {
                  setGameState('lobby');
                }
              }
            }} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg"><Gamepad2 className="text-white w-4 h-4" /></div>
            <span className="font-black italic uppercase tracking-tighter text-sm">AliBank Arena MOBA</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* E-Gold display */}
          {gameState === 'playing' && (
            <Badge className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 font-bold text-xs flex items-center gap-1.5 rounded-xl">
              <Coins className="w-3.5 h-3.5" />
              {gold} E-Gold
            </Badge>
          )}

          {/* User Account ALX Balance */}
          {userData && (
            <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 font-black text-xs flex items-center gap-1.5 rounded-xl uppercase italic">
              <Sparkles className="w-3.5 h-3.5" />
              {(userData.cryptoBalances?.ALX || 0).toFixed(2)} ALX
            </Badge>
          )}

          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            {soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8 max-w-4xl">
        {gameState === 'lobby' ? (
          <div className="space-y-8 max-w-2xl mx-auto text-center py-10 animate-in zoom-in duration-500">
            <div className="space-y-3">
              <Badge className="gold-gradient text-white border-none px-3.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-widest animate-pulse">PLAY TO EARN</Badge>
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">ALIBANK ARENA V3</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kalahkan Nexus Musuh, Kumpulkan E-Gold, dan Menangkan Token ALX</p>
            </div>

            {/* HERO SELECTOR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {HEROES.map((hero) => (
                <Card 
                  key={hero.id} 
                  onClick={() => setSelectedHero(hero)}
                  className={`bg-slate-900 border-2 cursor-pointer transition-all hover:scale-[1.02] rounded-[2rem] p-6 text-left relative overflow-hidden ${selectedHero.id === hero.id ? 'border-primary shadow-xl shadow-primary/10' : 'border-white/5'}`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-black italic uppercase tracking-tight text-white">{hero.name}</h3>
                      <Badge className="border-none text-[8px] font-black h-5 uppercase px-2" style={{ backgroundColor: hero.color }}>
                        {hero.type}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{hero.description}</p>
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground"><span>Health</span><span className="text-white">{hero.hp} HP</span></div>
                      <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground"><span>Attack</span><span className="text-white">{hero.atk} DMG</span></div>
                      <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground"><span>Skill</span><span className="text-primary font-black italic">{hero.skillName}</span></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* START BUTTON */}
            <div className="pt-6">
              <Button 
                onClick={startGame} 
                className="w-full max-w-sm h-16 gold-gradient text-white rounded-2xl font-black italic uppercase text-sm shadow-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> MASUK ARENA PERTEMPURAN
              </Button>
            </div>

            {/* GAME INFO */}
            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 text-left max-w-md mx-auto space-y-3">
              <p className="text-[10px] font-black uppercase text-primary italic flex items-center gap-1.5"><Info className="w-4 h-4" /> Panduan Bermain:</p>
              <ul className="text-[9px] font-bold text-muted-foreground uppercase list-disc pl-5 space-y-1.5 leading-relaxed">
                <li>Gunakan <kbd className="bg-slate-800 p-1 px-1.5 rounded text-white font-mono">WASD</kbd> atau tombol <kbd className="bg-slate-800 p-1 px-1.5 rounded text-white font-mono">Arrow</kbd> untuk menggerakkan Hero Anda.</li>
                <li>Tekan tombol <kbd className="bg-slate-800 p-1 px-1.5 rounded text-white font-mono">Spasi</kbd> untuk meluncurkan tembakan otomatis ke sasaran terdekat.</li>
                <li>Gunakan tombol <kbd className="bg-slate-800 p-1 px-1.5 rounded text-white font-mono">Q</kbd> untuk mengeluarkan Jurus Spesial (cooldown 6 detik).</li>
                <li>Dapatkan E-Gold di dalam arena dan beli senjata upgrade di Shoppe.</li>
                <li>Hancurkan Nexus musuh (Base Merah) untuk mengklaim hadiah <span className="text-primary font-black">0.1 ALX</span> langsung ke dompet kustodian AliBank Anda.</li>
              </ul>
            </div>
          </div>
        ) : gameState === 'playing' ? (
          <div className="space-y-6 animate-in fade-in duration-700">
            {/* GAME HUD PANEL */}
            <div className="bg-slate-900/60 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5">
                  <Heart className="w-5 h-5 text-rose-500 fill-current" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Hero HP</p>
                  <p className="text-sm font-black italic uppercase text-white">{selectedHero.name}</p>
                </div>
              </div>

              {/* KDA Display */}
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Kills</p>
                  <p className="text-base font-black text-green-500">{kills}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Deaths</p>
                  <p className="text-base font-black text-rose-500">{deaths}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Jurus CD</p>
                  <p className="text-base font-black text-primary italic">
                    {cooldown > 0 ? `${cooldown}s` : 'READY'}
                  </p>
                </div>
              </div>
            </div>

            {/* CANVAS RENDERER */}
            <div className="rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900 shadow-2xl relative">
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={400} 
                className="w-full h-auto block"
              />
            </div>

            {/* SHOP & SKILLS ACTIONS CONTROLLER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SHOPPE PANEL */}
              <Card className="bg-slate-900 border-white/5 rounded-[2rem] p-6">
                <CardHeader className="p-0 pb-4 border-b border-white/5">
                  <CardTitle className="text-sm font-black italic uppercase text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" /> AliBank Arena Shoppe
                  </CardTitle>
                  <CardDescription className="text-[9px] font-bold uppercase">Beli Item menggunakan E-Gold game Anda</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pt-4 space-y-3">
                  {ITEMS.map((item) => {
                    const owned = activeItems.filter(id => id === item.id).length;
                    return (
                      <div key={item.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800 text-yellow-500"><item.icon className="w-4 h-4" /></div>
                          <div>
                            <p className="text-xs font-black uppercase italic text-white">{item.name} {owned > 0 && <span className="text-primary font-black font-mono">({owned}x)</span>}</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">{item.desc}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleBuyItem(item)}
                          disabled={gold < item.cost}
                          className="h-8 rounded-lg text-[9px] font-black uppercase gold-gradient text-white border-none px-4"
                        >
                          Beli ({item.cost} G)
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* JURUS & MANUAL CONTROLLER */}
              <Card className="bg-slate-900 border-white/5 rounded-[2rem] p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-sm font-black italic uppercase text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Jurus Spesial Hero
                  </h4>
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-black text-primary uppercase italic mb-1">{selectedHero.skillName}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">{selectedHero.skillDesc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <Button 
                    onClick={triggerAutoAttack} 
                    className="h-14 rounded-2xl bg-white/10 text-white font-black italic uppercase text-xs hover:bg-white/20"
                  >
                    Biasa (Spasi)
                  </Button>
                  <Button 
                    onClick={triggerSkill} 
                    disabled={cooldown > 0}
                    className="h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black italic uppercase text-xs shadow-lg shadow-primary/20"
                  >
                    {cooldown > 0 ? `CD (${cooldown}s)` : 'Jurus (Q)'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* GAME OVER STATE (WIN/LOSS) */
          <div className="max-w-md mx-auto text-center py-14 space-y-8 animate-in zoom-in duration-500">
            {gameState === 'win' ? (
              <div className="space-y-6">
                <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                  <Trophy className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-green-500">VICTORY</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base musuh hancur! Anda berhasil memenangkan pertempuran.</p>
                </div>

                <Card className="bg-slate-900 border-white/5 rounded-[2rem] p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5"><p className="text-[8px] font-bold text-muted-foreground uppercase">Kills</p><p className="text-base font-black text-green-500">{kills}</p></div>
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5"><p className="text-[8px] font-bold text-muted-foreground uppercase">Deaths</p><p className="text-base font-black text-rose-500">{deaths}</p></div>
                  </div>
                  
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="font-bold text-muted-foreground uppercase">Reward Kemenangan</span>
                    <span className="font-black text-primary italic">0.10 ALX Token</span>
                  </div>
                </Card>

                <div className="space-y-3">
                  <Button 
                    onClick={claimReward} 
                    disabled={isClaiming || hasClaimed}
                    className="w-full h-14 gold-gradient text-white rounded-2xl font-black italic uppercase text-xs shadow-xl flex items-center justify-center gap-2"
                  >
                    {isClaiming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {hasClaimed ? 'Hadiah Berhasil Diklaim' : 'Klaim Hadiah 0.1 ALX'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setGameState('lobby')} 
                    className="w-full h-14 rounded-2xl border-white/5 text-white font-black italic uppercase text-xs hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Main Lagi
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto shadow-2xl">
                  <Skull className="w-12 h-12 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-rose-500">DEFEAT</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base Anda hancur! Tingkatkan status Hero Anda lain kali.</p>
                </div>

                <Card className="bg-slate-900 border-white/5 rounded-[2rem] p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5"><p className="text-[8px] font-bold text-muted-foreground uppercase">Kills</p><p className="text-base font-black text-green-500">{kills}</p></div>
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5"><p className="text-[8px] font-bold text-muted-foreground uppercase">Deaths</p><p className="text-base font-black text-rose-500">{deaths}</p></div>
                  </div>
                </Card>

                <div className="space-y-3">
                  <Button 
                    onClick={() => setGameState('lobby')} 
                    className="w-full h-14 gold-gradient text-white rounded-2xl font-black italic uppercase text-xs shadow-xl"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Coba Lagi
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

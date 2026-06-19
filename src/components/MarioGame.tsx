import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../utils/audio';
import { Trophy, HelpCircle, ArrowLeft, RotateCcw, Heart, Coins } from 'lucide-react';

interface MarioGameProps {
  onFinish: (coins: number) => void;
  onBack: () => void;
  buyerName?: string;
}

export default function MarioGame({ onFinish, onBack, buyerName }: MarioGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game UI stats
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('Pencet tombol arah atau WASD untuk bergerak. Lompat ke bendera di ujung kanan!');

  // Refs for zero-dependency game loop
  const coinsRef = useRef(0);
  const scoreRef = useRef(0);
  const deathsRef = useRef(0);

  // Keys press log
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'a'].includes(k)) keys.current['left'] = true;
      if (['arrowright', 'd'].includes(k)) keys.current['right'] = true;
      if (['arrowup', 'w', ' '].includes(k)) keys.current['jump'] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'a'].includes(k)) keys.current['left'] = false;
      if (['arrowright', 'd'].includes(k)) keys.current['right'] = false;
      if (['arrowup', 'w', ' '].includes(k)) keys.current['jump'] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    // Primary game engine loop
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Virtual resolution
    const VIEW_WIDTH = 800;
    const VIEW_HEIGHT = 400;
    canvas.width = VIEW_WIDTH;
    canvas.height = VIEW_HEIGHT;

    // Level configuration
    const LEVEL_WIDTH = 2000;
    const GROUND_Y = 340;

    // Camera offset
    let cameraX = 0;

    // Player details
    const player = {
      x: 100,
      y: GROUND_Y - 40,
      vx: 0,
      vy: 0,
      width: 24,
      height: 32,
      isGrounded: false,
      color: '#ef4444', // Mario red
      onPole: false,
      poleSlideY: 100,
      enteringCastle: false,
      castleProgress: 0,
    };

    // Brick / Blocks
    // Type: 'brick' (solid), 'question' (unhit), 'empty-question' (already hit), 'stair' (solid)
    interface Block {
      x: number;
      y: number;
      w: number;
      h: number;
      type: 'brick' | 'question' | 'empty-question' | 'stair';
      hasCoin?: boolean;
      bounceY?: number;
    }

    const blocks: Block[] = [
      // Double brick & question block groupings
      { x: 230, y: 240, w: 32, h: 32, type: 'brick' },
      { x: 262, y: 240, w: 32, h: 32, type: 'question', hasCoin: true },
      { x: 294, y: 240, w: 32, h: 32, type: 'brick' },
      { x: 326, y: 240, w: 32, h: 32, type: 'question', hasCoin: true },
      { x: 358, y: 240, w: 32, h: 32, type: 'brick' },

      // High floating platforms
      { x: 450, y: 150, w: 32, h: 32, type: 'question', hasCoin: true },
      { x: 500, y: 154, w: 64, h: 32, type: 'brick' },

      // Tricky floating escape blocks above the gaps
      { x: 620, y: 250, w: 32, h: 32, type: 'brick' },
      { x: 652, y: 250, w: 32, h: 32, type: 'question', hasCoin: true },
      { x: 684, y: 220, w: 32, h: 32, type: 'question', hasCoin: true },

      // Extra platforms over the pits / spaces
      { x: 860, y: 180, w: 32, h: 32, type: 'brick' },
      { x: 892, y: 180, w: 32, h: 32, type: 'question', hasCoin: true },
      { x: 924, y: 180, w: 32, h: 32, type: 'brick' },

      // Staircase building up at X: 1050
      { x: 1020, y: GROUND_Y - 32, w: 32, h: 32, type: 'stair' },
      { x: 1052, y: GROUND_Y - 32, w: 32, h: 32, type: 'stair' },
      { x: 1052, y: GROUND_Y - 64, w: 32, h: 32, type: 'stair' },

      { x: 1084, y: GROUND_Y - 32, w: 32, h: 32, type: 'stair' },
      { x: 1084, y: GROUND_Y - 64, w: 32, h: 32, type: 'stair' },
      { x: 1084, y: GROUND_Y - 96, w: 32, h: 32, type: 'stair' },

      { x: 1116, y: GROUND_Y - 32, w: 32, h: 32, type: 'stair' },
      { x: 1116, y: GROUND_Y - 64, w: 32, h: 32, type: 'stair' },
      { x: 1116, y: GROUND_Y - 96, w: 32, h: 32, type: 'stair' },
      { x: 1116, y: GROUND_Y - 128, w: 32, h: 32, type: 'stair' },

      // Right after staircase bricks
      { x: 1220, y: GROUND_Y - 32, w: 32, h: 32, type: 'stair' },
      { x: 1252, y: GROUND_Y - 64, w: 32, h: 32, type: 'stair' },

      // Additional final blocks challenge
      { x: 1390, y: 220, w: 32, h: 32, type: 'brick' },
      { x: 1422, y: 220, w: 32, h: 32, type: 'question', hasCoin: true },
      { x: 1454, y: 220, w: 32, h: 32, type: 'brick' },
    ];

    // Pipes (Green classic pipes)
    interface Pipe {
      x: number;
      h: number;
      w: number;
    }
    const pipes: Pipe[] = [
      { x: 570, w: 48, h: 60 },
      { x: 800, w: 48, h: 80 },
      { x: 970, w: 48, h: 50 },
      { x: 1530, w: 48, h: 70 },
    ];

    // Coins scattered in air
    interface FloatingCoin {
      x: number;
      y: number;
      collected: boolean;
      animOffset: number;
    }
    const floatingCoins: FloatingCoin[] = [
      { x: 262, y: 160, collected: false, animOffset: 0 },
      { x: 294, y: 160, collected: false, animOffset: 1 },
      { x: 326, y: 160, collected: false, animOffset: 2 },
      { x: 580, y: 220, collected: false, animOffset: 3 },
      { x: 810, y: 200, collected: false, animOffset: 4 },
      { x: 1126, y: 150, collected: false, animOffset: 5 },
      { x: 1170, y: 230, collected: false, animOffset: 0 },
      { x: 1252, y: 180, collected: false, animOffset: 1 },
      { x: 636, y: 180, collected: false, animOffset: 2 },
      { x: 876, y: 120, collected: false, animOffset: 3 },
      { x: 1406, y: 150, collected: false, animOffset: 4 },
    ];

    // Pits (holes in ground requiring jumping over)
    const pits: { start: number; end: number }[] = [
      { start: 395, end: 445 },   // Challenging pit 1
      { start: 720, end: 790 },   // Classic pit 2
      { start: 900, end: 945 },   // Challenging pit 3
      { start: 1310, end: 1380 }, // Classic pit 4
      { start: 1470, end: 1520 }, // Final dangerous pit 5
    ];

    // Enemies (Mushrooms sliding left & right)
    interface Enemy {
      x: number;
      y: number;
      vx: number;
      w: number;
      h: number;
      dead: boolean;
      deadTimer: number;
    }
    const enemies: Enemy[] = [
      { x: 480, y: GROUND_Y - 24, vx: -1.2, w: 24, h: 24, dead: false, deadTimer: 0 },
      { x: 660, y: GROUND_Y - 24, vx: -1.1, w: 24, h: 24, dead: false, deadTimer: 0 },
      { x: 790, y: GROUND_Y - 24, vx: -1.3, w: 24, h: 24, dead: false, deadTimer: 0 },
      { x: 885, y: GROUND_Y - 24, vx: -1.4, w: 24, h: 24, dead: false, deadTimer: 0 },
      { x: 1010, y: GROUND_Y - 24, vx: -1.2, w: 24, h: 24, dead: false, deadTimer: 0 },
      { x: 1200, y: GROUND_Y - 24, vx: -1.3, w: 24, h: 24, dead: false, deadTimer: 0 },
      { x: 1290, y: GROUND_Y - 24, vx: -1.5, w: 24, h: 24, dead: false, deadTimer: 0 },
      { x: 1430, y: GROUND_Y - 24, vx: -1.4, w: 24, h: 24, dead: false, deadTimer: 0 },
      { x: 1590, y: GROUND_Y - 24, vx: -1.7, w: 24, h: 24, dead: false, deadTimer: 0 },
    ];

    // Visual particles (floating points / hit coin animations)
    interface Particle {
      x: number;
      y: number;
      vy: number;
      text: string;
      color: string;
      life: number;
    }
    let particles: Particle[] = [];

    // Flagpole and Castle placement
    const FLAG_X = 1650;
    const CASTLE_X = 1800;

    let isFinished = false;
    let localGameOver = false;

    // 1 Life limitation Game Over handler
    const triggerGameOver = (fellInPit: boolean) => {
      audio.playLose();
      localGameOver = true;
      isFinished = true;
      setGameOver(true);
      setMessage(fellInPit ? 'Game Over! Jatuh ke jurang jahanam!' : 'Game Over! Tereliminasi oleh jamur rintangan!');
    };

    // Main animation handle
    let animationId: number;

    const gameLoop = () => {
      // 1. INPUT HANDLING (if not cutscene)
      if (!player.onPole && !player.enteringCastle) {
        // Horizontal walk
        if (keys.current['left']) {
          player.vx -= 0.6;
          if (player.vx < -4.5) player.vx = -4.5;
        } else if (keys.current['right']) {
          player.vx += 0.6;
          if (player.vx > 4.5) player.vx = 4.5;
        } else {
          player.vx *= 0.82; // damping friction
        }

        // Jump trigger
        if (keys.current['jump'] && player.isGrounded) {
          player.vy = -10.5;
          player.isGrounded = false;
          audio.playJump();
        }
      }

      // 2. PHYSICS & INTEGRATION
      if (!player.onPole && !player.enteringCastle) {
        player.vy += 0.52; // gravity constant

        // Apply velocity
        player.x += player.vx;
        player.y += player.vy;

        // Level boundary constraints
        if (player.x < 10) player.x = 10;
        if (player.x > LEVEL_WIDTH - 10) player.x = LEVEL_WIDTH - 10;

        // Floor ground collision (unless player falls into an active pit)
        let isOnGroundSegment = true;
        for (const pit of pits) {
          if (player.x + player.width > pit.start && player.x < pit.end) {
            isOnGroundSegment = false;
            break;
          }
        }

        if (isOnGroundSegment) {
          if (player.y + player.height >= GROUND_Y) {
            player.y = GROUND_Y - player.height;
            player.vy = 0;
            player.isGrounded = true;
          }
        } else {
          // If falling below height threshold
          if (player.y > VIEW_HEIGHT + 50) {
            triggerGameOver(true);
          }
        }

        player.isGrounded = player.vy === 0;

        // Collision with pipes (Green pipes are solid obstacles)
        for (const pipe of pipes) {
          const pipeTop = GROUND_Y - pipe.h;
          // Check collision overlap
          if (
            player.x + player.width > pipe.x &&
            player.x < pipe.x + pipe.w &&
            player.y + player.height > pipeTop
          ) {
            // Determine vertical vs horizontal coll
            // Coming from side
            if (player.y + player.height - player.vy <= pipeTop + 4) {
              // Gounded on pipe top
              player.y = pipeTop - player.height;
              player.vy = 0;
              player.isGrounded = true;
            } else {
              // Push back horizontally based on moving direction
              if (player.vx > 0) {
                player.x = pipe.x - player.width;
              } else if (player.vx < 0) {
                player.x = pipe.x + pipe.w;
              }
              player.vx = 0;
            }
          }
        }

        // Collision with solids/bricks/blocks
        for (const blk of blocks) {
          // AABB Collision overlap detect
          if (
            player.x + player.width > blk.x &&
            player.x < blk.x + blk.w &&
            player.y + player.height > blk.y &&
            player.y < blk.y + blk.h
          ) {
            const overlapX = Math.min(player.x + player.width - blk.x, blk.x + blk.w - player.x);
            const overlapY = Math.min(player.y + player.height - blk.y, blk.y + blk.h - player.y);

            if (overlapY < overlapX) {
              if (player.vy > 0 && player.y + player.height - player.vy <= blk.y + 4) {
                // Landing on block top
                player.y = blk.y - player.height;
                player.vy = 0;
                player.isGrounded = true;
              } else if (player.vy < 0) {
                // Hitting block from bottom (Headbutt!)
                player.y = blk.y + blk.h;
                player.vy = 1; // bounce back down

                // Trigger headbutt mechanics for bricks/question marks!
                if (blk.type === 'question' && blk.hasCoin) {
                  blk.type = 'empty-question';
                  blk.hasCoin = false;
                  coinsRef.current += 1;
                  setCoins(coinsRef.current);
                  scoreRef.current += 200;
                  setScore(scoreRef.current);
                  audio.playCoin();

                  // bounce animation for brick
                  blk.bounceY = -10;

                  // Create golden coin float particle
                  particles.push({
                    x: blk.x + blk.w / 2,
                    y: blk.y - 10,
                    vy: -4,
                    text: '🪙 +1',
                    color: '#fbbf24',
                    life: 40,
                  });
                } else if (blk.type === 'brick') {
                  // brick smash/bounce
                  blk.bounceY = -6;
                  scoreRef.current += 50;
                  setScore(scoreRef.current);
                  particles.push({
                    x: blk.x + blk.w/2,
                    y: blk.y - 10,
                    vy: -2,
                    text: '100',
                    color: '#ffffff',
                    life: 30,
                  });
                }
              }
            } else {
              // Sideway bump
              if (player.vx > 0) player.x = blk.x - player.width;
              else if (player.vx < 0) player.x = blk.x + blk.w;
              player.vx = 0;
            }
          }
        }

        // Apply bounce animations damping
        for (const blk of blocks) {
          if (blk.bounceY && blk.bounceY < 0) {
            blk.bounceY += 1.5;
          } else {
            blk.bounceY = 0;
          }
        }

        // Collision with Gold Coins
        for (const coinObj of floatingCoins) {
          if (!coinObj.collected) {
            if (
              player.x + player.width > coinObj.x &&
              player.x < coinObj.x + 16 &&
              player.y + player.height > coinObj.y &&
              player.y < coinObj.y + 16
            ) {
              coinObj.collected = true;
              coinsRef.current += 1;
              setCoins(coinsRef.current);
              scoreRef.current += 100;
              setScore(scoreRef.current);
              audio.playCoin();

              particles.push({
                x: coinObj.x + 8,
                y: coinObj.y - 10,
                vy: -3,
                text: '🪙',
                color: '#f59e0b',
                life: 30,
              });
            }
          }
        }

        // Enemy sliding logic & Collision
        for (const en of enemies) {
          if (en.dead) {
            en.deadTimer--;
            continue;
          }

          // Move enemy left/right
          en.x += en.vx;

          // Push back from pipes/solids (boundary flips)
          if (en.x < 10 || en.x > LEVEL_WIDTH - 30) en.vx *= -1;
          for (const pipe of pipes) {
            if (en.x + en.w > pipe.x && en.x < pipe.x + pipe.w) {
              en.vx *= -1;
              en.x += en.vx; // step away
            }
          }

          // Collides with player?
          if (
            player.x + player.width > en.x &&
            player.x < en.x + en.w &&
            player.y + player.height > en.y &&
            player.y < en.y + en.h
          ) {
            // Check if stomp (falling on top of Goomba)
            if (player.vy > 0.5 && player.y + player.height - player.vy <= en.y + 10) {
              en.dead = true;
              en.deadTimer = 35; // fade frames
              player.vy = -6.5; // bounce Mario high
              audio.playCoin(); // squish noise
              scoreRef.current += 400;
              setScore(scoreRef.current);

              particles.push({
                x: en.x + en.w / 2,
                y: en.y - 10,
                vy: -2,
                text: '💥 SQUISH! +400',
                color: '#ef4444',
                life: 50,
              });
            } else {
              // Side collision = Mario takes damage/restarts
              triggerGameOver(false);
            }
          }
        }

        // Flagpole collision! Trigger level win
        if (player.x + player.width >= FLAG_X && !isFinished) {
          isFinished = true;
          player.onPole = true;
          player.vx = 0;
          player.x = FLAG_X - 10;
          player.poleSlideY = player.y;
          audio.playCastleTrumpet();
          setMessage('BINGGO! Kamu berhasil! Turun dari tiang dan masuk ke istana!');
        }
      }

      // 3. FLAGPOLE WIN CUTSCENE ANIMATION
      if (player.onPole) {
        player.vx = 0;
        if (player.poleSlideY + player.height < GROUND_Y) {
          player.poleSlideY += 2.5; // slide down pole
          player.y = player.poleSlideY;
        } else {
          // Finished sliding down pole! Now walk right into the castle
          player.y = GROUND_Y - player.height;
          player.onPole = false;
          player.enteringCastle = true;
          player.castleProgress = 0;
        }
      }

      // 4. WALKING TO CASTLE
      if (player.enteringCastle) {
        player.x += 1.8; // auto-walk rightward
        if (player.x >= CASTLE_X) {
          player.enteringCastle = false;
          // Completed game! Delay slightly and complete
          setGameWon(true);
          scoreRef.current += 1000 + (coinsRef.current * 100);
          setScore(scoreRef.current);
          audio.playWinFanfare();

          setTimeout(() => {
            onFinish(coinsRef.current);
          }, 3500);
        }
      }

      // 5. RENDER PHASE (CANVAS DRAWINGS)
      ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Camera logic (smooth center look ahead)
      const targetCamX = player.x - VIEW_WIDTH / 3;
      cameraX = cameraX * 0.9 + targetCamX * 0.1;
      // boundary cap
      if (cameraX < 0) cameraX = 0;
      if (cameraX > LEVEL_WIDTH - VIEW_WIDTH) cameraX = LEVEL_WIDTH - VIEW_WIDTH;

      ctx.save();
      ctx.translate(-cameraX, 0);

      // 5a. Draw sky backdrop (with nice warm retro gradient)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
      skyGrad.addColorStop(0, '#bae6fd'); // warm light blue sky
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(cameraX, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Decorative clouds & mountains
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      // Cloud 1
      ctx.beginPath();
      ctx.arc(300, 80, 20, 0, Math.PI * 2);
      ctx.arc(325, 70, 28, 0, Math.PI * 2);
      ctx.arc(355, 80, 22, 0, Math.PI * 2);
      ctx.fill();

      // Cloud 2
      ctx.beginPath();
      ctx.arc(850, 60, 18, 0, Math.PI * 2);
      ctx.arc(875, 52, 25, 0, Math.PI * 2);
      ctx.arc(905, 60, 20, 0, Math.PI * 2);
      ctx.fill();

      // Cloud 3
      ctx.beginPath();
      ctx.arc(1450, 90, 20, 0, Math.PI * 2);
      ctx.arc(1475, 80, 30, 0, Math.PI * 2);
      ctx.arc(1505, 90, 22, 0, Math.PI * 2);
      ctx.fill();

      // Mountains in backend
      ctx.fillStyle = '#a7f3d0'; // cute minty hills
      ctx.beginPath();
      ctx.moveTo(150, GROUND_Y);
      ctx.lineTo(250, 200);
      ctx.lineTo(350, GROUND_Y);
      ctx.fill();

      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.moveTo(700, GROUND_Y);
      ctx.lineTo(820, 220);
      ctx.lineTo(940, GROUND_Y);
      ctx.fill();

      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.moveTo(1250, GROUND_Y);
      ctx.lineTo(1380, 180);
      ctx.lineTo(1510, GROUND_Y);
      ctx.fill();

      // 5b. Draw pits / ground floor
      ctx.fillStyle = '#d97706'; // Ground soil color
      ctx.fillRect(0, GROUND_Y, LEVEL_WIDTH, VIEW_HEIGHT - GROUND_Y);

      // Draw green grass lining on ground segments
      ctx.fillStyle = '#22c55e'; // Green grass
      let lastX = 0;
      for (const pit of pits) {
        ctx.fillRect(lastX, GROUND_Y, pit.start - lastX, 10);
        lastX = pit.end;
      }
      ctx.fillRect(lastX, GROUND_Y, LEVEL_WIDTH - lastX, 10);

      // Draw dark holes inside the pits
      ctx.fillStyle = '#0f172a';
      for (const pit of pits) {
        ctx.fillRect(pit.start, GROUND_Y, pit.end - pit.start, VIEW_HEIGHT - GROUND_Y);
      }

      // 5c. Draw solid green Pipes
      for (const pipe of pipes) {
        const topY = GROUND_Y - pipe.h;
        // Pipe main branch
        ctx.fillStyle = '#16a34a';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 3;
        ctx.fillRect(pipe.x, topY, pipe.w, pipe.h);
        ctx.strokeRect(pipe.x, topY, pipe.w, pipe.h);

        // Pipe lip
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(pipe.x - 4, topY, pipe.w + 8, 16);
        ctx.strokeRect(pipe.x - 4, topY, pipe.w + 8, 16);

        // Pipe shine specular line
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(pipe.x + 6, topY + 4, 3, pipe.h - 4);
      }

      // 5d. Draw solid Blocks & questionnaire boxes
      for (const blk of blocks) {
        const drawY = blk.y + (blk.bounceY || 0);

        if (blk.type === 'brick') {
          // Brick block
          ctx.fillStyle = '#b45309';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.fillRect(blk.x, drawY, blk.w, blk.h);
          ctx.strokeRect(blk.x, drawY, blk.w, blk.h);

          // Diagonal lines for individual brick texture
          ctx.beginPath();
          ctx.moveTo(blk.x, drawY + 16);
          ctx.lineTo(blk.x + blk.w, drawY + 16);
          ctx.moveTo(blk.x + 16, drawY);
          ctx.lineTo(blk.x + 16, drawY + 16);
          ctx.moveTo(blk.x + 8, drawY + 16);
          ctx.lineTo(blk.x + 8, drawY + 32);
          ctx.moveTo(blk.x + 24, drawY + 16);
          ctx.lineTo(blk.x + 24, drawY + 32);
          ctx.stroke();
        } else if (blk.type === 'question') {
          // Yellow bouncing gold block!
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2.5;
          ctx.fillRect(blk.x, drawY, blk.w, blk.h);
          ctx.strokeRect(blk.x, drawY, blk.w, blk.h);

          // Draw the white '?' query symbol
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', blk.x + blk.w / 2, drawY + blk.h / 2 + 1);
        } else if (blk.type === 'empty-question') {
          // Hit grey block
          ctx.fillStyle = '#94a3b8';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.fillRect(blk.x, drawY, blk.w, blk.h);
          ctx.strokeRect(blk.x, drawY, blk.w, blk.h);

          // Draw a small dot or empty spot
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(blk.x + blk.w / 2, drawY + blk.h / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (blk.type === 'stair') {
          // solid grey block
          ctx.fillStyle = '#64748b';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.fillRect(blk.x, drawY, blk.w, blk.h);
          ctx.strokeRect(blk.x, drawY, blk.w, blk.h);
          // brick tile overlay lines
          ctx.strokeRect(blk.x + 4, drawY + 4, blk.w - 8, blk.h - 8);
        }
      }

      // 5e. Draw Gold Coins in air
      for (const coinObj of floatingCoins) {
        if (!coinObj.collected) {
          // Pulsing coin style
          const pulse = Math.sin((Date.now() / 150) + coinObj.animOffset) * 0.15 + 0.85;
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.ellipse(coinObj.x + 8, coinObj.y + 8, 5 * pulse, 8 * pulse, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // vertical shine card inside coin
          ctx.fillStyle = '#fffbeb';
          ctx.beginPath();
          ctx.ellipse(coinObj.x + 8, coinObj.y + 8, 1.5 * pulse, 4 * pulse, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5f. Draw Moving Enemies (Mushrooms/Goombas)
      for (const en of enemies) {
        if (en.dead) {
          if (en.deadTimer > 0) {
            // Draw flattened squished mushroom
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(en.x, GROUND_Y - 8, en.w, 8);
          }
          continue;
        }

        // Body stem
        ctx.fillStyle = '#ffedd5';
        ctx.fillRect(en.x + 4, en.y + 8, en.w - 8, en.h - 8);

        // Cap (Brown mushroom cap)
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.arc(en.x + en.w / 2, en.y + 10, en.w / 2, Math.PI, 0);
        ctx.fill();

        // Little white spots on the cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(en.x + 6, en.y + 6, 2, 0, Math.PI * 2);
        ctx.arc(en.x + en.w - 6, en.y + 6, 2, 0, Math.PI * 2);
        ctx.arc(en.x + en.w / 2, en.y + 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(en.x + en.w / 2 - 4, en.y + 11, 2, 4);
        ctx.fillRect(en.x + en.w / 2 + 2, en.y + 11, 2, 4);
      }

      // 5g. Draw FLAGPOLE
      ctx.fillStyle = '#94a3b8'; // grey metallic pole
      ctx.fillRect(FLAG_X, 80, 8, GROUND_Y - 80);
      // top gold ball
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(FLAG_X + 4, 76, 8, 0, Math.PI * 2);
      ctx.fill();

      // The Red Flag waving!
      const flagHeight = 24;
      const flagWidth = 40;
      const flagWave = Math.sin(Date.now() / 250) * 4;
      ctx.fillStyle = '#ef4444'; // flag red
      ctx.beginPath();
      ctx.moveTo(FLAG_X + 8, 90);
      ctx.lineTo(FLAG_X + 8 + flagWidth, 90 + flagWave);
      ctx.lineTo(FLAG_X + 8 + flagWidth, 90 + flagHeight + flagWave);
      ctx.lineTo(FLAG_X + 8, 90 + flagHeight);
      ctx.closePath();
      ctx.fill();

      // 5h. Draw CASTLE (The goal at x: 1800)
      ctx.fillStyle = '#475569'; // Grey castle bricks
      ctx.fillRect(CASTLE_X, GROUND_Y - 120, 140, 120);
      // central high tower
      ctx.fillRect(CASTLE_X + 35, GROUND_Y - 180, 70, 70);

      // battlements/crenelations (gerigi atas benteng)
      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(CASTLE_X + i * 30 + 5, GROUND_Y - 130, 15, 10);
      }
      ctx.fillRect(CASTLE_X + 35 + 5, GROUND_Y - 190, 15, 10);
      ctx.fillRect(CASTLE_X + 35 + 45, GROUND_Y - 190, 15, 10);

      // Castle center door entrance (black arch)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(CASTLE_X + 70, GROUND_Y, 24, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(CASTLE_X + 46, GROUND_Y - 10, 48, 10);

      // A waving gold flag on top of the castle
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(CASTLE_X + 70, GROUND_Y - 210, 3, 30);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(CASTLE_X + 73, GROUND_Y - 210, 16, 12);

      // 5i. Draw PLAYER CHARACTERS (MARIO RETRO STYLED)
      if (player.enteringCastle && player.x > CASTLE_X + 60) {
        // fade out player inside castle door
      } else {
        ctx.save();
        ctx.translate(player.x, player.y);

        // Simple pixelated/retro graphics for character
        // Cap/Top Hat
        ctx.fillStyle = '#ef4444'; // Red cap
        ctx.fillRect(2, 0, player.width - 4, 6);
        ctx.fillRect(0, 4, player.width, 4); // cap visor

        // Face & Skin
        ctx.fillStyle = '#fed7aa'; // Peach flesh tone
        ctx.fillRect(4, 8, player.width - 8, 10);

        // Mustache & Hair
        ctx.fillStyle = '#7c2d12'; // Brown hair
        ctx.fillRect(0, 8, 4, 8); // sideburns
        ctx.fillRect(player.width - 12, 12, 10, 4); // mustache

        // Eye
        ctx.fillStyle = '#000000';
        ctx.fillRect(player.width - 10, 9, 3, 3);

        // Body / Shirt
        ctx.fillStyle = '#ef4444'; // Red shirt
        ctx.fillRect(4, 18, player.width - 8, 8);

        // Overalls
        ctx.fillStyle = '#1d4ed8'; // Blue pants/overalls
        ctx.fillRect(4, 22, player.width - 8, 10);
        ctx.fillRect(2, 24, 4, 6); // blue details
        ctx.fillRect(player.width - 6, 24, 4, 6);

        // Shoes
        ctx.fillStyle = '#451a03'; // Brown shoes
        ctx.fillRect(2, 30, 8, 4);
        ctx.fillRect(player.width - 10, 30, 8, 4);

        // Draw white gloves hands if running/climbing
        ctx.fillStyle = '#ffffff';
        if (player.onPole) {
          // reaching out hands climbing style
          ctx.fillRect(-4, 12, 5, 5);
          ctx.fillRect(player.width - 1, 15, 5, 5);
        }

        ctx.restore();
      }

      // 5j. Draw active text particles
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(p.text, p.x, p.y);
        p.y += p.vy;
        p.life--;
      }

      ctx.restore(); // camera reset

      // REQUEST NEXT FRAME
      if (canvasRef.current) {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    // Begin looping
    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [onFinish]);

  // Handle direct touch controls for tablet/mobile
  const handleTouchStart = (act: 'left' | 'right' | 'jump') => {
    keys.current[act] = true;
    if (act === 'jump') {
      audio.playJump();
    }
  };

  const handleTouchEnd = (act: 'left' | 'right' | 'jump') => {
    keys.current[act] = false;
  };

  return (
    <div className="w-full flex flex-col items-center select-none" id="mario-game-wrapper">
      {/* Game Header stats */}
      <div className="w-full max-w-4xl bg-stone-900 border-x-4 border-t-4 border-stone-800 rounded-t-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white font-mono shadow-2xl relative overflow-hidden" id="arcade-header">
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
        
        {/* Buyer identity */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>
          <span className="text-stone-300 text-xs">Pemain:</span>
          <span className="text-yellow-400 font-bold tracking-wide text-sm">
            {buyerName || 'Pelanggan Toko'}
          </span>
        </div>

        {/* Dynamic score dashboard */}
        <div className="flex items-center gap-6 text-sm flex-1 justify-end">
          <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded border border-stone-700">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-stone-300">KOIN:</span>
            <span className="text-yellow-400 font-bold">{coins}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded border border-stone-700">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-stone-300">SKOR:</span>
            <span className="text-yellow-500 font-bold">{score}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded border border-stone-700">
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span className="text-stone-300">NYAWA:</span>
            <span className="text-red-500 font-bold">{gameOver ? '0 / 1' : '1 / 1'}</span>
          </div>
        </div>
      </div>

      {/* Main retro CRT game screen */}
      <div className="w-full max-w-4xl bg-stone-950 border-4 border-stone-800 p-2 flex flex-col relative" id="crt-frame" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="w-full h-auto aspect-[2/1] rounded bg-sky-200 border-2 border-stone-900 shadow-inner block"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Complete screen modal */}
        {gameWon && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-6 animate-fade-in z-20" id="victory-modal">
            <div className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold text-3xl tracking-widest shadow-lg animate-bounce uppercase font-serif mb-4 flex items-center gap-3">
              🎉 STAGE CLEAN! 🎉
            </div>
            <p className="text-white text-base max-w-md font-mono mt-2 mb-6">
              Luar biasa! Kamu berhasil melewati rintangan istana dan mendapatkan kesempatan Gacha Roda Putar!
            </p>
            <div className="flex items-center gap-3 bg-stone-900 border border-yellow-500/50 px-5 py-2.5 rounded-lg text-emerald-400 font-mono text-sm shadow-inner">
              <Coins className="w-5 h-5 text-yellow-400" /> Total Koin: {coins} • Skor Akhir: {score}
            </div>
            <p className="text-stone-400 text-xs mt-6 animate-pulse">
              Memuat Roda Putar Keberuntungan...
            </p>
          </div>
        )}

        {/* Failure Screen Modal - 1 Life Policy */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 animate-fade-in z-20" id="gameover-modal">
            <div className="bg-red-700 border-4 border-red-800 text-white px-8 py-3.5 rounded-2xl font-black text-3xl tracking-widest shadow-2xl animate-pulse uppercase font-serif mb-4 flex items-center gap-3">
              ☠️ GAME OVER ☠️
            </div>
            <p className="text-stone-100 text-lg font-black font-mono max-w-md mt-2 mb-3 tracking-wide">
              Maaf ya, anda kurang beruntung
            </p>
            <p className="text-stone-400 text-xs max-w-sm font-mono mb-8 leading-relaxed">
              Kamu gagal menyelesaikan rintangan Mario Bros. Kesempatan spin roda hadiah hangus! Silakan coba lagi.
            </p>
            <div className="flex flex-col gap-3 min-w-[245px]">
              <button
                onClick={onBack}
                className="bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-xl font-bold font-mono text-xs tracking-widest transition-all shadow-[0_4px_0_#991b1b] active:translate-y-0.5 active:shadow-none uppercase cursor-pointer"
              >
                Kembali ke Beranda ✓
              </button>
            </div>
          </div>
        )}

        {/* Dynamic instructional prompts banner */}
        <div className="mt-2 bg-stone-900 text-stone-300 text-xs py-2 px-4 rounded border border-stone-800 text-center font-mono" id="game-status-prompt">
          💡 <span className="text-yellow-400">{message}</span>
        </div>
      </div>

      {/* Retro Arcade Controller / Touch Pads */}
      <div className="w-full max-w-4xl bg-stone-900 border-x-4 border-b-4 border-stone-800 rounded-b-2xl p-6 flex items-center justify-between gap-6" id="touch-controls">
        <button
          onClick={onBack}
          className="bg-stone-800 text-stone-400 hover:text-white px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 border border-stone-700 transition"
          id="btn-quit-game"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar
        </button>

        {/* Simulated Mobile Controls overlay */}
        <div className="flex items-center gap-4 py-1" id="arrow-pad">
          {/* Movement buttons keys */}
          <div className="flex gap-2.5">
            <button
              onMouseDown={() => handleTouchStart('left')}
              onMouseUp={() => handleTouchEnd('left')}
              onMouseLeave={() => handleTouchEnd('left')}
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
              className="w-14 h-14 rounded-xl bg-stone-800 active:bg-orange-500 hover:bg-stone-700 text-white font-mono font-bold text-lg border-b-4 border-stone-950 active:border-b-0 active:translate-y-1 transition shadow-lg flex items-center justify-center select-none"
              title="Kiri (A)"
              id="pad-left"
            >
              ◀
            </button>
            <button
              onMouseDown={() => handleTouchStart('right')}
              onMouseUp={() => handleTouchEnd('right')}
              onMouseLeave={() => handleTouchEnd('right')}
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
              className="w-14 h-14 rounded-xl bg-stone-800 active:bg-orange-500 hover:bg-stone-700 text-white font-mono font-bold text-lg border-b-4 border-stone-950 active:border-b-0 active:translate-y-1 transition shadow-lg flex items-center justify-center select-none"
              title="Kanan (D)"
              id="pad-right"
            >
              ▶
            </button>
          </div>

          <div className="w-px h-10 bg-stone-700 mx-2"></div>

          {/* Jump action button */}
          <button
            onMouseDown={() => handleTouchStart('jump')}
            onMouseUp={() => handleTouchEnd('jump')}
            onMouseLeave={() => handleTouchEnd('jump')}
            onTouchStart={() => handleTouchStart('jump')}
            onTouchEnd={() => handleTouchEnd('jump')}
            className="px-8 h-14 rounded-xl bg-red-600 active:bg-red-400 text-white font-mono font-black text-sm tracking-widest border-b-4 border-red-950 active:border-b-0 active:translate-y-1 transition shadow-lg flex items-center justify-center select-none gap-2"
            title="Lompat (UP / Space)"
            id="pad-jump"
          >
            <span>LOMPAT</span>
            <span className="text-[10px] opacity-60 bg-black/20 px-1.5 py-0.5 rounded">SPACE</span>
          </button>
        </div>

        {/* Keyboard instructions badge */}
        <div className="hidden md:flex flex-col items-end text-right font-mono text-stone-500 text-[10px]" id="keyboard-legend">
          <div>🔑 KEYBOARD CONTROLS:</div>
          <div>WASD / ARROW KEYS = GERAK</div>
          <div>SPACE BAR / UP = LOMPAT</div>
        </div>
      </div>
    </div>
  );
}

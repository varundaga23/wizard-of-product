/* eslint-disable no-undef */
import 'phaser';
import GameState from '../GameState';
import { TOWERS, LENNY_FINAL_BOSS, ARCHETYPE_INFO } from '../data/professors';

export default class TowerMapScene extends Phaser.Scene {
  constructor() {
    super('TowerMap');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0221);

    // Stars
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.RND.between(0, width);
      const y = Phaser.Math.RND.between(60, height);
      this.add.circle(x, y, Phaser.Math.RND.between(1, 2), 0xffffff,
        Phaser.Math.RND.between(10, 60) / 100);
    }

    this.drawHeader(width);
    this.drawTowers(width);

    // Check for Lenny final boss
    if (GameState.allTowersDone()) {
      this.drawLennyBossEntry(width, height);
    }
  }

  drawHeader(width) {
    // Title bar bg
    this.add.rectangle(width / 2, 28, width, 56, 0x0a0118);
    this.add.rectangle(width / 2, 56, width, 1, 0xffd700, 0.4);

    this.add.text(20, 28, `${GameState.playerName}`, {
      fontSize: '15px',
      fontFamily: 'Courier New, monospace',
      fill: '#ffd700',
    }).setOrigin(0, 0.5);

    // Hearts
    const hearts = '♥'.repeat(GameState.sessionHearts) + '♡'.repeat(5 - GameState.sessionHearts);
    this.add.text(width / 2, 28, hearts, {
      fontSize: '18px',
      fill: '#ff4466',
    }).setOrigin(0.5);

    // Score
    this.add.text(width - 20, 28, `${GameState.sessionScore.toLocaleString()} SP`, {
      fontSize: '15px',
      fontFamily: 'Courier New, monospace',
      fill: '#ffd700',
    }).setOrigin(1, 0.5);

    // Rank + archetype
    const info = ARCHETYPE_INFO[GameState.archetype] || {};
    const rankText = `${info.sigil || ''} ${GameState.getRank()} · ${info.name || ''}`;
    this.add.text(width / 2, 78, rankText, {
      fontSize: '13px',
      fontFamily: 'Georgia, serif',
      fill: info.color || '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(width / 2, 97, 'Academy of Lorethorn', {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      fill: '#444466',
    }).setOrigin(0.5);
  }

  drawTowers(width) {
    const towerKeys = ['pm', 'strategy', 'ai'];
    const towerW = 240;
    const towerX = [130, 400, 670];

    towerKeys.forEach((key, i) => {
      this.drawTower(TOWERS[key], towerX[i], key);
    });
  }

  drawTower(tower, cx, key) {
    const startY = 120;
    const isPrimary = GameState.primaryTower === key;
    const borderColor = isPrimary ? tower.color : 0x333355;

    // Tower header
    this.add.rectangle(cx, startY + 16, 220, 34, 0x1a0a2e)
      .setStrokeStyle(isPrimary ? 2 : 1, borderColor);

    this.add.text(cx, startY + 16, tower.name, {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      fill: tower.hex,
    }).setOrigin(0.5);

    if (isPrimary) {
      this.add.text(cx + 80, startY + 16, '★', {
        fontSize: '10px',
        fill: '#ffd700',
      }).setOrigin(0.5);
    }

    // Professor rows
    tower.professors.forEach((prof, i) => {
      this.drawProfessorRow(prof, cx, startY + 50 + i * 62, tower, key);
    });
  }

  drawProfessorRow(prof, cx, y, tower, towerKey) {
    const defeated = GameState.defeatedProfessors.includes(prof.key);
    const next = this.getNextProfessor(towerKey);
    const isNext = next && next.key === prof.key;
    const isLocked = !defeated && (!isNext);

    const bgColor = defeated ? 0x0a2a0a
      : isNext ? 0x1a0a2e
        : 0x060612;

    const borderColor = defeated ? 0x226622
      : isNext ? tower.color
        : 0x222233;

    const borderWidth = isNext ? 2 : 1;
    const alpha = isLocked ? 0.45 : 1;

    const rowBg = this.add.rectangle(cx, y, 218, 56, bgColor, alpha)
      .setStrokeStyle(borderWidth, borderColor, alpha);

    if (!defeated && isNext) {
      rowBg.setInteractive({ useHandCursor: true });
      rowBg.on('pointerover', () => {
        rowBg.setFillStyle(0x2d1b69);
        rowBg.setStrokeStyle(2, 0xffffff);
      });
      rowBg.on('pointerout', () => {
        rowBg.setFillStyle(bgColor);
        rowBg.setStrokeStyle(borderWidth, borderColor);
      });
      rowBg.on('pointerdown', () => {
        GameState.currentProfessor = { ...prof, domain: towerKey, tower };
        this.scene.start('Duel', { professor: { ...prof, domain: towerKey, tower } });
      });
    }

    // Status icon
    const icon = defeated ? '✓' : isNext ? '▶' : '•';
    const iconColor = defeated ? '#44cc44' : isNext ? tower.hex : '#333355';
    this.add.text(cx - 95, y, icon, {
      fontSize: '13px',
      fontFamily: 'Courier New, monospace',
      fill: iconColor,
      alpha,
    }).setOrigin(0, 0.5);

    // Professor name
    const nameColor = defeated ? '#448844'
      : isNext ? '#ffffff'
        : '#444466';
    this.add.text(cx - 80, y - 9, prof.name, {
      fontSize: '13px',
      fontFamily: 'Georgia, serif',
      fill: nameColor,
      alpha,
    }).setOrigin(0, 0.5);

    // Title
    this.add.text(cx - 80, y + 9, prof.title, {
      fontSize: '10px',
      fontFamily: 'Courier New, monospace',
      fill: isNext ? tower.hex : '#444466',
      alpha,
    }).setOrigin(0, 0.5);

    // Boss badge
    if (prof.isBoss) {
      this.add.text(cx + 88, y - 9, '★', {
        fontSize: '11px',
        fill: tower.hex,
        alpha,
      }).setOrigin(1, 0.5);
    }
  }

  getNextProfessor(towerKey) {
    const profs = TOWERS[towerKey].professors;
    for (const p of profs) {
      if (!GameState.defeatedProfessors.includes(p.key)) return p;
    }
    return null; // tower complete
  }

  drawLennyBossEntry(width, height) {
    const y = height - 58;

    const glow = this.add.rectangle(width / 2, y, width - 40, 72, 0x1a0a00)
      .setStrokeStyle(2, 0xffd700);

    this.add.text(width / 2, y - 14, '✦  LENNY RACHITSKY AWAITS  ✦', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      fill: '#ffd700',
    }).setOrigin(0.5);

    this.add.text(width / 2, y + 10, 'The Keeper of Product Lore — Final Duel', {
      fontSize: '12px',
      fontFamily: 'Courier New, monospace',
      fill: '#aaaaaa',
    }).setOrigin(0.5);

    glow.setInteractive({ useHandCursor: true });
    glow.on('pointerover', () => { glow.setFillStyle(0x2d1b00); });
    glow.on('pointerout', () => { glow.setFillStyle(0x1a0a00); });
    glow.on('pointerdown', () => {
      GameState.currentProfessor = { ...LENNY_FINAL_BOSS };
      this.scene.start('Duel', { professor: { ...LENNY_FINAL_BOSS } });
    });

    // Pulsing glow tween
    this.tweens.add({
      targets: glow,
      alpha: { from: 1, to: 0.6 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }
}

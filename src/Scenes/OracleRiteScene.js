/* eslint-disable no-undef */
import 'phaser';
import GameState from '../GameState';
import { ORACLE_QUESTIONS, ARCHETYPE_INFO } from '../data/professors';

const CX = 480;
const W  = 960;
const H  = 524;

export default class OracleRiteScene extends Phaser.Scene {
  constructor() {
    super('OracleRite');
  }

  create() {
    // Background image — same asset as title screen, persists throughout
    this.add.image(CX, H / 2, 'title-bg').setDisplaySize(W, H);

    const summonsSeen = localStorage.getItem('wop_summons_seen');
    if (!summonsSeen) {
      this.showSummonsLetter();
    } else {
      this.showQuestion();
    }
  }

  // ── Lenny's Summons Letter (first launch only) ────────────────────────────
  showSummonsLetter() {
    const grp = [];
    this.summonsGroup = grp;

    // Dark overlay
    grp.push(this.add.rectangle(CX, H / 2, W, H, 0x000000, 0.72));

    // Parchment panel
    const pg = this.add.graphics();
    pg.fillStyle(0x2a1a08, 0.97);
    pg.fillRoundedRect(CX - 295, 38, 590, 444, 12);
    pg.lineStyle(2, 0xc8a030, 0.9);
    pg.strokeRoundedRect(CX - 295, 38, 590, 444, 12);
    pg.lineStyle(1, 0xc8a030, 0.3);
    pg.strokeRoundedRect(CX - 285, 48, 570, 424, 8);
    grp.push(pg);

    // Seal
    grp.push(this.add.text(CX, 86, '⚜', {
      fontSize: '30px', fill: '#c8a030',
    }).setOrigin(0.5));

    // Title
    grp.push(this.add.text(CX, 130, 'A SUMMONS FROM THE KEEPER', {
      fontSize: '13px',
      fontFamily: 'Courier New, monospace',
      fill: '#c8a030',
      letterSpacing: 2,
    }).setOrigin(0.5));

    // Divider
    const dg = this.add.graphics();
    dg.lineStyle(1, 0xc8a030, 0.35);
    dg.lineBetween(CX - 210, 148, CX + 210, 148);
    grp.push(dg);

    // Letter body
    const body = [
      `Greetings, ${GameState.playerName}.`,
      '',
      'I am Lenny Rachitsky — Keeper of Product Lore',
      'and host of the most-read PM newsletter in the known world.',
      '',
      'The wizards of product have spoken.',
      "You've been chosen to face the Three Towers:",
      'PM, Strategy, and AI.',
      '',
      'But first — the Oracle must know your path.',
      '',
      'Answer the Codex honestly.',
      'There is no wrong answer. Only the truth',
      'of how your mind works.',
      '',
      'Your trial begins now.',
    ].join('\n');

    grp.push(this.add.text(CX, 300, body, {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      fill: '#d4b896',
      align: 'center',
      lineSpacing: 3,
    }).setOrigin(0.5));

    // Signature
    grp.push(this.add.text(CX, 420, '— Lenny', {
      fontSize: '13px',
      fontFamily: 'Georgia, serif',
      fill: '#c8a030',
      fontStyle: 'italic',
    }).setOrigin(0.5));

    // Accept button
    const btnBg = this.add.rectangle(CX, 460, 230, 34, 0x1a0e04)
      .setStrokeStyle(1.5, 0xc8a030)
      .setInteractive({ useHandCursor: true });
    const btnT = this.add.text(CX, 460, 'ACCEPT THE SUMMONS', {
      fontSize: '12px',
      fontFamily: 'Courier New, monospace',
      fill: '#c8a030',
    }).setOrigin(0.5);
    grp.push(btnBg, btnT);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x3a2010));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x1a0e04));
    btnBg.on('pointerdown', () => {
      localStorage.setItem('wop_summons_seen', '1');
      grp.forEach(obj => obj.destroy());
      this.summonsGroup = [];
      this.showQuestion();
    });

    // Fade everything in
    grp.forEach(obj => obj.setAlpha(0));
    this.tweens.add({ targets: grp, alpha: 1, duration: 700, ease: 'Power2' });
  }

  // ── Single sorting question ───────────────────────────────────────────────
  showQuestion() {
    const grp = [];
    this.qGroup = grp;

    // Dark overlay (keeps bg readable)
    grp.push(this.add.rectangle(CX, H / 2, W, H, 0x000000, 0.62));

    // Codex tome illustration
    const tg = this.add.graphics();
    tg.fillStyle(0x2d1b69, 1);
    tg.fillRoundedRect(CX - 42, 16, 84, 58, 6);
    tg.lineStyle(2, 0xffd700, 0.85);
    tg.strokeRoundedRect(CX - 42, 16, 84, 58, 6);
    tg.lineStyle(1, 0xffd700, 0.35);
    tg.lineBetween(CX, 18, CX, 72);
    grp.push(tg);

    grp.push(this.add.text(CX, 45, '✦', {
      fontSize: '20px', fill: '#ffd700',
    }).setOrigin(0.5));

    // Header
    grp.push(this.add.text(CX, 95, "The Oracle's Rite", {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      fill: '#ffd700',
      stroke: '#8B6914',
      strokeThickness: 2,
    }).setOrigin(0.5));

    grp.push(this.add.text(CX, 120, `Welcome, ${GameState.playerName}. Answer truly. There is no wrong path.`, {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      fill: '#888888',
    }).setOrigin(0.5));

    // Random question
    const q = Phaser.Math.RND.pick(ORACLE_QUESTIONS);

    // Scenario badge
    grp.push(this.add.text(CX, 148, q.scenario.toUpperCase(), {
      fontSize: '10px',
      fontFamily: 'Courier New, monospace',
      fill: '#ffd700',
      backgroundColor: '#1a0a2e',
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5));

    // Question text
    grp.push(this.add.text(CX, 206, q.text, {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 760 },
    }).setOrigin(0.5));

    // Shuffled options
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    const labels = ['A', 'B', 'C'];
    const optStartY = 278;
    const btnH = 54;
    const gap = 10;

    opts.forEach((opt, i) => {
      const y = optStartY + i * (btnH + gap);
      this.drawOption(opt, labels[i], y, grp);
    });
  }

  drawOption(opt, label, y, grp) {
    const btnBg = this.add.rectangle(CX, y, 720, 50, 0x12082a)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });

    const labelT = this.add.text(CX - 336, y, label, {
      fontSize: '15px',
      fontFamily: 'Courier New, monospace',
      fill: '#ffd700',
    }).setOrigin(0.5);

    const optT = this.add.text(CX - 310, y, opt.text, {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      fill: '#cccccc',
      wordWrap: { width: 600 },
    }).setOrigin(0, 0.5);

    grp.push(btnBg, labelT, optT);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x2d1b69).setStrokeStyle(1, 0xffd700);
      optT.setStyle({ fill: '#ffffff' });
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x12082a).setStrokeStyle(1, 0x444466);
      optT.setStyle({ fill: '#cccccc' });
    });
    btnBg.on('pointerdown', () => this.onAnswer(opt.archetype));
  }

  // ── Answer selected: dramatic pause then reveal ───────────────────────────
  onAnswer(archetype) {
    // Disable all option buttons
    if (this.qGroup) {
      this.qGroup.forEach(obj => { if (obj.disableInteractive) obj.disableInteractive(); });
    }

    // "Oracle deliberates" text fades in, then camera fades to black (2.5s total)
    const consulting = this.add.text(CX, H - 28, 'The Oracle deliberates…', {
      fontSize: '13px',
      fontFamily: 'Georgia, serif',
      fill: '#ffd700',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: consulting, alpha: 1, duration: 500, ease: 'Power2' });

    this.cameras.main.fadeOut(2200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      consulting.destroy();
      if (this.qGroup) {
        this.qGroup.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
        this.qGroup = [];
      }
      GameState.archetype = archetype;
      GameState.primaryTower = ARCHETYPE_INFO[archetype].tower;
      GameState.oracleDone = true;
      this.showReveal(archetype);
      this.cameras.main.fadeIn(900, 0, 0, 20); // fade into deep purple
    });
  }

  // ── Full-screen archetype reveal ─────────────────────────────────────────
  showReveal(archetype) {
    const info = ARCHETYPE_INFO[archetype];

    // Deep purple background
    this.add.rectangle(CX, H / 2, W, H, 0x080018);

    // Stars
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.RND.between(0, W);
      const y = Phaser.Math.RND.between(0, H);
      const r = Phaser.Math.RND.between(1, 2);
      const a = Phaser.Math.RND.between(8, 55) / 100;
      this.add.circle(x, y, r, 0xffffff, a);
    }

    // Sigil — large, pulses after appearing
    const sigil = this.add.text(CX, 128, info.sigil, {
      fontSize: '68px',
      fill: info.color,
    }).setOrigin(0.5).setAlpha(0);

    // Archetype name
    const nameT = this.add.text(CX, 215, `The ${info.name}`, {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      fill: info.color,
    }).setOrigin(0.5).setAlpha(0);

    // Tagline
    const tagT = this.add.text(CX, 258, `"${info.tagline}"`, {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      fill: '#ffffff',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    // Description
    const descT = this.add.text(CX, 322, info.description, {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      fill: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 620 },
    }).setOrigin(0.5).setAlpha(0);

    // Tower badge
    const towerT = this.add.text(CX, 388, `Primary Tower: ${info.towerName}`, {
      fontSize: '12px',
      fontFamily: 'Courier New, monospace',
      fill: info.color,
      backgroundColor: '#100025',
      padding: { x: 12, y: 5 },
    }).setOrigin(0.5).setAlpha(0);

    // Begin button
    const btnBg = this.add.rectangle(CX, 452, 240, 38, 0x080018)
      .setStrokeStyle(2, info.hex)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);
    const btnT = this.add.text(CX, 452, 'BEGIN YOUR JOURNEY', {
      fontSize: '13px',
      fontFamily: 'Courier New, monospace',
      fill: info.color,
    }).setOrigin(0.5).setAlpha(0);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x2d1b69));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x080018));
    btnBg.on('pointerdown', () => this.scene.start('TowerMap'));

    // Staggered fade-in
    this.tweens.add({ targets: sigil,              alpha: 1, duration: 900, delay: 0,    ease: 'Power2' });
    this.tweens.add({ targets: [nameT, tagT],      alpha: 1, duration: 700, delay: 700,  ease: 'Power2' });
    this.tweens.add({ targets: [descT, towerT],    alpha: 1, duration: 600, delay: 1300, ease: 'Power2' });
    this.tweens.add({ targets: [btnBg, btnT],      alpha: 1, duration: 600, delay: 1900, ease: 'Power2' });

    // Sigil pulse after it appears
    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: sigil,
        scaleX: 1.08, scaleY: 1.08,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }
}

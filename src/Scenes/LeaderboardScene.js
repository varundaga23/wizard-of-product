/* eslint-disable no-undef */
import 'phaser';
import GameState from '../GameState';
import { submitScore, getLeaderboard } from '../supabase';

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('Leaderboard');
  }

  init() {
    this.submitted = false;
    this.entries = [];
  }

  create() {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0221);

    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.RND.between(0, width);
      const y = Phaser.Math.RND.between(0, height);
      this.add.circle(x, y, Phaser.Math.RND.between(1, 2), 0xffffff,
        Phaser.Math.RND.between(10, 50) / 100);
    }

    // Header bar
    this.add.rectangle(width / 2, 28, width, 56, 0x0a0118);
    this.add.rectangle(width / 2, 56, width, 1, 0xffd700, 0.4);

    this.add.text(width / 2, 28, '✦  HALL OF SAGES  ✦', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      fill: '#ffd700',
    }).setOrigin(0.5);

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2, 'Consulting the archives...', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      fill: '#888888',
    }).setOrigin(0.5);

    this.loadAndRender();
  }

  async loadAndRender() {
    const { width } = this.cameras.main;

    // Submit score first (if not already done)
    if (GameState.sessionScore > 0 && !this.submitted) {
      this.submitted = true;
      await submitScore(
        GameState.playerName,
        GameState.archetype || 'V',
        GameState.sessionScore,
        GameState.domainBreakdown,
      );
    }

    const entries = await getLeaderboard();
    this.loadingText.destroy();

    this.renderTable(entries);
    this.renderPlayerResult(width);
    this.renderButtons(width);
  }

  renderTable(entries) {
    const { width } = this.cameras.main;

    // Table header
    this.add.text(160, 80, '#', {
      fontSize: '11px',
      fontFamily: 'Courier New, monospace',
      fill: '#555577',
    }).setOrigin(0.5, 0);
    this.add.text(280, 80, 'SAGE', {
      fontSize: '11px',
      fontFamily: 'Courier New, monospace',
      fill: '#555577',
    }).setOrigin(0, 0);
    this.add.text(560, 80, 'ARCHETYPE', {
      fontSize: '11px',
      fontFamily: 'Courier New, monospace',
      fill: '#555577',
    }).setOrigin(0, 0);
    this.add.text(width - 40, 80, 'SCORE', {
      fontSize: '11px',
      fontFamily: 'Courier New, monospace',
      fill: '#555577',
    }).setOrigin(1, 0);

    const g = this.add.graphics();
    g.lineStyle(1, 0xffd700, 0.2);
    g.lineBetween(140, 98, width - 40, 98);

    const archetypeNames = { V: 'Visionary', M: 'Mastermind', B: 'Builder' };

    entries.forEach((entry, i) => {
      const y = 116 + i * 38;
      const isPlayer = entry.player_name === GameState.playerName
        && entry.score === GameState.sessionScore;

      const rowColor = isPlayer ? 0x1a0a2e : (i % 2 === 0 ? 0x080414 : 0x0a0620);
      const rowBg = this.add.rectangle(width / 2, y + 10, width - 80, 34, rowColor);
      if (isPlayer) rowBg.setStrokeStyle(1, 0xffd700, 0.5);

      const rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#555577';
      const medalPrefix = i === 0 ? '★ ' : i === 1 ? '✦ ' : i === 2 ? '◆ ' : '';

      this.add.text(160, y + 10, `${medalPrefix}${i + 1}`, {
        fontSize: '13px',
        fontFamily: 'Courier New, monospace',
        fill: rankColor,
      }).setOrigin(0.5);

      this.add.text(200, y + 10, entry.player_name || 'Unknown', {
        fontSize: '13px',
        fontFamily: 'Georgia, serif',
        fill: isPlayer ? '#ffd700' : '#dddddd',
      }).setOrigin(0, 0.5);

      const arch = archetypeNames[entry.character] || entry.character || '—';
      this.add.text(560, y + 10, arch, {
        fontSize: '11px',
        fontFamily: 'Courier New, monospace',
        fill: '#666688',
      }).setOrigin(0, 0.5);

      this.add.text(width - 40, y + 10, `${(entry.score || 0).toLocaleString()}`, {
        fontSize: '13px',
        fontFamily: 'Courier New, monospace',
        fill: '#ffd700',
      }).setOrigin(1, 0.5);
    });

    if (!entries || entries.length === 0) {
      this.add.text(width / 2, 250, 'No scores yet — be the first!', {
        fontSize: '14px',
        fontFamily: 'Georgia, serif',
        fill: '#555577',
      }).setOrigin(0.5);
    }
  }

  renderPlayerResult(width) {
    if (GameState.sessionScore === 0) return;

    const y = 516;

    const g = this.add.graphics();
    g.lineStyle(1, 0xffd700, 0.2);
    g.lineBetween(140, y - 16, width - 40, y - 16);

    this.add.text(width / 2, y, `${GameState.playerName}  ·  ${GameState.getRank()}  ·  ${GameState.sessionScore.toLocaleString()} SP`, {
      fontSize: '13px',
      fontFamily: 'Courier New, monospace',
      fill: '#ffd700',
    }).setOrigin(0.5);
  }

  renderButtons(width) {
    const btnBg = this.add.rectangle(width / 2, 562, 200, 40, 0x1a0a2e)
      .setStrokeStyle(2, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 562, 'PLAY AGAIN', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      fill: '#ffd700',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2d1b69); });
    btnBg.on('pointerout', () => { btnBg.setFillStyle(0x1a0a2e); });
    btnBg.on('pointerdown', () => {
      GameState.reset();
      this.scene.start('Title');
    });
  }
}

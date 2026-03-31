/* eslint-disable no-undef */
import 'phaser';
import GameState from '../GameState';
import { PROFESSOR_WIN_LINES, TOWERS } from '../data/professors';

export default class DuelResultScene extends Phaser.Scene {
  constructor() {
    super('DuelResult');
  }

  init(data) {
    this.professor = data.professor;
    this.duelScore = data.duelScore || 0;
    this.duelCorrect = data.duelCorrect || 0;
    this.totalQuestions = data.totalQuestions || 10;
    this.won = data.won !== false;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0221);

    // Stars
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.RND.between(0, width);
      const y = Phaser.Math.RND.between(0, height);
      this.add.circle(x, y, Phaser.Math.RND.between(1, 2), 0xffffff,
        Phaser.Math.RND.between(10, 50) / 100);
    }

    const towerColor = this.getTowerColor();
    const towerHex = this.getTowerHex();

    // Result panel
    const panel = this.add.rectangle(width / 2, height / 2, 600, 460, 0x100820)
      .setStrokeStyle(2, towerColor);

    // Victory / defeat header
    const resultLabel = this.won ? 'DUEL COMPLETE' : 'DUEL OVER';
    const resultColor = this.won ? '#ffd700' : '#ff4444';
    this.add.text(width / 2, 88, resultLabel, {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      fill: resultColor,
      stroke: this.won ? '#8B6914' : '#660000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Professor name
    this.add.text(width / 2, 132, `vs ${this.professor.name}`, {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      fill: towerHex,
    }).setOrigin(0.5);

    // Divider
    const g = this.add.graphics();
    g.lineStyle(1, towerColor, 0.4);
    g.lineBetween(200, 160, 600, 160);

    // Score breakdown
    const accuracy = this.totalQuestions > 0
      ? Math.round((this.duelCorrect / this.totalQuestions) * 100)
      : 0;

    const rows = [
      { label: 'Correct answers', value: `${this.duelCorrect} / ${this.totalQuestions}` },
      { label: 'Accuracy', value: `${accuracy}%` },
      { label: 'SP earned this duel', value: `+${this.duelScore.toLocaleString()} SP` },
      { label: 'Total session score', value: `${GameState.sessionScore.toLocaleString()} SP` },
      { label: 'Current rank', value: GameState.getRank() },
    ];

    rows.forEach((row, i) => {
      const y = 196 + i * 38;
      this.add.text(220, y, row.label, {
        fontSize: '13px',
        fontFamily: 'Courier New, monospace',
        fill: '#888888',
      }).setOrigin(0, 0.5);
      this.add.text(580, y, row.value, {
        fontSize: '13px',
        fontFamily: 'Courier New, monospace',
        fill: '#ffd700',
      }).setOrigin(1, 0.5);
    });

    g.lineBetween(200, 390, 600, 390);

    // Win one-liner
    if (this.won) {
      const winLine = PROFESSOR_WIN_LINES[this.professor.key] || '';
      if (winLine) {
        this.add.text(width / 2, 418, `"${winLine}"`, {
          fontSize: '12px',
          fontFamily: 'Georgia, serif',
          fill: '#aaaaaa',
          fontStyle: 'italic',
          align: 'center',
          wordWrap: { width: 520 },
        }).setOrigin(0.5, 0);
      }
    }

    // Hearts status
    const hearts = '♥'.repeat(Math.max(0, GameState.sessionHearts))
      + '♡'.repeat(Math.max(0, 5 - GameState.sessionHearts));
    this.add.text(width / 2, 496, hearts, {
      fontSize: '22px',
      fill: '#ff4466',
    }).setOrigin(0.5);

    // Continue button
    const isGameComplete = GameState.lennyDefeated;
    const btnLabel = isGameComplete ? 'VIEW LEADERBOARD' : 'CONTINUE  →';

    const btnBg = this.add.rectangle(width / 2, 548, 220, 42, 0x1a0a2e)
      .setStrokeStyle(2, towerColor)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, 548, btnLabel, {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      fill: towerHex,
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2d1b69); });
    btnBg.on('pointerout', () => { btnBg.setFillStyle(0x1a0a2e); });
    btnBg.on('pointerdown', () => {
      if (isGameComplete) {
        this.scene.start('Leaderboard');
      } else {
        this.scene.start('TowerMap');
      }
    });

    // Tween panel in
    panel.alpha = 0;
    this.tweens.add({
      targets: panel,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
    });
  }

  getTowerColor() {
    if (this.professor.isFinalBoss) return 0xffd700;
    const domain = this.professor.domain;
    if (TOWERS[domain]) return TOWERS[domain].color;
    return 0x666688;
  }

  getTowerHex() {
    if (this.professor.isFinalBoss) return '#ffd700';
    const domain = this.professor.domain;
    if (TOWERS[domain]) return TOWERS[domain].hex;
    return '#666688';
  }
}

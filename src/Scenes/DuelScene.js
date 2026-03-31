/* eslint-disable no-undef */
import 'phaser';
import GameState from '../GameState';
import { getQuestionsForProfessor } from '../supabase';
import { TOWERS } from '../data/professors';

const BASIC_SP = 100;
const ADVANCED_SP = 200;
const ARCHETYPE_BONUS = 50;
const DUEL_QUESTION_COUNT = 10;

export default class DuelScene extends Phaser.Scene {
  constructor() {
    super('Duel');
  }

  init(data) {
    this.professor = data.professor;
    this.questions = [];
    this.qIndex = 0;
    this.duelScore = 0;
    this.duelCorrect = 0;
    this.answered = false;
  }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0221);

    this.drawLoading(width, height);
    this.loadQuestions();
  }

  drawLoading(width, height) {
    this.loadingText = this.add.text(width / 2, height / 2, 'Preparing the duel...', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      fill: '#ffd700',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 1, to: 0.3 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  async loadQuestions() {
    const count = this.professor.isFinalBoss ? 10 : DUEL_QUESTION_COUNT;
    const questions = await getQuestionsForProfessor(this.professor.key, count);
    this.loadingText.destroy();

    if (!questions || questions.length === 0) {
      this.add.text(400, 300, 'Error loading questions.\nCheck console for details.', {
        fontSize: '16px',
        fill: '#ff4444',
        align: 'center',
      }).setOrigin(0.5);
      return;
    }

    this.questions = questions;
    this.setupDuelUI();
    this.showQuestion(0);
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

  setupDuelUI() {
    const { width } = this.cameras.main;
    const towerColor = this.getTowerColor();
    const towerHex = this.getTowerHex();

    // ─── Top bar ───
    this.add.rectangle(width / 2, 28, width, 56, 0x0a0118);
    this.add.rectangle(width / 2, 56, width, 1, towerColor, 0.6);

    // Hearts (updated dynamically)
    this.heartsText = this.add.text(20, 28, this.buildHearts(), {
      fontSize: '20px',
      fill: '#ff4466',
    }).setOrigin(0, 0.5);

    // Score
    this.scoreText = this.add.text(width - 20, 28, `${GameState.sessionScore.toLocaleString()} SP`, {
      fontSize: '15px',
      fontFamily: 'Courier New, monospace',
      fill: '#ffd700',
    }).setOrigin(1, 0.5);

    // Question counter
    this.qCounterText = this.add.text(width / 2, 28, 'Q 1 / 10', {
      fontSize: '14px',
      fontFamily: 'Courier New, monospace',
      fill: '#aaaaaa',
    }).setOrigin(0.5);

    // ─── Left panel — Professor ───
    this.add.rectangle(110, 340, 200, 488, 0x0a0118)
      .setStrokeStyle(1, towerColor, 0.5);

    // Avatar circle
    const initials = this.professor.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
    this.add.circle(110, 155, 48, towerColor, 0.25)
      .setStrokeStyle(2, towerColor, 0.8);
    this.add.text(110, 155, initials, {
      fontSize: '26px',
      fontFamily: 'Georgia, serif',
      fill: towerHex,
    }).setOrigin(0.5);

    // Professor name (word-wrapped for long names)
    this.add.text(110, 218, this.professor.name, {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 175 },
    }).setOrigin(0.5);

    this.add.text(110, 245, this.professor.title, {
      fontSize: '10px',
      fontFamily: 'Courier New, monospace',
      fill: towerHex,
      align: 'center',
      wordWrap: { width: 175 },
    }).setOrigin(0.5);

    // Domain badge
    const domain = this.professor.domain || 'pm';
    const domainLabel = this.professor.isFinalBoss ? 'FINAL BOSS'
      : (domain.toUpperCase() + ' TOWER');
    this.add.text(110, 268, domainLabel, {
      fontSize: '9px',
      fontFamily: 'Courier New, monospace',
      fill: towerHex,
      backgroundColor: '#0d0221',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5);

    // Duel score tally
    this.duelScoreLabel = this.add.text(110, 310, '+0 SP this duel', {
      fontSize: '12px',
      fontFamily: 'Courier New, monospace',
      fill: '#44cc44',
    }).setOrigin(0.5);

    // ─── Right panel — Question area ───
    this.add.rectangle(490, 340, 580, 488, 0x100820)
      .setStrokeStyle(1, towerColor, 0.3);

    // Question text (placeholder — filled by showQuestion)
    this.questionText = this.add.text(490, 130, '', {
      fontSize: '15px',
      fontFamily: 'Georgia, serif',
      fill: '#ffffff',
      align: 'left',
      wordWrap: { width: 530 },
    }).setOrigin(0.5, 0);

    // Option buttons placeholders (built in showQuestion)
    this.optionButtons = [];

    // Feedback area
    this.feedbackBg = this.add.rectangle(490, 530, 550, 72, 0x0d0221, 0)
      .setStrokeStyle(0, 0x000000, 0);

    this.feedbackText = this.add.text(490, 530, '', {
      fontSize: '13px',
      fontFamily: 'Georgia, serif',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 520 },
    }).setOrigin(0.5);

    // Next button
    this.nextBtn = this.add.rectangle(490, 583, 170, 36, 0x1a0a2e, 0)
      .setStrokeStyle(0, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.nextBtnText = this.add.text(490, 583, '', {
      fontSize: '13px',
      fontFamily: 'Courier New, monospace',
      fill: '#ffd700',
    }).setOrigin(0.5);

    this.nextBtn.on('pointerover', () => {
      if (this.answered) this.nextBtn.setFillStyle(0x2d1b69);
    });
    this.nextBtn.on('pointerout', () => {
      if (this.answered) this.nextBtn.setFillStyle(0x1a0a2e);
    });
    this.nextBtn.on('pointerdown', () => {
      if (this.answered) this.advanceQuestion();
    });
  }

  buildHearts() {
    const h = GameState.sessionHearts;
    const max = this.professor.isFinalBoss ? 3 : 5;
    return '♥'.repeat(Math.max(0, h)) + '♡'.repeat(Math.max(0, max - h));
  }

  showQuestion(index) {
    if (index >= this.questions.length) {
      this.endDuel(true);
      return;
    }

    this.answered = false;
    const q = this.questions[index];

    // Update counter
    this.qCounterText.setText(`Q ${index + 1} / ${this.questions.length}`);

    // Question text
    this.questionText.setText(q.question);

    // Clear old option buttons
    this.optionButtons.forEach((obj) => obj.destroy());
    this.optionButtons = [];

    // Hide feedback
    this.feedbackBg.setFillStyle(0x0d0221, 0);
    this.feedbackBg.setStrokeStyle(0, 0x000000, 0);
    this.feedbackText.setText('');
    this.nextBtn.setFillStyle(0x1a0a2e, 0);
    this.nextBtn.setStrokeStyle(0, 0x000000, 0);
    this.nextBtnText.setText('');

    // Draw option buttons
    const towerHex = this.getTowerHex();
    const towerColor = this.getTowerColor();

    q.options.forEach((optText, i) => {
      const letter = ['A', 'B', 'C', 'D'][i];
      const y = 290 + i * 68;

      const btnBg = this.add.rectangle(490, y, 548, 60, 0x1a0a2e)
        .setStrokeStyle(1, 0x333355)
        .setInteractive({ useHandCursor: true });

      const letterCircle = this.add.circle(225, y, 14, towerColor, 0.3)
        .setStrokeStyle(1, towerColor, 0.6);

      const letterT = this.add.text(225, y, letter, {
        fontSize: '14px',
        fontFamily: 'Courier New, monospace',
        fill: towerHex,
      }).setOrigin(0.5);

      const optT = this.add.text(248, y, optText.replace(/^[A-D]\.\s*/, ''), {
        fontSize: '13px',
        fontFamily: 'Georgia, serif',
        fill: '#cccccc',
        wordWrap: { width: 490 },
      }).setOrigin(0, 0.5);

      btnBg.on('pointerover', () => {
        if (!this.answered) {
          btnBg.setFillStyle(0x2d1b69);
          btnBg.setStrokeStyle(1, towerColor);
          optT.setStyle({ fill: '#ffffff' });
        }
      });
      btnBg.on('pointerout', () => {
        if (!this.answered) {
          btnBg.setFillStyle(0x1a0a2e);
          btnBg.setStrokeStyle(1, 0x333355);
          optT.setStyle({ fill: '#cccccc' });
        }
      });
      btnBg.on('pointerdown', () => {
        if (!this.answered) this.handleAnswer(letter, q, btnBg, optT);
      });

      this.optionButtons.push(btnBg, letterCircle, letterT, optT);
    });
  }

  handleAnswer(letter, question, clickedBg, clickedText) {
    if (this.answered) return;
    this.answered = true;

    const correct = letter === question.correct_answer;
    const towerColor = this.getTowerColor();

    // Highlight chosen button
    clickedBg.removeInteractive();

    if (correct) {
      clickedBg.setFillStyle(0x0a2a0a);
      clickedBg.setStrokeStyle(2, 0x44cc44);
      clickedText.setStyle({ fill: '#44ff88' });
    } else {
      clickedBg.setFillStyle(0x2a0a0a);
      clickedBg.setStrokeStyle(2, 0xff4444);
      clickedText.setStyle({ fill: '#ff6666' });

      // Show correct answer in green
      this.optionButtons.forEach((obj) => {
        if (obj.type === 'Rectangle' && obj !== clickedBg) {
          // We can't easily find which is the correct button here, so we use feedback text instead
        }
      });
    }

    // Score calculation
    if (correct) {
      const sp = question.difficulty === 'advanced' ? ADVANCED_SP : BASIC_SP;
      const domain = this.professor.domain || 'pm';
      const isPrimary = GameState.primaryTower === domain;
      const bonus = isPrimary ? ARCHETYPE_BONUS : 0;
      const total = sp + bonus;

      GameState.sessionScore += total;
      if (GameState.domainBreakdown[domain] !== undefined) {
        GameState.domainBreakdown[domain] += total;
      }
      this.duelScore += total;
      this.duelCorrect += 1;

      this.scoreText.setText(`${GameState.sessionScore.toLocaleString()} SP`);
      this.duelScoreLabel.setText(`+${this.duelScore} SP this duel`);

      const bonusLabel = bonus > 0 ? ` (+${bonus} archetype bonus)` : '';
      this.showFeedback(true, `+${sp}${bonusLabel} SP\n${question.explanation || ''}`, towerColor);
    } else {
      GameState.sessionHearts -= 1;
      this.heartsText.setText(this.buildHearts());

      const correctLetter = question.correct_answer;
      this.showFeedback(false, `Correct: ${correctLetter}. ${question.explanation || ''}`, towerColor);

      // Check if out of hearts → game over
      if (GameState.sessionHearts <= 0) {
        this.time.delayedCall(2400, () => this.scene.start('GameOver'));
        return;
      }
    }

    // Show next button after brief pause
    this.time.delayedCall(300, () => {
      const isLast = this.qIndex >= this.questions.length - 1;
      const label = isLast ? 'FINISH DUEL  →' : 'NEXT  →';
      this.nextBtn.setFillStyle(0x1a0a2e);
      this.nextBtn.setStrokeStyle(2, towerColor);
      this.nextBtnText.setText(label);
    });
  }

  showFeedback(correct, msg, towerColor) {
    const color = correct ? 0x0a2a0a : 0x2a0a0a;
    const border = correct ? 0x44cc44 : 0xff4444;
    const textColor = correct ? '#44ff88' : '#ff8888';

    this.feedbackBg.setFillStyle(color);
    this.feedbackBg.setStrokeStyle(1, border, 0.8);
    this.feedbackBg.y = 530;

    // Truncate very long explanations
    const maxLen = 160;
    const displayMsg = msg.length > maxLen ? msg.slice(0, maxLen) + '…' : msg;

    this.feedbackText.setText(displayMsg);
    this.feedbackText.setStyle({ fill: textColor });
    this.feedbackText.y = 530;
  }

  advanceQuestion() {
    this.qIndex += 1;
    if (this.qIndex >= this.questions.length) {
      this.endDuel(true);
    } else {
      this.showQuestion(this.qIndex);
    }
  }

  endDuel(won) {
    // Mark professor as defeated
    if (!GameState.defeatedProfessors.includes(this.professor.key)) {
      GameState.defeatedProfessors.push(this.professor.key);
    }

    if (this.professor.isFinalBoss) {
      GameState.lennyDefeated = true;
    }

    this.scene.start('DuelResult', {
      professor: this.professor,
      duelScore: this.duelScore,
      duelCorrect: this.duelCorrect,
      totalQuestions: this.questions.length,
      won,
    });
  }
}

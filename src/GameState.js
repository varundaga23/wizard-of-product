// Global game state singleton — shared across all scenes
const GameState = {
  playerName: 'Apprentice',
  archetype: null,       // 'V' | 'M' | 'B'
  primaryTower: null,    // 'pm' | 'strategy' | 'ai'
  sessionHearts: 5,
  sessionScore: 0,
  domainBreakdown: { pm: 0, strategy: 0, ai: 0, final: 0 },
  defeatedProfessors: [],
  oracleDone: false,
  currentProfessor: null,
  lennyDefeated: false,

  getRank() {
    const s = this.sessionScore;
    const d = this.defeatedProfessors;
    if (this.lennyDefeated) return 'Grand Wizard';
    const pmDone = d.includes('marty_cagan');
    const stratDone = d.includes('hamilton_helmer');
    const aiDone = d.includes('fei_fei_li');
    const towers = [pmDone, stratDone, aiDone].filter(Boolean).length;
    if (towers >= 3 && s >= 7500) return 'Archmage';
    if (towers >= 2 && s >= 4500) return 'Wizard';
    if (towers >= 1 && s >= 2000) return 'Scholar';
    if (s >= 500 && this.oracleDone) return 'Apprentice';
    return 'Muggle';
  },

  allTowersDone() {
    return (
      this.defeatedProfessors.includes('marty_cagan') &&
      this.defeatedProfessors.includes('hamilton_helmer') &&
      this.defeatedProfessors.includes('fei_fei_li')
    );
  },

  reset() {
    this.playerName = 'Apprentice';
    this.archetype = null;
    this.primaryTower = null;
    this.sessionHearts = 5;
    this.sessionScore = 0;
    this.domainBreakdown = { pm: 0, strategy: 0, ai: 0, final: 0 };
    this.defeatedProfessors = [];
    this.oracleDone = false;
    this.currentProfessor = null;
    this.lennyDefeated = false;
  },
};

export default GameState;

export type GlobalStatKey =
	| 'total-number-of-matches'
	| 'total-damage-to-enemy-hero'
	| 'total-mana-spent'
	| 'total-enemy-minions-death'
	| 'total-duration'
	| 'total-tavern-upgrades'
	| 'total-tavern-lock-all'
	| 'total-tavern-reroll'
	| 'total-enemy-heroes-killed'
	| 'total-minions-played-by-tribe-' // this can have prefixes for all tribes, in lowercase
	| 'best-rank';

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
	// this can have prefixes for all tribes, in lowercase, but I don't think it's possible
	// to validate this in TS yet
	// See https://github.com/microsoft/TypeScript/issues/6579
	| 'total-minions-played-by-tribe-'
	| 'best-rank';

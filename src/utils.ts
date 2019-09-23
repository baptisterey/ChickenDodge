// # Fonctions utilitaires
// Fonctions utilitaires pour des méthodes génériques qui n'ont
// pas de lien direct avec le jeu.

// ## Fonction *inRange*
// Méthode utilitaire retournant le booléen *vrai* si une
// valeur se situe dans un interval.
export function inRange(x: number, min: number, max: number) {
  return (min <= x) && (x <= max);
}

// ## Fonction *clamp*
// Méthode retournant la valeur passée en paramètre si elle
// se situe dans l'interval spécifié, ou l'extrémum correspondant
// si elle est hors de l'interval.
export function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

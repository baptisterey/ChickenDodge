// # Interface *ISystem*
// Représente la structure de base d'un système.
export interface ISystem {
  iterate(dT: number): void;
}

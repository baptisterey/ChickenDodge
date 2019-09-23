// # Fonctions d'affichage

// ## Variable *canvas*
// Représente l'élément HTML où est rendu le jeu
export let canvas: HTMLCanvasElement;

// ## Variable *ctx*
// Représente le contexte de rendu, où s'exécutent
// les commandes pour contrôller l'affichage
export let context: WebGLRenderingContext;

// ## Méthode *init*
// La méthode d'initialisation prend en paramètre le nom d'un objet de
// type *canvas* de la page web où dessiner. On y extrait
// et conserve alors une référence vers le contexte de rendu 3D.
export function init(canvasId: string) {
  canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  const gl = canvas.getContext("webgl");
  if (!gl) {
    throw new Error("Impossible de récupérer le contexte WebGL!");
  }
  context = gl;
  return context;
}

// ## Méthode *requestFullScreen*
// Méthode utilitaire pour mettre le canvas en plein écran.
// Il existe plusieurs méthodes selon le navigateur, donc on
// se doit de vérifier l'existence de celles-ci avant de les
// appeler.
//
// À noter qu'un script ne peut appeler le basculement en plein
// écran que sur une action explicite du joueur.
export function requestFullScreen() {
  canvas.requestFullscreen();
}

// ## Classe *Rectangle*
// Classe pour représenter un rectangle.
interface IRectangleDesc {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface IRectangleDescAlt {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isRectangleDesc(arg: IRectangleDesc | IRectangleDescAlt): arg is IRectangleDesc {
  return (arg as IRectangleDesc).xMin !== undefined;
}

export class Rectangle {
  public xMin: number;
  public xMax: number;
  public yMin: number;
  public yMax: number;

  // ### Constructeur de la classe *Rectangle*
  // Le constructeur de cette classe prend en paramètre un
  // objet pouvant définir soit le centre et la taille du
  // rectangle (`x`, `y`, `width` et `height`) ou les côtés
  // de celui-ci (`xMin`, `xMax`, `yMin` et `yMax`).
  constructor(descr: IRectangleDesc | IRectangleDescAlt) {
    if (isRectangleDesc(descr)) {
      this.xMin = descr.xMin;
      this.xMax = descr.xMax;
      this.yMin = descr.yMin;
      this.yMax = descr.yMax;

    } else {
      this.xMin = descr.x - descr.width / 2;
      this.xMax = descr.x + descr.width / 2;
      this.yMin = descr.y - descr.height / 2;
      this.yMax = descr.y + descr.height / 2;
    }
  }

  // ### Fonction *intersectsWith*
  // Cette fonction retourne *vrai* si ce rectangle et celui
  // passé en paramètre se superposent.
  public intersectsWith(other: Rectangle) {
    return !(
      (this.xMin >= other.xMax) ||
      (this.xMax <= other.xMin) ||
      (this.yMin >= other.yMax) ||
      (this.yMax <= other.yMin)
    );
  }
}

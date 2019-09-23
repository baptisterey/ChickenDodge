import { Resources } from "../resources";
import { Scene } from "../scene";
import { Component } from "./component";
import { SpriteSheetComponent } from "./spriteSheetComponent";

// # Classe *BackgroundLoaderComponent*
// Cette classe instancie des sprites à partir d'un fichier
// de description. Ces sprites sont positionnés dans une grille,
// mais peuvent elle-mêmes être de tailles diverses.
interface IEntry {
  spriteName: string;
  isAnimated: boolean;
  frameSkip: number;
}

interface IEntryMap {
  [key: string]: IEntry;
}

interface IBackgroundLoaderComponentDesc {
  description: string;
  spriteSheet: string;
  scale: number;
  entryMap: IEntryMap;
}

export class BackgroundLoaderComponent extends Component<IBackgroundLoaderComponentDesc> {
  private entryMap!: IEntryMap;
  private scale!: number;

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: IBackgroundLoaderComponentDesc) {
    this.entryMap = descr.entryMap;
    this.scale = descr.scale;
  }

  // ## Méthode *setup*
  // Cette méthode est responsable d'instancier les différents
  // objets contenant des sprites.
  public setup(descr: IBackgroundLoaderComponentDesc) {
    const spriteSheet = Component.findComponent<SpriteSheetComponent>(descr.spriteSheet);
    const content = Resources.load<string>(descr.description)!;

    const lines = content.split(/\r?\n/);
    for (let row = 0; row < lines.length; ++row) {
      const chars = lines[row].split("");
      for (let col = 0; col < chars.length; ++col) {
        const char = chars[col];
        const entry = this.entryMap[char];
        if (!entry) {
          continue;
        }

        Scene.current.createChild({
          components: {
            Position: {
              x: col * this.scale,
              y: row * this.scale,
              z: row * 0.01,
            },
            Sprite: {
              frameSkip: entry.frameSkip,
              isAnimated: entry.isAnimated,
              spriteName: entry.spriteName,
              spriteSheet,
            },
          },
        }, `${col}-${row}`, this.owner);
      }
    }
  }
}

import { Resources } from "../resources";
import { ITextureComponentDesc, TextureComponent } from "./textureComponent";

interface IPosition {
  x: number;
  y: number;
}

export interface ISize {
  w: number;
  h: number;
}

interface IArea extends IPosition, ISize {
}

export interface IFrameEntry {
  frame: IArea;
  sourceSize: ISize;
  uv?: IArea;
}

interface IFrameEntries {
  [key: string]: IFrameEntry;
}

interface IMetaEntry {
  size: ISize;
}

interface ISpriteSheetDescrFile {
  frames: IFrameEntries;
  meta: IMetaEntry;
}

// # Classe *SpriteSheetComponent*
// Ce composant comprend les fonctions nécessaires à l'affichage
// de sprites.
interface ISpriteSheetDesc extends ITextureComponentDesc {
  description: string;
}

export class SpriteSheetComponent extends TextureComponent<ISpriteSheetDesc> {
  public sprites!: IFrameEntries;

  // ## Méthode *create*
  public create(descr: ISpriteSheetDesc) {
    // On charge l'image et les shaders
    super.create(descr);

    // On charge ensuite le fichier de description de l'image,
    // qui contient l'emplacement et les dimensions des sprites
    // contenues sur la feuille.
    const content = Resources.load<string>(descr.description)!;
    const rawDescription = JSON.parse(content) as ISpriteSheetDescrFile;
    this.parseDescription(rawDescription);
  }

  // ## Méthode *parseDescription*
  // Cette méthode extrait la description de la feuille de sprite.
  private parseDescription(rawDescription: ISpriteSheetDescrFile) {
    this.sprites = rawDescription.frames;
    for (const k in rawDescription.frames) {
      if (!rawDescription.frames.hasOwnProperty(k)) {
        continue;
      }
      const v = rawDescription.frames[k];
      v.uv = this.normalizeUV(v.frame, rawDescription.meta.size);
    }
  }

  // ## Fonction *normalizeUV*
  // La fonction *normalizeUV* retourne la position relative, entre
  // 0 et 1, des rectangles comportant les sprites de la feuille.
  private normalizeUV(frame: IArea, size: ISize) {
    return {
      x: frame.x / size.w,
      y: frame.y / size.h,
      // tslint:disable-next-line:object-literal-sort-keys
      w: frame.w / size.w,
      h: frame.h / size.h,
    };
  }
}

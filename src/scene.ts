import { IComponent } from "./components/component";
import { Entity, IEntity } from "./entity";

// # Interfaces de description
// Ces interfaces permettent de définir la structure de
// description d'une scène, telle que normalement chargée
// depuis un fichier JSON.
export interface IComponentDesc {
  [key: string]: any;
}

export interface IEntityDesc {
  components?: IComponentDesc;
  children?: ISceneDesc;
}

export interface ISceneDesc {
  [key: string]: IEntityDesc;
}

type IPendingSetup = Map<IComponent, IComponentDesc>;

// # Classe *Scene*
// La classe *Scene* représente la hiérarchie d'objets contenus
// simultanément dans la logique du jeu.
export class Scene {
  public static current: Scene;

  // ## Fonction statique *create*
  // La fonction *create* permet de créer une nouvelle instance
  // de la classe *Scene*, contenant tous les objets instanciés
  // et configurés. Le paramètre `description` comprend la
  // description de la hiérarchie et ses paramètres.
  public static create(description: ISceneDesc): Scene {
    const scene = new Scene();
    Scene.current = scene;
    const toSetup = new Map<IComponent, IComponentDesc>();
    scene.createChildren(description, scene.root, toSetup);
    scene.setupChildren(toSetup);
    return scene;
  }
  private root = new Entity();

  private constructor() {
  }

  public createChild(descr: IEntityDesc, name: string, parent: IEntity) {
    const toSetup = new Map<IComponent, IComponentDesc>();
    const newChild = this.createChildInternal(descr, name, parent, toSetup);
    this.setupChildren(toSetup);
    return newChild;
  }

  // ## Fonction *findObject*
  // La fonction *findObject* retourne l'objet de la scène
  // portant le nom spécifié.
  public findObject(objectName: string): IEntity | undefined {
    return this.findObjectRecursive(this.root, objectName);
  }

  // ## Méthode *entities*
  // Cette méthode parcourt l'ensemble des entités de la scène
  public entities(onlyActive: boolean = true) {
    return this.entitiesRecursive(this.root, onlyActive);
  }

  private createChildInternal(descr: IEntityDesc, name: string, parent: IEntity, toSetup: IPendingSetup) {
    const newObj = new Entity();
    parent.addChild(name, newObj);
    this.createChildren(descr.children || {}, newObj, toSetup);

    for (const type in descr.components) {
      if (!descr.components.hasOwnProperty(type)) {
        continue;
      }
      const compDescr = descr.components[type];
      const newComp = newObj.addComponent(type, compDescr, true);
      toSetup.set(newComp, compDescr);
    }
    return newObj;
  }

  private createChildren(description: ISceneDesc, parent: IEntity, toSetup: IPendingSetup) {
    for (const name in description) {
      if (!description.hasOwnProperty(name)) {
        continue;
      }
      const descr = description[name];
      this.createChildInternal(descr, name, parent, toSetup);
    }
  }

  private setupChildren(pending: IPendingSetup) {
    for (const [comp, desc] of pending) {
      comp.setup(desc);
    }
  }

  private findObjectRecursive(parent: IEntity, objectName: string): IEntity | undefined {
    let found = parent.getChild(objectName);
    if (found) {
      return found;
    }
    for (const obj of parent.children) {
      if (!found) {
        found = this.findObjectRecursive(obj, objectName);
      }
    }
    return found;
  }

  private *entitiesRecursive(entity: IEntity, onlyActive: boolean): IterableIterator<IEntity> {
    if (onlyActive && !entity.active) {
      return;
    }

    for (const child of entity.children) {
      yield child;
      yield *this.entitiesRecursive(child, onlyActive);
    }
  }
}

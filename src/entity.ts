import { ComponentFactory } from "./components";
import { IComponent } from "./components/component";
import { IComponentDesc, Scene } from "./scene";

// # Interface *IEntity*
// Cette interface présente la structure d'une entité valide
export interface IEntity {
  parent: IEntity | null;
  active: boolean;
  readonly components: IterableIterator<IComponent>;
  readonly children: IterableIterator<IEntity>;
  addChild(name: string, child: IEntity): void;
  removeChild(child: IEntity): void;
  getChild(name: string): IEntity | undefined;
  addComponent<T extends IComponent>(type: string, descr: IComponentDesc, deferred?: boolean): T;
  getComponent<T extends IComponent>(type: string): T;
}

interface IChildEntry {
  name: string;
  order: number;
  child: IEntity;
}

// # Classe *Entity*
// La classe *Entity* représente un objet de la scène qui
// peut contenir des enfants et des composants.
export class Entity implements IEntity {
  // ## Fonction *componentCreator*
  // Référence vers la fonction permettant de créer de
  // nouveaux composants. Permet ainsi de substituer
  // cette fonction afin de réaliser des tests unitaires.
  public static componentCreator = ComponentFactory.create;

  // ## Membre *active*
  // Si ce membre a une valeur fausse, les systèmes devraient
  // ignorer les composants de cet objet et ses enfants.
  public active = true;

  public parent: IEntity | null = null;

  public get components() {
    return this._components.values();
  }

  private _components = new Map<string, IComponent>();

  private nextChildOrder = 0;
  private _children = new Set<IChildEntry>();
  private childrenByName = new Map<string, IChildEntry>();
  private childrenByChild = new Map<IEntity, IChildEntry>();

  // ## Méthode *addComponent*
  // Cette méthode prend en paramètre le type d'un composant et
  // instancie un nouveau composant.
  public addComponent<T extends IComponent>(type: string, descr: IComponentDesc, deferred = false): T {
    const newComponent = Entity.componentCreator(type, this) as T;
    this._components.set(type, newComponent);
    newComponent.create(descr);
    if (!deferred) {
      newComponent.setup(descr);
    }
    return newComponent;
  }

  // ## Fonction *getComponent*
  // Cette fonction retourne un composant existant du type spécifié
  // associé à l'objet.
  public getComponent<T extends IComponent>(type: string): T {
    return this._components.get(type) as T;
  }

  // ## Méthode *addChild*
  // La méthode *addChild* ajoute à l'objet courant un objet
  // enfant.
  public addChild(objectName: string, child: IEntity) {
    if (child.parent) {
      throw new Error("Cet objet est déjà attaché à un parent");
    }

    const childEntry = {
      child,
      name: objectName,
      order: this.nextChildOrder++,
    };

    this._children.add(childEntry);
    this.childrenByName.set(objectName, childEntry);
    this.childrenByChild.set(child, childEntry);

    child.parent = this;
  }

  // ## Méthode *removeChild*
  // La méthode *removeChild* enlève un enfant de l'objet courant
  public removeChild(child: IEntity) {
    if (child.parent !== this) {
      throw new Error("Cet object n'est pas attaché à ce parent");
    }

    const childEntry = this.childrenByChild.get(child)!;
    this.childrenByChild.delete(child);

    if (this.childrenByName.get(childEntry.name) === childEntry) {
      this.childrenByName.delete(childEntry.name);
    }

    this._children.delete(childEntry);

    child.parent = null;
  }

  // ## Fonction *getChild*
  // La fonction *getChild* retourne un objet existant portant le
  // nom spécifié, dont l'objet courant est le parent.
  public getChild(objectName: string): IEntity | undefined {
    const childEntry = this.childrenByName.get(objectName);
    if (childEntry) {
      return childEntry.child;
    }
  }

  public get children() {
    return this.sortedChildren();
  }

  private *sortedChildren() {
    const sortedChildren = Array.from(this._children).sort((a, b) => a.order - b.order);
    for (const v of sortedChildren) {
      yield v.child;
    }
  }
}

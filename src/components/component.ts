import { IEntity } from "../entity";
import { Scene } from "../scene";

// ## Interface *IComponent*
// Représente un composant minimal.
export interface IComponent {
  // ### Variable *__type*
  // Cette variable conserve le nom du type, pour faire
  // certaines vérifications à l'exécution, puisqu'on n'est
  // pas dans un langage fortement typé.
  __type: string;

  __desc: any | undefined;

  // ## Accesseur *enabled*
  // L'accesseur *enabled* active ou désactive le composant, et appelle
  // une méthode en réponse si l'état a changé.
  enabled: boolean;

  // ### Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  create(desc: any): void;

  // ### Méthode *setup*
  // Cette méthode est appelée pour configurer le composant après
  // que tous les composants d'un objet aient été créés.
  setup(desc: any): void;

  enable(val: boolean): void;

  // ## Méthode *onEnabled*
  // La méthode *onEnabled* est appelée quand l'objet passe de l'état
  // activé à désactivé.
  onEnabled(): void;

  // ## Méthode *onDisabled*
  // La méthode *onDisabled* est appelée quand l'objet passe de l'état
  // désactivé à activé.
  onDisabled(): void;
}

// ## Classe *Component*
// Cette classe est une classe de base pour l'ensemble des
// composants et implémente les méthodes par défaut.
export abstract class Component<TDesc extends object> implements IComponent {

  // ## Accesseur *enabled*
  // L'accesseur *enabled* active ou désactive le composant, et appelle
  // une méthode en réponse si l'état a changé.
  get enabled() {
    return this._enabled;
  }

  set enabled(val) {
    if (this.enabled === val) {
      return;
    }
    this._enabled = val;

    if (this.enabled) {
      this.onEnabled();
    } else {
      this.onDisabled();
    }
  }

  protected static findComponent<T extends IComponent>(name: string | T): T | undefined {
    if (typeof (name) !== "string") {
      return name;
    }

    const tokens = name.split(".");
    const targetName = tokens[0];
    const compName = tokens[1];

    const target = Scene.current.findObject(targetName);
    return target && target.getComponent<T>(compName);
  }

  public __desc: TDesc | undefined;
  public __type!: string;
  private _enabled = true;

  // ### Constructeur de la classe *Composant*
  // Le constructeur de cette classe prend en paramètre l'objet
  // propriétaire du composant, et l'assigne au membre `owner`.
  constructor(public owner: IEntity) {

  }

  // ### Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(desc: TDesc): void {
    // Rien
  }

  // ### Méthode *setup*
  // Cette méthode est appelée pour configurer le composant après
  // que tous les composants d'un objet aient été créés.
  public setup(descr: TDesc): void {
    // Rien
  }

  public enable(val: boolean) {
    this.enabled = val;
  }

  // ## Méthode *onEnabled*
  // La méthode *onEnabled* est appelée quand l'objet passe de l'état
  // activé à désactivé.
  public onEnabled() {
    // Rien
  }

  // ## Méthode *onDisabled*
  // La méthode *onDisabled* est appelée quand l'objet passe de l'état
  // désactivé à activé.
  public onDisabled() {
    // Rien
  }
}

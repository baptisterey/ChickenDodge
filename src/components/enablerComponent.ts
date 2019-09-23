import { EventTrigger } from "../eventTrigger";
import { Component } from "./component";

// # Classe *EnablerComponent*
// Ce composant active ou désactive d'autres composants,
// au lancement et en réponse à un événement externe.
interface IOnEvent {
  [comp: string]: boolean;
}

interface IEnablerComponentDesc {
  onStart: IOnEvent;
  onEvent: IOnEvent;
}

export class EnablerComponent extends Component<IEnablerComponentDesc> {
  private eventTargets = new EventTrigger();

  // ## Méthode *setup*
  // Cette méthode est appelée pour configurer le composant après
  // que tous les composants d'un objet aient été créés.
  public setup(descr: IEnablerComponentDesc) {
    for (const name in descr.onStart) {
      if (!descr.onStart.hasOwnProperty(name)) {
        continue;
      }
      const enabled = descr.onStart[name];
      const target = Component.findComponent(name)!;
      target.enabled = enabled;
    }

    for (const name in descr.onEvent) {
      if (!descr.onEvent.hasOwnProperty(name)) {
        continue;
      }
      const enabled = descr.onEvent[name];
      const target = Component.findComponent(name)!;
      this.eventTargets.add(target, "enable", undefined, enabled);
    }
  }

  // ## Méthode *onEvent*
  // Active ou désactive les composants en réaction à un événement.
  private onEvent() {
    this.eventTargets.trigger();
  }
}

type IMethod = (...args: any[]) => void;

interface IHandler {
  instance: object;
  method: IMethod | string;
  context?: any;
}

// # Classe *EventTrigger*
// Classe utilitaire pour appeler des méthodes en réaction
// à des événements.
export class EventTrigger {
  private handlers = new Map<string, IHandler>();
  private autoIndex = 0;

  // ## Méthode *add*
  // Ajoute une méthode à appeler lors du déclenchement de
  // l'événement.
  public add(instance: object, method: IMethod | string, name?: string, context?: any) {
    if (!name) {
      name = (this.autoIndex++).toString();
    }

    this.handlers.set(name, {
      context,
      instance,
      method,
    });

    return name;
  }

  // ## Méthode *remove*
  // Supprime une méthode du tableau de méthodes à appeler.
  public remove(name: string) {
    this.handlers.delete(name);
  }

  // ## Méthode *trigger*
  // Déclenche les méthodes enregistrées.
  public trigger(...params: any[]) {
    for (const handler of this.handlers.values()) {
      if (handler.context) {
        params.push(handler.context);
      }
      let method = handler.method;
      if (typeof (method) === "string") {
        method = (handler.instance as any)[method] as IMethod;
      }
      method.apply(handler.instance, params);
    }
  }
}

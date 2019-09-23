export class Timing {
  public now = new Date();

  constructor(public dT: number, public frame: number) {
  }
}

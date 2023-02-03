export default class List<T> extends Array<T> {
  public constructor(array?: T[]) {
    super();

    if (array) {
      this.push(...array);
    }
  }

  public removeDuplicates(): List<T> {
    return new List<T>([...new Set<T>(this.values())]);
  }

  public sortList(ascending: boolean): List<T> {
    return new List<T>([...this.sort((a, b) => (ascending ? (a > b ? 1 : -1) : a > b ? -1 : 1))]);
  }

  public clearList(): void {
    this.length = 0;
  }

  public isLastElement(elem: T): boolean {
    return this.indexOf(elem) === this.length - 1;
  }

  public isEmptyList(): boolean {
    return this.length === 0;
  }

  public toNumberList(): List<number> {
    if (this.isEmptyList()) {
      return new List<number>();
    }

    return new List<number>(
      Object.values(this)
        .map(Number)
        .filter((num) => !isNaN(num) && num > 0)
    );
  }

  public toStringList(): List<string> {
    if (this.isEmptyList()) {
      return new List<string>();
    }

    return new List<string>(Object.values(this).map(String));
  }

  public get first(): T {
    return Object.values(this)[0];
  }

  public get last(): T {
    return Object.values(this)[this.length - 1];
  }

  public get elements(): T[] {
    return Object.values(this);
  }
}

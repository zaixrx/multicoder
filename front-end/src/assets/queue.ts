class Queue<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  enqueue(item: T) {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    const item: T = this.items[0];
    if (!item) return;
    this.items.splice(0, 1);
    return item;
  }

  peek() {
    return this.items[0];
  }

  count() {
    return this.items.length;
  }
}

export default Queue;

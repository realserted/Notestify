type UpsertMap<K, V> = Map<K, V> & {
  getOrInsert?: (key: K, value: V) => V;
  getOrInsertComputed?: (key: K, fn: (key: K) => V) => V;
};
type UpsertWeakMap<K extends object, V> = WeakMap<K, V> & {
  getOrInsert?: (key: K, value: V) => V;
  getOrInsertComputed?: (key: K, fn: (key: K) => V) => V;
};

if (typeof Map !== 'undefined') {
  const proto = Map.prototype as UpsertMap<unknown, unknown>;
  if (!proto.getOrInsert) {
    proto.getOrInsert = function <K, V>(this: Map<K, V>, key: K, value: V): V {
      if (this.has(key)) return this.get(key) as V;
      this.set(key, value);
      return value;
    };
  }
  if (!proto.getOrInsertComputed) {
    proto.getOrInsertComputed = function <K, V>(
      this: Map<K, V>,
      key: K,
      fn: (key: K) => V,
    ): V {
      if (this.has(key)) return this.get(key) as V;
      const value = fn(key);
      this.set(key, value);
      return value;
    };
  }
}

if (typeof WeakMap !== 'undefined') {
  const proto = WeakMap.prototype as UpsertWeakMap<object, unknown>;
  if (!proto.getOrInsert) {
    proto.getOrInsert = function <K extends object, V>(
      this: WeakMap<K, V>,
      key: K,
      value: V,
    ): V {
      const existing = this.get(key);
      if (existing !== undefined || this.has(key)) return existing as V;
      this.set(key, value);
      return value;
    };
  }
  if (!proto.getOrInsertComputed) {
    proto.getOrInsertComputed = function <K extends object, V>(
      this: WeakMap<K, V>,
      key: K,
      fn: (key: K) => V,
    ): V {
      const existing = this.get(key);
      if (existing !== undefined || this.has(key)) return existing as V;
      const value = fn(key);
      this.set(key, value);
      return value;
    };
  }
}

interface PromiseWithResolversShape {
  withResolvers?: <T>() => {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
}

if (typeof Promise !== 'undefined') {
  const P = Promise as unknown as PromiseWithResolversShape;
  if (typeof P.withResolvers !== 'function') {
    P.withResolvers = function <T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

export {};

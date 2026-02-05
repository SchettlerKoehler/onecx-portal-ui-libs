import { computed, linkedSignal, signal, type Signal, type WritableSignal } from '@angular/core';


/**
 * Helper to derive the parent's corresponding DelegatingWritableSignal in a type-safe way.
 * Avoids string keys; refactor-safe via selector function.
 */
export function parentMember<TParent, TValue>(
  parent: Signal<TParent | null>,
  select: (p: TParent) => DelegatingWritableSignal<TValue>
): Signal<DelegatingWritableSignal<TValue> | null> {
  return computed(() => {
    const p = parent();
    return p ? select(p) : null;
  });
}

/**
 * A signal-like type that is callable for reads and has .set/.update for writes.
 * Reads participate in Angular reactivity (templates, computed, effect).
 *
 * Note: This is intentionally not typed as Angular's WritableSignal<T>, because
 * we need .set/.update to dynamically delegate to a parent after parenting.
 */
export type DelegatingWritableSignal<T> = Signal<T> & {
  set(value: T): void;
  update(fn: (value: T) => T): void;
  asReadonly?: () => Signal<T>;
};

/**
 * Creates a single stable signal-like instance:
 * - Read: local until parent exists, then mirrors parent's signal
 * - Write: forwards to parent if present, otherwise writes locally
 */
export function createDelegatingParentSignal<T>(
  initialValue: T,
  parentSignal: Signal<DelegatingWritableSignal<T> | null>
): DelegatingWritableSignal<T> {
  const local: WritableSignal<T> = signal(initialValue);

  // Linked read: switches between local and parent reactively
  const read = linkedSignal<T>(() => {
    const p = parentSignal();
    return p ? p() : local();
  });

  // One stable callable function object exposed to consumers
  const fn = (() => read()) as DelegatingWritableSignal<T>;

  fn.set = (value: T) => {
    const p = parentSignal();
    if (p) p.set(value);
    else local.set(value);
  };

  fn.update = (updater: (value: T) => T) => {
    const p = parentSignal();
    if (p) p.update(updater);
    else local.update(updater);
  };

  fn.asReadonly = () => fn;

  return fn;
}
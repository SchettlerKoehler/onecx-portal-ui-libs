import { signal } from '@angular/core';
import { createDelegatingParentSignal, DelegatingWritableSignal, parentMember } from '../utils/delegating-parent-signal';

/**
 * @Component({
    selector: 'my-comp'
    })
    export class MyComponent {

        store = new DataComponentStore();
        @Input()
        set parentStore(value: DataComponentStore) {
            this.store.parent(value);
        }

        @Input()
        set myValue(value: number) {
            this.store.myValue.set(value);
        }
    }

----------------
    const a = new DataComponentStore();
    const b = new DataComponentStore();

    a.myValue.set(5);
    a.myValue(); // 5
    b.myValue.set(7);
    b.myValue(); // 7

    a.parent.set(b);
    a.myValue(); // 7

    a.myValue.set(3);
    a.myValue(); // 3
    b.myValue(); // 3

    const c = computed(() => a.myValue() * 2);
    c(); // 6

 */
export class DataComponentStore {
  parent = signal<DataComponentStore | null>(null);

  readonly myValue: DelegatingWritableSignal<number> =
    createDelegatingParentSignal(0, parentMember(this.parent, p => p.myValue));

  
}
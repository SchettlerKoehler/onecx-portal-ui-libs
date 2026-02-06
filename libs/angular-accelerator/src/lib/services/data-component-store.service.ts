import { Injectable, Injector, Optional, signal, SkipSelf } from "@angular/core";

function dataComponentStoreFactory(parentInjector: Injector, dataComponentStoreService: DataComponentStoreService | null) {
  if (!dataComponentStoreService) {
    const injector = Injector.create({ providers: [{ provide: DataComponentStoreService }], parent: parentInjector })
    dataComponentStoreService = injector.get(DataComponentStoreService)
  }
  return dataComponentStoreService
}

export function provideDataComponentStore() {
    return {
      provide: DataComponentStoreService,
      useFactory: dataComponentStoreFactory,
      deps: [Injector, [new Optional(), new SkipSelf(), DataComponentStoreService]],
    }
}


@Injectable()
export class DataComponentStoreService {
    readonly myValue = signal(0);
}
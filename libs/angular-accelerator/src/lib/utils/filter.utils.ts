import { ColumnFilterDataSelectOptions, Filter } from '@onecx/angular-accelerator/model'

export function limit(columnFilterData: Filter[], amount: number, options: ColumnFilterDataSelectOptions): Filter[] {
  return options.reverse
    ? columnFilterData.slice(-amount, columnFilterData.length).reverse()
    : columnFilterData.slice(0, amount)
}

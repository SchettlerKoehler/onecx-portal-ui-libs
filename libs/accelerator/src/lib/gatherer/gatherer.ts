import { Topic } from '../topic/topic'

window['@onecx/accelerator'] ??= {}
window['@onecx/accelerator'].gatherer ??= {}
window['@onecx/accelerator'].gatherer.promises ??= {}

/**
 * Implementation of the Scatter-Gather pattern.
 */
export class Gatherer<Request, Response> {
  private static id = 0
  private readonly topic: Topic<{ id: number; request: Request }>
  private readonly ownIds = new Set<number>()

  constructor(name: string, version: number, callback: (request: Request) => Promise<Response>) {
    this.topic = new Topic<{ id: number; request: Request }>(name, version, false)
    this.topic.subscribe((m) => {
      if (!this.ownIds.has(m.id)) {
        if (window['@onecx/accelerator']?.gatherer?.promises) {
          if (window['@onecx/accelerator']?.gatherer?.debug?.includes(name)) {
            console.log('Gatherer', name, ':', version, 'received request', m.request)
          }
          let resolve: (value: Response) => void
          window['@onecx/accelerator'].gatherer.promises[m.id].push(
            new Promise((r) => {
              resolve = r
            })
          )
          callback(m.request).then((response) => {
            resolve(response)
            if (window['@onecx/accelerator']?.gatherer?.debug?.includes(name)) {
              console.log('Gatherer', name, ':', version, 'answered', m.request, 'with', response)
            }
          })
        }
      }
    })
  }

  destroy() {
    this.topic?.destroy()
    this.ownIds.forEach((id) => {
      if (window['@onecx/accelerator']?.gatherer?.promises?.[id]) {
        delete window['@onecx/accelerator'].gatherer.promises[id]
      }
    })
  }

  async gather(request: Request): Promise<Response[]> {
    if (!window['@onecx/accelerator']?.gatherer?.promises) {
      throw new Error('Gatherer is not initialized')
    }
    const id = Gatherer.id++
    this.ownIds.add(id)
    window['@onecx/accelerator'].gatherer.promises[id] = []
    await this.topic.publish({ id, request })
    const promises = (window['@onecx/accelerator']?.gatherer?.promises?.[id] ?? []) as Promise<Response>[]
    delete window['@onecx/accelerator'].gatherer.promises[id]
    this.ownIds.delete(id)
    return Promise.all(promises)
  }
}

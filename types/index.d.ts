import type { HoaContext, HoaMiddleware } from 'hoa'

export interface JSONOptions {
  expose?: boolean
  status?: ((ctx: HoaContext, error?: Error) => number | Promise<number>) | number
  success?: Record<string, ((ctx: HoaContext) => any | Promise<any>) | any>
  fail?: Record<string, ((ctx: HoaContext, error: Error) => any | Promise<any>) | any>
}

export function json(options?: JSONOptions): HoaMiddleware

export default json

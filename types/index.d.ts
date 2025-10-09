import type { HoaContext } from 'hoa'

export interface JSONOptions {
  status?: ((ctx: HoaContext, error?: Error) => number | Promise<number>) | number
  success?: Record<string, ((ctx: HoaContext) => any | Promise<any>) | any>
  fail?: Record<string, ((ctx: HoaContext, error: Error) => any | Promise<any>) | any>
}

export type JSONMiddleware = (ctx: HoaContext, next: () => Promise<void>) => Promise<void>

export function json(options?: JSONOptions): JSONMiddleware

export default json

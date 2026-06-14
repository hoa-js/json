import { statusTextMapping } from 'hoa'

/**
 * JSON response formatting middleware for Hoa.
 *
 * Wraps route responses into a consistent JSON envelope for success and error cases.
 * - For successful responses, builds a body using the success schema.
 * - For failures (exceptions), catches errors, merges provided error headers, and builds a body using the fail schema.
 * - For HEAD and OPTIONS requests, the middleware skips building a body.
 *
 * @param {Object} [options]
 * @param {boolean} [options.expose=false]
 *   When true, exposes the error message globally; overridden per-error by `error.expose`.
 * @param {(import('hoa').HoaContext, Error=) => (number|Promise<number>) | number} [options.status]
 *   Status schema or fixed status code; if a function, it's called as (ctx, error?) and may return a number or a Promise<number>.
 * @param {Record<string, (((ctx: import('hoa').HoaContext) => any | Promise<any>) | any)>} [options.success]
 *   Keys and resolvers used to compose the success JSON body; values may be literals or async functions.
 * @param {Record<string, (((ctx: import('hoa').HoaContext, error: Error) => any | Promise<any>) | any)>} [options.fail]
 *   Keys and resolvers used to compose the error JSON body; values may be literals or async functions.
 * @returns {HoaMiddleware} Hoa middleware function.
 */
export function json (options = {}) {
  const statusSchema = options.status ?? ((ctx, e) => {
    return e
      ? (e.status || e.statusCode || 500)
      : ctx.res.status
  })

  /**
   * Default success schema.
   * code: the current response status.
   * data: the current response body, or null when not set.
   */
  const successSchema = options.success ?? {
    code: (ctx) => ctx.res.status,
    data: (ctx) => ctx.res.body ?? null
  }

  /**
   * Default failure schema.
   * code: the error status if available, otherwise 500.
   * message: the error message if available, otherwise null.
   */
  const failSchema = options.fail ?? {
    code: (ctx, e) => e.status || e.statusCode || 500,
    message: (ctx, e) => (e.expose ?? options.expose) ? e.message : statusTextMapping[e.status || e.statusCode || 500]
  }

  return async function hoaJson (ctx, next) {
    try {
      await next()

      if (ctx._raw) {
        return
      }

      const method = ctx.req.method.toLowerCase()
      if (method === 'head' || method === 'options') return

      const body = {}
      for (const key in successSchema) {
        const fn = successSchema[key]
        body[key] = typeof fn === 'function' ? await fn(ctx) : fn
      }

      const status = typeof statusSchema === 'function'
        ? await statusSchema(ctx)
        : statusSchema

      ctx.res.status = status
      ctx.res.body = body
    } catch (err) {
      if (ctx._raw) {
        throw err
      }

      ctx.app.onerror(err, ctx)

      const body = {}
      for (const key in failSchema) {
        const fn = failSchema[key]
        body[key] = typeof fn === 'function' ? await fn(ctx, err) : fn
      }

      const status = typeof statusSchema === 'function'
        ? await statusSchema(ctx, err)
        : statusSchema

      // Merge headers from the error object into the response, if provided.
      if (err && err.headers) {
        const errHeaders = new Headers(err.headers)
        for (const [k, v] of errHeaders.entries()) {
          ctx.res.set(k, v)
        }
      }

      ctx.res.status = status
      ctx.res.body = body
    }
  }
}

export default json

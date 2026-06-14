import { Hoa, statusTextMapping } from 'hoa'

import { json } from '../src/json.js'

describe('JSON response formatting middleware for Hoa.', () => {
  it('default', async () => {
    const app = new Hoa()
    app.use(json())
    app.use(async (ctx, next) => {
      if (ctx.req.pathname === '/') {
        await next()
        ctx.res.status = 201
        ctx.res.body = 'Hello, Hoa!'
        return
      }
      if (ctx.req.pathname === '/error') {
        ctx.throw(400, 'error!!!')
      }
      if (ctx.req.pathname === '/empty') {
        if (ctx.req.method === 'HEAD') {
          ctx.res.status = 201
        } else if (ctx.req.method === 'OPTIONS') {
          ctx.res.status = 202
        } else if (ctx.req.method === 'GET') {
          ctx.res.status = 203
        }
        ctx.res.body = ''
        return
      }
      await next()
    })

    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      code: 201,
      data: 'Hello, Hoa!'
    })

    const errorRes = await app.fetch(new Request('http://localhost/error'))
    expect(errorRes.status).toBe(400)
    expect(await errorRes.json()).toEqual({
      code: 400,
      message: 'error!!!'
    })

    const headRes = await app.fetch(new Request('http://localhost/empty', { method: 'HEAD' }))
    expect(headRes.status).toBe(201)

    const optionsRes = await app.fetch(new Request('http://localhost/empty', { method: 'OPTIONS' }))
    expect(optionsRes.status).toBe(202)
  })

  it('options.status -> function (default status is 404)', async () => {
    const app = new Hoa()
    app.use(json())
    app.use(async (ctx, next) => {
      if (ctx.req.pathname === '/') {
        ctx.res.body = 'Hello, Hoa!'
        return
      }
      if (ctx.req.pathname === '/error') {
        throw new Error('error!!!')
      }
      if (ctx.req.pathname === '/throw') {
        ctx.throw(400, 'ctx.throw!!!')
      }
      await next()
    })

    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      code: 200,
      data: 'Hello, Hoa!'
    })

    const errorRes = await app.fetch(new Request('http://localhost/error'))
    expect(errorRes.status).toBe(500)
    expect(await errorRes.json()).toEqual({
      code: 500,
      message: statusTextMapping[500]
    })

    const throwRes = await app.fetch(new Request('http://localhost/throw'))
    expect(throwRes.status).toBe(400)
    expect(await throwRes.json()).toEqual({
      code: 400,
      message: 'ctx.throw!!!'
    })
  })

  it('options.status -> 200', async () => {
    const app = new Hoa()
    app.use(json({ status: 200 }))
    app.use(async (ctx, next) => {
      if (ctx.req.pathname === '/') {
        ctx.res.status = 201
        ctx.res.body = 'Hello, Hoa!'
        return
      }
      if (ctx.req.pathname === '/error') {
        throw new Error('error!!!')
      }
      if (ctx.req.pathname === '/throw') {
        ctx.throw(400, 'ctx.throw!!!')
      }
      await next()
    })

    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      code: 201,
      data: 'Hello, Hoa!'
    })

    const errorRes = await app.fetch(new Request('http://localhost/error'))
    expect(errorRes.status).toBe(200)
    expect(await errorRes.json()).toEqual({
      code: 500,
      message: statusTextMapping[500]
    })

    const throwRes2 = await app.fetch(new Request('http://localhost/throw'))
    expect(throwRes2.status).toBe(200)
    expect(await throwRes2.json()).toEqual({
      code: 400,
      message: 'ctx.throw!!!'
    })
  })

  it('options.success -> function (default status is 404)', async () => {
    const app = new Hoa()
    app.use(json({
      success: {
        code: () => 204,
        data: () => 'No content'
      }
    }))
    app.use(async (ctx, next) => {
      if (ctx.req.pathname === '/') {
        return
      }
      await next()
    })

    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      code: 204,
      data: 'No content'
    })
  })

  it('options.success -> text (default status is 404)', async () => {
    const app = new Hoa()
    app.use(json({
      success: {
        code: 204,
        data: 'No content'
      }
    }))
    app.use(async (ctx, next) => {
      if (ctx.req.pathname === '/') {
        return
      }
      await next()
    })

    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      code: 204,
      data: 'No content'
    })
  })

  it('options.fail -> function', async () => {
    const app = new Hoa()
    app.use(json({
      fail: {
        code: () => 410,
        data: () => 'Gone'
      }
    }))
    app.use(async (ctx, next) => {
      if (ctx.req.pathname === '/error') {
        ctx.throw(400, 'error!!!')
      }
      await next()
    })

    const res = await app.fetch(new Request('http://localhost/error'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      code: 410,
      data: 'Gone'
    })
  })

  it('options.fail -> text', async () => {
    const app = new Hoa()
    app.use(json({
      fail: {
        code: 410,
        data: 'Gone'
      }
    }))
    app.use(async (ctx, next) => {
      if (ctx.req.pathname === '/error') {
        ctx.throw(400, 'error!!!')
      }
      await next()
    })

    const res = await app.fetch(new Request('http://localhost/error'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      code: 410,
      data: 'Gone'
    })
  })

  it('404', async () => {
    const app = new Hoa()
    app.use(json())
    app.use(async (ctx, next) => {
      if (ctx.req.pathname === '/') {
        ctx.res.body = 'Hello, Hoa!'
        return
      }
      await next()
    })

    const res = await app.fetch(new Request('http://localhost/404'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      code: 404,
      data: null
    })
  })

  it('error headers merge', async () => {
    const app = new Hoa()
    app.use(json())
    app.use(async (ctx) => {
      if (ctx.req.pathname === '/error-headers') {
        ctx.throw(418, { message: "I'm a teapot", headers: { 'x-error-id': 'abc123' } })
      }
    })

    const res = await app.fetch(new Request('http://localhost/error-headers'))
    expect(res.status).toBe(418)
    expect(res.headers.get('x-error-id')).toBe('abc123')
    expect(await res.json()).toEqual({
      code: 418,
      message: "I'm a teapot"
    })
  })

  it('error without message property', async () => {
    const app = new Hoa()
    app.use(json())
    app.use(async (ctx) => {
      if (ctx.req.pathname === '/error-no-message') {
        const err = new Error()
        err.message = ''
        err.status = 503
        throw err
      }
    })

    const res = await app.fetch(new Request('http://localhost/error-no-message'))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({
      code: 503,
      message: statusTextMapping[503]
    })
  })

  it('options.expose -> true (exposes all error messages globally)', async () => {
    const app = new Hoa()
    app.use(json({ expose: true }))
    app.use(async (ctx) => {
      if (ctx.req.pathname === '/error') {
        throw new Error('plain error message')
      }
    })

    const res = await app.fetch(new Request('http://localhost/error'))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      code: 500,
      message: 'plain error message'
    })
  })

  it('options.expose -> true, e.expose = false overrides per-error', async () => {
    const app = new Hoa()
    app.use(json({ expose: true }))
    app.use(async (ctx) => {
      if (ctx.req.pathname === '/error') {
        const err = new Error('secret message')
        err.status = 403
        err.expose = false
        throw err
      }
    })

    const res = await app.fetch(new Request('http://localhost/error'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      code: 403,
      message: statusTextMapping[403]
    })
  })

  it('ctx._raw success skips formatting', async () => {
    const app = new Hoa()
    app.use(json())
    app.use(async (ctx) => {
      if (ctx.req.pathname === '/raw') {
        ctx._raw = true
        ctx.res.status = 200
        ctx.res.body = { ok: true }
      }
    })

    const res = await app.fetch(new Request('http://localhost/raw'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('ctx._raw error rethrows, default error handler responds as text', async () => {
    const app = new Hoa()
    app.use(json())
    app.use(async (ctx) => {
      if (ctx.req.pathname === '/raw-error') {
        ctx._raw = true
        ctx.throw(418, { message: "I'm a teapot", headers: { 'x-error-id': 'raw123' } })
      }
    })

    const res = await app.fetch(new Request('http://localhost/raw-error'))
    expect(res.status).toBe(418)
    expect(res.headers.get('x-error-id')).toBe('raw123')
    expect(await res.text()).toBe("I'm a teapot")
  })
})

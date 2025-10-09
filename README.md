## @hoajs/json

JSON response formatting middleware for Hoa.

## Installation

```bash
$ npm i @hoajs/json --save
```

## Quick Start

```js
import { Hoa } from 'hoa'
import { json } from '@hoajs/json'

const app = new Hoa()
app.use(json())

app.use(async (ctx) => {
  ctx.res.body = 'Hello, Hoa!'
})

export default app
```

Response:

```js
{
  code: 200,
  data: 'Hello, Hoa!'
}
```

## Documentation

The documentation is available on [hoa-js.com](https://hoa-js.com/middleware/json.html)

## Test (100% coverage)

```sh
$ npm test
```

## License

MIT

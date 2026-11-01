# @reuse-sh/core

Small utilities shared by the Reuse packages: copying text to the clipboard and escaping HTML. Other @reuse-sh packages install it as a dependency, so you rarely need it directly.

## Install

```sh
npm install @reuse-sh/core
```

## Usage

```js
import { copyText } from "@reuse-sh/core/clipboard";
import { escapeHtml } from "@reuse-sh/core/escape-html";

const copied = await copyText("npm install @reuse-sh/carousel");
element.innerHTML = `<strong>${escapeHtml(userName)}</strong>`;
```

`copyText` resolves to `true` when the text was copied and `false` otherwise.

## Documentation

https://reuse.sh

## License

MIT

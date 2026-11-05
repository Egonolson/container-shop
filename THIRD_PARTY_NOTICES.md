# Third-party notices

## shadcn/ui shared Tailwind styles

`storefront/src/app/globals.css` includes the unchanged contents of the installed
`shadcn@3.8.5/dist/tailwind.css` (SHA-256 `146941ac3ff65496fdf1cb306e697255328e4dadc7c105d66e36bb031b00f6d6`).
The unused CLI dependency was removed using the official CSS ejection approach.
Future shared-style updates must be synchronized deliberately; no product component was removed.

Source: https://github.com/shadcn-ui/ui/tree/shadcn%403.8.5/packages/shadcn
Official ejection documentation: https://ui.shadcn.com/docs/changelog/2026-05-shadcn-eject
License copied from the actual installed package `shadcn@3.8.5/LICENSE.md`:

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

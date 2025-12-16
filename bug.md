# Known Bugs

- [x] `apps/web`: `ClientRouter` (View Transitions) fails to build with `Expected "from" but found "{"` in esbuild. Fixed by removing incorrect `esbuild` exclude config in `astro.config.mjs`.
- [x] `apps/api`: `FileController` upload used placeholder user ID. Fixed.
- [x] `apps/api`: `FileService` filename mismatch (DB vs Storage). Fixed.

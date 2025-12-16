# Known Bugs

- `apps/web`: `ClientRouter` (View Transitions) fails to build with `Expected "from" but found "{"` in esbuild. Likely an issue with Astro 5 beta/preview version.
- [x] `apps/api`: `FileController` upload used placeholder user ID. Fixed.
- [x] `apps/api`: `FileService` filename mismatch (DB vs Storage). Fixed.

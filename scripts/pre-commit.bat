@echo off
REM Pre-commit hook untuk Windows

echo Running pre-commit validation...

REM Cek apakah ada perubahan di file TypeScript/JavaScript
git diff --cached --name-only --diff-filter=ACMR | findstr /i "\.ts$ \.tsx$ \.js$ \.jsx$" > nul
if %errorlevel% == 0 (
  echo 🔍 Running linting...
  pnpm lint:fix
  if %errorlevel% neq 0 (
    echo ❌ ESLint errors found. Please fix them before committing.
    exit /b 1
  )
)

REM Cek apakah ada perubahan di file JSON, CSS, HTML
git diff --cached --name-only --diff-filter=ACMR | findstr /i "\.json$ \.css$ \.html$ \.md$" > nul
if %errorlevel% == 0 (
  echo 🧹 Running prettier...
  pnpm format
  if %errorlevel% neq 0 (
    echo ❌ Prettier errors found. Please fix them before committing.
    exit /b 1
  )
)

REM Cek apakah ada perubahan di file TypeScript/JavaScript untuk type checking
git diff --cached --name-only --diff-filter=ACMR | findstr /i "\.ts$ \.tsx$" > nul
if %errorlevel% == 0 (
  echo 🔍 Running type checking...
  pnpm typecheck
  if %errorlevel% neq 0 (
    echo ❌ Type checking errors found. Please fix them before committing.
    exit /b 1
  )
)

echo 🧪 Running quick tests...
pnpm test:quick
if %errorlevel% neq 0 (
  echo ❌ Tests failed. Please fix them before committing.
  exit /b 1
)

echo ✅ Pre-commit validation successful!

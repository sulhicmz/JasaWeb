@echo off
REM JasaWeb Development Environment Setup Script for Windows
REM This script sets up a complete development environment for JasaWeb

setlocal enabledelayedexpansion

REM Colors for Windows console
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Helper functions
:print_header
echo %BLUE%🚀 JasaWeb Development Environment Setup%NC%
echo %BLUE%=============================================%NC%
echo.
goto :eof

:print_success
echo %GREEN%✅ %~1%NC%
goto :eof

:print_error
echo %RED%❌ %~1%NC%
goto :eof

:print_warning
echo %YELLOW%⚠️  %~1%NC%
goto :eof

:print_info
echo %BLUE%ℹ️  %~1%NC%
goto :eof

REM Check if command exists
:check_command
where %1 >nul 2>&1
goto :eof

REM Main setup starts here
call :print_header

REM Check if we're in the right directory
if not exist "package.json" (
    call :print_error "Please run this script from the JasaWeb root directory"
    pause
    exit /b 1
)

if not exist "apps" (
    call :print_error "Please run this script from the JasaWeb root directory"
    pause
    exit /b 1
)

REM Check system requirements
call :print_info "Checking system requirements..."

REM Check Node.js
call :check_command node
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    call :print_success "Node.js found: !NODE_VERSION!"
    
    REM Extract major version
    for /f "tokens=2 delims=v." %%a in ("!NODE_VERSION!") do set NODE_MAJOR=%%a
    if !NODE_MAJOR! geq 20 (
        call :print_success "Node.js version is compatible (20+)"
    ) else (
        call :print_error "Node.js version 20+ is required. Current: !NODE_VERSION!"
        call :print_info "Please install Node.js 20+ from https://nodejs.org/"
        pause
        exit /b 1
    )
) else (
    call :print_error "Node.js not found"
    call :print_info "Please install Node.js 20+ from https://nodejs.org/"
    pause
    exit /b 1
)

REM Check pnpm
call :check_command pnpm
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    call :print_success "pnpm found: !PNPM_VERSION!"
) else (
    call :print_warning "pnpm not found, enabling corepack..."
    call corepack enable
    call :check_command pnpm
    if %errorlevel% equ 0 (
        call :print_success "pnpm enabled via corepack"
    ) else (
        call :print_error "Failed to enable pnpm"
        pause
        exit /b 1
    )
)

REM Check Docker
call :check_command docker
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    call :print_success "Docker found: !DOCKER_VERSION!"
) else (
    call :print_warning "Docker not found. Some features may not work."
    call :print_info "Install Docker from https://docker.com/"
)

REM Check Docker Compose
call :check_command docker-compose
if %errorlevel% equ 0 (
    call :print_success "Docker Compose found"
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        call :print_success "Docker Compose found"
    ) else (
        call :print_warning "Docker Compose not found. Database setup may fail."
    )
)

REM Check Git
call :check_command git
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    call :print_success "Git found: !GIT_VERSION!"
) else (
    call :print_error "Git not found"
    call :print_info "Please install Git from https://git-scm.com/"
    pause
    exit /b 1
)

REM Setup environment files
call :print_info "Setting up environment files..."

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        call :print_success "Created .env from .env.example"
        call :print_warning "Please edit .env with your configuration"
    ) else (
        call :print_error ".env.example not found"
    )
) else (
    call :print_info ".env already exists"
)

if not exist "apps\api\.env" (
    if exist "apps\api\.env.example" (
        copy "apps\api\.env.example" "apps\api\.env" >nul
        call :print_success "Created apps\api\.env from .env.example"
    ) else (
        call :print_warning "apps\api\.env.example not found"
    )
) else (
    call :print_info "apps\api\.env already exists"
)

if not exist "apps\web\.env" (
    if exist "apps\web\.env.example" (
        copy "apps\web\.env.example" "apps\web\.env" >nul
        call :print_success "Created apps\web\.env from .env.example"
    ) else (
        call :print_warning "apps\web\.env.example not found"
    )
) else (
    call :print_info "apps\web\.env already exists"
)

REM Install dependencies
call :print_info "Installing dependencies..."
pnpm install
if %errorlevel% neq 0 (
    call :print_error "Failed to install dependencies"
    pause
    exit /b 1
)
call :print_success "Dependencies installed successfully"

REM Setup database
call :print_info "Setting up database..."
call :check_command docker-compose
if %errorlevel% equ 0 (
    call :print_info "Starting database services..."
    docker-compose up -d
    if %errorlevel% neq 0 (
        call :print_error "Failed to start database services"
        pause
        exit /b 1
    )
    call :print_success "Database services started"
    
    REM Wait for database to be ready
    call :print_info "Waiting for database to be ready..."
    timeout /t 10 /nobreak >nul
    
    REM Run migrations
    call :print_info "Running database migrations..."
    pnpm db:migrate
    if %errorlevel% neq 0 (
        call :print_warning "Database migrations failed, you may need to run them manually"
    ) else (
        call :print_success "Database migrations completed"
    )
    
    REM Ask about seeding database
    set /p seed_db="Do you want to seed the database with sample data? (y/N): "
    if /i "!seed_db!"=="y" (
        call :print_info "Seeding database..."
        pnpm db:seed
        if %errorlevel% neq 0 (
            call :print_warning "Database seeding failed"
        ) else (
            call :print_success "Database seeded successfully"
        )
    )
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        call :print_info "Starting database services..."
        docker compose up -d
        if %errorlevel% neq 0 (
            call :print_error "Failed to start database services"
            pause
            exit /b 1
        )
        call :print_success "Database services started"
        
        REM Wait for database to be ready
        call :print_info "Waiting for database to be ready..."
        timeout /t 10 /nobreak >nul
        
        REM Run migrations
        call :print_info "Running database migrations..."
        pnpm db:migrate
        if %errorlevel% neq 0 (
            call :print_warning "Database migrations failed, you may need to run them manually"
        ) else (
            call :print_success "Database migrations completed"
        )
        
        REM Ask about seeding database
        set /p seed_db="Do you want to seed the database with sample data? (y/N): "
        if /i "!seed_db!"=="y" (
            call :print_info "Seeding database..."
            pnpm db:seed
            if %errorlevel% neq 0 (
                call :print_warning "Database seeding failed"
            ) else (
                call :print_success "Database seeded successfully"
            )
        )
    ) else (
        call :print_warning "Docker Compose not available. Please setup database manually."
        call :print_info "See README.md for database setup instructions."
    )
)

REM Build applications
call :print_info "Building applications..."
pnpm build
if %errorlevel% neq 0 (
    call :print_error "Build failed"
    pause
    exit /b 1
)
call :print_success "Applications built successfully"

REM Run tests
call :print_info "Running tests..."
pnpm test:run
if %errorlevel% neq 0 (
    call :print_warning "Some tests failed. Check the output above."
) else (
    call :print_success "All tests passed"
)

REM Setup Git hooks (Windows doesn't support Unix shebang scripts easily)
call :print_info "Git hooks setup skipped on Windows (manual setup required)"
call :print_info "See .github\REVIEW_GUIDELINES.md for manual hook setup"

REM Print next steps
echo.
call :print_success "🎉 Development environment setup complete!"
echo.
echo %BLUE%Next Steps:%NC%
echo 1. Review and update environment files:
echo    - .env
echo    - apps\api\.env
echo    - apps\web\.env
echo.
echo 2. Start development servers:
echo    %YELLOW%pnpm dev%NC%                    # Start all applications
echo    %YELLOW%pnpm dev:web%NC%                # Start web application only
echo    %YELLOW%pnpm dev:api%NC%                # Start API only
echo.
echo 3. Access applications:
echo    - Web: http://localhost:4321
echo    - API: http://localhost:3000
echo    - API Docs: http://localhost:3000/api/docs
echo.
echo 4. Useful commands:
echo    %YELLOW%pnpm test%NC%                   # Run tests
echo    %YELLOW%pnpm lint%NC%                   # Run linter
echo    %YELLOW%pnpm build%NC%                  # Build for production
echo    %YELLOW%pnpm db:studio%NC%              # Open Prisma Studio
echo.
echo 5. Database management:
echo    %YELLOW%pnpm db:migrate%NC%             # Run migrations
echo    %YELLOW%pnpm db:generate%NC%            # Generate Prisma client
echo    %YELLOW%pnpm db:seed%NC%                # Seed database
echo.
echo %GREEN%Happy coding! 🚀%NC%

pause
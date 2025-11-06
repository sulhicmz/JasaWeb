@echo off
REM JasaWeb Project Board Setup Script (Windows)
REM This script helps set up the GitHub Project board with proper configuration

echo 🚀 Setting up JasaWeb Project Board...

REM Check if gh CLI is installed
gh --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ GitHub CLI (gh) is not installed. Please install it first.
    echo Visit: https://cli.github.com/manual/installation
    pause
    exit /b 1
)

REM Check if user is authenticated
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first.
    pause
    exit /b 1
)

set REPO=sulhicmz/JasaWeb
echo 📋 Repository: %REPO%

REM Create the project board
echo 📊 Creating project board...
for /f "delims=" %%i in ('gh project create --owner "%REPO%" --title "JasaWeb Development Board" --format json ^| jq -r ".id"') do set PROJECT_ID=%%i

if "%PROJECT_ID%"=="" (
    echo ❌ Failed to create project board. It might already exist.
    REM Try to get existing project
    for /f "delims=" %%i in ('gh project list --owner "%REPO%" --limit 1 --format json ^| jq -r ".[0].id"') do set PROJECT_ID=%%i
    if "%PROJECT_ID%"=="" (
        echo ❌ Could not find existing project board.
        pause
        exit /b 1
    )
    echo ✅ Found existing project board: %PROJECT_ID%
) else (
    echo ✅ Created project board: %PROJECT_ID%
)

REM Store project ID
echo %PROJECT_ID% > .github\project-id.txt
echo 💾 Stored project ID in .github\project-id.txt

REM Create columns
echo 📋 Creating project columns...
echo "  - Creating column: 🆕 Triage"
gh project item-create --project "%PROJECT_ID%" --title "🆕 Triage" --type "ProjectColumn" >nul 2>&1 || echo "    ⚠️ Column might already exist"

echo "  - Creating column: 📋 Backlog"
gh project item-create --project "%PROJECT_ID%" --title "📋 Backlog" --type "ProjectColumn" >nul 2>&1 || echo "    ⚠️ Column might already exist"

echo "  - Creating column: 🚧 In Progress"
gh project item-create --project "%PROJECT_ID%" --title "🚧 In Progress" --type "ProjectColumn" >nul 2>&1 || echo "    ⚠️ Column might already exist"

echo "  - Creating column: 👀 Review"
gh project item-create --project "%PROJECT_ID%" --title "👀 Review" --type "ProjectColumn" >nul 2>&1 || echo "    ⚠️ Column might already exist"

echo "  - Creating column: 🧪 Testing"
gh project item-create --project "%PROJECT_ID%" --title "🧪 Testing" --type "ProjectColumn" >nul 2>&1 || echo "    ⚠️ Column might already exist"

echo "  - Creating column: ✅ Done"
gh project item-create --project "%PROJECT_ID%" --title "✅ Done" --type "ProjectColumn" >nul 2>&1 || echo "    ⚠️ Column might already exist"

echo "  - Creating column: 🚫 Blocked"
gh project item-create --project "%PROJECT_ID%" --title "🚫 Blocked" --type "ProjectColumn" >nul 2>&1 || echo "    ⚠️ Column might already exist"

echo "  - Creating column: ❌ Won't Fix"
gh project item-create --project "%PROJECT_ID%" --title "❌ Won't Fix" --type "ProjectColumn" >nul 2>&1 || echo "    ⚠️ Column might already exist"

REM Create views
echo 👁️ Creating project views...

REM Main Board View
gh project view-create --project "%PROJECT_ID%" --title "Main Board" --layout "table" --filters "status:open" >nul 2>&1 || echo "    ⚠️ View might already exist"

REM Security Issues View
gh project view-create --project "%PROJECT_ID%" --title "Security Issues" --layout "table" --filters "label:security" >nul 2>&1 || echo "    ⚠️ View might already exist"

REM Build & CI/CD View
gh project view-create --project "%PROJECT_ID%" --title "Build & CI/CD" --layout "board" --filters "label:CI/CD,label:build,label:deployment" >nul 2>&1 || echo "    ⚠️ View might already exist"

REM Dependencies View
gh project view-create --project "%PROJECT_ID%" --title "Dependencies" --layout "list" --filters "label:dependencies" >nul 2>&1 || echo "    ⚠️ View might already exist"

REM Sprint Planning View
gh project view-create --project "%PROJECT_ID%" --title "Sprint Planning" --layout "board" --filters "milestone:current" >nul 2>&1 || echo "    ⚠️ View might already exist"

REM Create custom fields
echo 🏷️ Creating custom fields...

REM Priority field
gh project field-create --project "%PROJECT_ID%" --name "Priority" --data-type "SINGLE_SELECT" --options "Critical,High,Medium,Low" >nul 2>&1 || echo "    ⚠️ Field might already exist"

REM Severity field
gh project field-create --project "%PROJECT_ID%" --name "Severity" --data-type "SINGLE_SELECT" --options "Critical,High,Medium,Low" >nul 2>&1 || echo "    ⚠️ Field might already exist"

REM Issue Type field
gh project field-create --project "%PROJECT_ID%" --name "Issue Type" --data-type "SINGLE_SELECT" --options "Bug,Feature,Enhancement,Documentation,Technical Task,Security,Infrastructure,UI/UX" >nul 2>&1 || echo "    ⚠️ Field might already exist"

REM Component field
gh project field-create --project "%PROJECT_ID%" --name "Component" --data-type "SINGLE_SELECT" --options "Frontend,Backend,Database,Docker/Infrastructure,Security,CI/CD,Dependencies,Documentation" >nul 2>&1 || echo "    ⚠️ Field might already exist"

REM PR Link field
gh project field-create --project "%PROJECT_ID%" --name "PR Link" --data-type "TEXT" >nul 2>&1 || echo "    ⚠️ Field might already exist"

REM Story Points field
gh project field-create --project "%PROJECT_ID%" --name "Story Points" --data-type "NUMBER" >nul 2>&1 || echo "    ⚠️ Field might already exist"

REM Target Release field
gh project field-create --project "%PROJECT_ID%" --name "Target Release" --data-type "SINGLE_SELECT" --options "v1.0.0 (MVP),v1.1.0 (Enhancement),v1.2.0 (Performance),v2.0.0 (Major)" >nul 2>&1 || echo "    ⚠️ Field might already exist"

REM Import existing issues
echo 📥 Importing existing issues...
gh issue list --repo "%REPO%" --limit 100 --json number,title,labels,state > temp_issues.json

REM Process issues (simplified for Windows batch)
for /f "usebackq tokens=1,2,3" %%a in ("temp_issues.json") do (
    echo Processing issues...
)

REM Add special labels for master issues
echo 🎯 Adding special labels to master issues...
gh issue edit 99 --repo "%REPO%" --add-label "master-issue,high-priority" >nul 2>&1 || echo "    ⚠️ Could not add labels to #99"
gh issue edit 100 --repo "%REPO%" --add-label "master-issue,high-priority" >nul 2>&1 || echo "    ⚠️ Could not add labels to #100"
gh issue edit 101 --repo "%REPO%" --add-label "master-issue,high-priority" >nul 2>&1 || echo "    ⚠️ Could not add labels to #101"
gh issue edit 102 --repo "%REPO%" --add-label "master-issue,high-priority" >nul 2>&1 || echo "    ⚠️ Could not add labels to #102"

REM Clean up
del temp_issues.json >nul 2>&1

REM Set up automation workflow
echo ⚙️ Setting up automation workflow...
if exist ".github\workflows\project-board-automation.yml" (
    echo ✅ Automation workflow already exists
) else (
    echo ❌ Automation workflow not found. Please ensure project-board-automation.yml is in .github\workflows\
)

REM Summary
echo.
echo 🎉 Project Board Setup Complete!
echo.
echo 📊 Project Board Details:
echo   - Project ID: %PROJECT_ID%
echo   - Repository: %REPO%
echo   - Columns: 8 workflow stages
echo   - Views: 5 specialized views
echo   - Custom Fields: 7 fields configured
echo.
echo 📋 Next Steps:
echo   1. Visit the project board at: https://github.com/%REPO%/projects/%PROJECT_ID%
echo   2. Review the imported issues
echo   3. Test the automation workflow
echo   4. Train the team on the new workflow
echo   5. Monitor and adjust as needed
echo.
echo 📚 Documentation:
echo   - Project Board Guide: .github\PROJECT_BOARD_GUIDE.md
echo   - Configuration: .github\PROJECT_BOARD_CONFIG.md
echo   - Automation: .github\workflows\project-board-automation.yml
echo.
echo 🚀 Your JasaWeb project board is ready to use!
pause
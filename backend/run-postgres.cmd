@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0..\.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0..\.env") do set "%%A=%%B"
)
echo Starting SudokuMind backend with PostgreSQL profile on http://localhost:8080
echo Requires PostgreSQL credentials from application.yml or environment variables.
call .\mvnw.cmd spring-boot:run

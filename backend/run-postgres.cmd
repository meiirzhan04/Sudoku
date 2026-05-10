@echo off
setlocal
cd /d "%~dp0"
echo Starting SudokuMind backend with PostgreSQL profile on http://localhost:8080
echo Requires PostgreSQL credentials from application.yml or environment variables.
call .\mvnw.cmd spring-boot:run

@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0..\.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0..\.env") do set "%%A=%%B"
)
echo Starting SudokuMind backend with local H2 profile on http://localhost:8080
echo If port 8080 is busy, stop the old Java process first.
call .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local

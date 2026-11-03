@echo off
cd /d "%~dp0"
set "LMR_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
where node >nul 2>nul
if not errorlevel 1 set "LMR_NODE=node"
echo lmr: http://127.0.0.1:4173
echo Keep this window open while using the website.
"%LMR_NODE%" server.mjs
pause

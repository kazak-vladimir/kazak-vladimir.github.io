@echo off
rem Refreshes the post list from the PDFs in writing\ and opens the site.
cd /d "%~dp0"
py build.py >nul 2>&1 || python build.py >nul 2>&1
if errorlevel 1 (
  echo Python is not installed, so new PDFs will not be listed. Get it from https://www.python.org/downloads/
  pause
)
start "" "%~dp0index.html"

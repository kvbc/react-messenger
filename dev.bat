SET title = react-messenger
FOR %%d IN (frontend backend shared) DO START %title%-%%d /D %%d /MIN CMD /K START "" /MIN CMD /C "npm run dev"
PAUSE
TASKKILL /T /F /FI "WINDOWTITLE eq %title%*"
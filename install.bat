@ECHO OFF
FOR %%d IN (shared backend frontend) DO CD %%d & npm run install-link & CD ..
@ECHO OFF
FOR %%d IN (shared frontend backend) DO CD %%d & npm run install-link & CD ..
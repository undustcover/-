@echo off
echo PostgreSQL密码重置工具
echo ========================
echo.
echo 此脚本将帮助您重置PostgreSQL的postgres用户密码
echo.
echo 步骤1: 停止PostgreSQL服务
net stop postgresql-x64-17
echo.
echo 步骤2: 备份pg_hba.conf文件
copy "C:\Program Files\PostgreSQL\17\data\pg_hba.conf" "C:\Program Files\PostgreSQL\17\data\pg_hba.conf.backup"
echo.
echo 步骤3: 修改认证方式为trust（临时）
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD > "C:\Program Files\PostgreSQL\17\data\pg_hba_temp.conf"
echo local   all             postgres                                trust >> "C:\Program Files\PostgreSQL\17\data\pg_hba_temp.conf"
echo host    all             all             127.0.0.1/32            trust >> "C:\Program Files\PostgreSQL\17\data\pg_hba_temp.conf"
echo host    all             all             ::1/128                 trust >> "C:\Program Files\PostgreSQL\17\data\pg_hba_temp.conf"
copy "C:\Program Files\PostgreSQL\17\data\pg_hba_temp.conf" "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
echo.
echo 步骤4: 启动PostgreSQL服务
net start postgresql-x64-17
echo.
echo 步骤5: 重置密码
set /p newpassword=请输入新密码: 
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD '%newpassword%';"
echo.
echo 步骤6: 恢复原始认证配置
copy "C:\Program Files\PostgreSQL\17\data\pg_hba.conf.backup" "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
echo.
echo 步骤7: 重启服务
net stop postgresql-x64-17
net start postgresql-x64-17
echo.
echo 密码重置完成！新密码为: %newpassword%
echo 请将此密码更新到.env文件中的DB_PASSWORD
pause
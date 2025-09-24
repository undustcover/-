@echo off
chcp 65001 >nul
echo ========================================
echo PostgreSQL密码重置工具
echo ========================================
echo.
echo 注意：此工具需要管理员权限运行
echo 如果出现权限错误，请右键选择"以管理员身份运行"
echo.
pause
echo.

echo 步骤1：停止PostgreSQL服务
net stop postgresql-x64-17
if %errorlevel% neq 0 (
    echo 错误：无法停止PostgreSQL服务，请确保以管理员身份运行
    pause
    exit /b 1
)
echo PostgreSQL服务已停止
echo.

echo 步骤2：备份配置文件
set PGDATA="C:\Program Files\PostgreSQL\17\data"
if not exist %PGDATA%\pg_hba.conf (
    echo 错误：找不到PostgreSQL配置文件
    echo 请检查PostgreSQL是否正确安装在默认位置
    pause
    exit /b 1
)

copy %PGDATA%\pg_hba.conf %PGDATA%\pg_hba.conf.backup >nul
echo 配置文件已备份
echo.

echo 步骤3：修改认证配置
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD > %PGDATA%\pg_hba_temp.conf
echo local   all             postgres                                trust >> %PGDATA%\pg_hba_temp.conf
echo host    all             all             127.0.0.1/32            trust >> %PGDATA%\pg_hba_temp.conf
echo host    all             all             ::1/128                 trust >> %PGDATA%\pg_hba_temp.conf
echo host    all             all             0.0.0.0/0               trust >> %PGDATA%\pg_hba_temp.conf

copy %PGDATA%\pg_hba_temp.conf %PGDATA%\pg_hba.conf >nul
echo 认证配置已修改为trust模式
echo.

echo 步骤4：启动PostgreSQL服务
net start postgresql-x64-17
if %errorlevel% neq 0 (
    echo 错误：无法启动PostgreSQL服务
    copy %PGDATA%\pg_hba.conf.backup %PGDATA%\pg_hba.conf >nul
    pause
    exit /b 1
)
echo PostgreSQL服务已启动
echo.

echo 等待服务完全启动...
timeout /t 5 /nobreak >nul
echo.

echo 步骤5：重置密码
set /p newpass=请输入新密码（直接按Enter使用默认密码postgres123）: 
if "%newpass%"=="" set newpass=postgres123

echo 正在重置密码为: %newpass%
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD '%newpass%';"
if %errorlevel% neq 0 (
    echo 错误：密码重置失败
    copy %PGDATA%\pg_hba.conf.backup %PGDATA%\pg_hba.conf >nul
    net restart postgresql-x64-17
    pause
    exit /b 1
)
echo 密码重置成功！
echo.

echo 步骤6：恢复原始配置
copy %PGDATA%\pg_hba.conf.backup %PGDATA%\pg_hba.conf >nul
echo 原始配置已恢复
echo.

echo 步骤7：重启PostgreSQL服务
net stop postgresql-x64-17 >nul
net start postgresql-x64-17
if %errorlevel% neq 0 (
    echo 警告：服务重启失败，请手动重启PostgreSQL服务
)
echo PostgreSQL服务已重启
echo.

echo ========================================
echo 密码重置完成！
echo 新密码: %newpass%
echo ========================================
echo.
echo 请更新.env文件中的DB_PASSWORD=%newpass%
echo.

set /p update=是否自动更新.env文件？(y/n): 
if /i "%update%"=="y" (
    if exist ".env" (
        powershell -Command "(Get-Content '.env') -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=%newpass%' -replace 'DB_TYPE=.*', 'DB_TYPE=postgresql' | Set-Content '.env'"
        echo .env文件已更新
    ) else (
        echo 找不到.env文件
    )
)

echo.
echo 现在可以测试连接：
echo set PGPASSWORD=%newpass%
echo "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "SELECT version();"
echo.
pause
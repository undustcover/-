# PostgreSQL配置助手
Write-Host "PostgreSQL数据库配置助手" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

# 检查PostgreSQL服务状态
Write-Host "检查PostgreSQL服务状态..." -ForegroundColor Yellow
$service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "PostgreSQL服务状态: $($service.Status)" -ForegroundColor Cyan
    if ($service.Status -ne "Running") {
        Write-Host "启动PostgreSQL服务..." -ForegroundColor Yellow
        Start-Service $service.Name
    }
} else {
    Write-Host "未找到PostgreSQL服务！请确保PostgreSQL已正确安装。" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "尝试连接PostgreSQL数据库..." -ForegroundColor Yellow
Write-Host "请尝试以下常见密码，或输入您知道的密码：" -ForegroundColor Cyan

$commonPasswords = @("postgres", "admin", "password", "123456", "root", "")
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# 测试常见密码
foreach ($pwd in $commonPasswords) {
    Write-Host "测试密码: '$pwd'" -ForegroundColor Gray
    $env:PGPASSWORD = $pwd
    $result = & $psqlPath -U postgres -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 连接成功！密码是: '$pwd'" -ForegroundColor Green
        $correctPassword = $pwd
        break
    }
}

if (-not $correctPassword) {
    Write-Host "常见密码都不正确。" -ForegroundColor Red
    Write-Host "请手动输入密码，或按Enter跳过：" -ForegroundColor Yellow
    $userPassword = Read-Host "PostgreSQL密码"
    
    if ($userPassword) {
        $env:PGPASSWORD = $userPassword
        $result = & $psqlPath -U postgres -c "SELECT version();" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ 连接成功！" -ForegroundColor Green
            $correctPassword = $userPassword
        } else {
            Write-Host "✗ 密码仍然不正确。" -ForegroundColor Red
        }
    }
}

if ($correctPassword) {
    Write-Host ""
    Write-Host "开始配置数据库..." -ForegroundColor Yellow
    
    # 创建数据库和用户
    $env:PGPASSWORD = $correctPassword
    
    Write-Host "创建数据库 'task_management'..." -ForegroundColor Gray
    & $psqlPath -U postgres -c "CREATE DATABASE task_management;" 2>$null
    
    Write-Host "创建用户 'task_user'..." -ForegroundColor Gray
    & $psqlPath -U postgres -c "CREATE USER task_user WITH PASSWORD 'taskuser123';" 2>$null
    
    Write-Host "授予权限..." -ForegroundColor Gray
    & $psqlPath -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE task_management TO task_user;" 2>$null
    & $psqlPath -U postgres -d task_management -c "GRANT ALL ON SCHEMA public TO task_user;" 2>$null
    & $psqlPath -U postgres -d task_management -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO task_user;" 2>$null
    & $psqlPath -U postgres -d task_management -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO task_user;" 2>$null
    
    Write-Host ""
    Write-Host "✓ 数据库配置完成！" -ForegroundColor Green
    Write-Host "请更新 .env 文件中的以下配置：" -ForegroundColor Cyan
    Write-Host "DB_TYPE=postgresql" -ForegroundColor White
    Write-Host "DB_PASSWORD=$correctPassword" -ForegroundColor White
    Write-Host "DB_NAME=task_management" -ForegroundColor White
    
    # 自动更新.env文件
    $envPath = ".env"
    if (Test-Path $envPath) {
        Write-Host ""
        $updateEnv = Read-Host "是否自动更新.env文件？(y/n)"
        if ($updateEnv -eq "y" -or $updateEnv -eq "Y") {
            $envContent = Get-Content $envPath
            $envContent = $envContent -replace "DB_TYPE=.*", "DB_TYPE=postgresql"
            $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$correctPassword"
            $envContent = $envContent -replace "DB_NAME=.*", "DB_NAME=task_management"
            $envContent | Set-Content $envPath
            Write-Host "✓ .env文件已更新！" -ForegroundColor Green
        }
    }
    
} else {
    Write-Host ""
    Write-Host "无法连接到PostgreSQL。请检查：" -ForegroundColor Red
    Write-Host "1. PostgreSQL是否正确安装并运行" -ForegroundColor Yellow
    Write-Host "2. 密码是否正确" -ForegroundColor Yellow
    Write-Host "3. 是否需要重置密码" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "您可以尝试重置PostgreSQL密码：" -ForegroundColor Cyan
    Write-Host "1. 以管理员身份运行: reset-postgresql-password.bat" -ForegroundColor White
    Write-Host "2. 或参考 setup-postgresql.md 文档" -ForegroundColor White
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
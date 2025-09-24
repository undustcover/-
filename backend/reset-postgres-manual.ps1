# PostgreSQL密码重置脚本
Write-Host "PostgreSQL密码重置工具" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""

# 检查是否以管理员身份运行
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "错误: 此脚本需要管理员权限运行" -ForegroundColor Red
    Write-Host "请右键点击PowerShell并选择'以管理员身份运行'" -ForegroundColor Yellow
    Read-Host "按Enter键退出"
    exit 1
}

$pgDataPath = "C:\Program Files\PostgreSQL\17\data"
$pgHbaPath = "$pgDataPath\pg_hba.conf"
$pgHbaBackup = "$pgDataPath\pg_hba.conf.backup"

Write-Host "步骤1: 停止PostgreSQL服务" -ForegroundColor Yellow
try {
    Stop-Service "postgresql-x64-17" -Force
    Write-Host "✓ PostgreSQL服务已停止" -ForegroundColor Green
} catch {
    Write-Host "✗ 停止服务失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤2: 备份pg_hba.conf文件" -ForegroundColor Yellow
try {
    if (Test-Path $pgHbaPath) {
        Copy-Item $pgHbaPath $pgHbaBackup -Force
        Write-Host "✓ 配置文件已备份" -ForegroundColor Green
    } else {
        Write-Host "✗ 找不到pg_hba.conf文件" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ 备份失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤3: 修改认证配置为trust模式" -ForegroundColor Yellow
try {
    $trustConfig = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
host    all             all             0.0.0.0/0               trust
"@
    $trustConfig | Out-File -FilePath $pgHbaPath -Encoding UTF8
    Write-Host "✓ 配置已修改为trust模式" -ForegroundColor Green
} catch {
    Write-Host "✗ 修改配置失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤4: 启动PostgreSQL服务" -ForegroundColor Yellow
try {
    Start-Service "postgresql-x64-17"
    Start-Sleep -Seconds 3
    Write-Host "✓ PostgreSQL服务已启动" -ForegroundColor Green
} catch {
    Write-Host "✗ 启动服务失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤5: 重置postgres用户密码" -ForegroundColor Yellow
$newPassword = Read-Host "请输入新密码"
if (-not $newPassword) {
    $newPassword = "postgres123"
    Write-Host "使用默认密码: postgres123" -ForegroundColor Cyan
}

try {
    $psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    & $psqlPath -U postgres -c "ALTER USER postgres PASSWORD '$newPassword';"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 密码重置成功" -ForegroundColor Green
    } else {
        Write-Host "✗ 密码重置失败" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ 密码重置失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤6: 恢复原始配置" -ForegroundColor Yellow
try {
    Copy-Item $pgHbaBackup $pgHbaPath -Force
    Write-Host "✓ 原始配置已恢复" -ForegroundColor Green
} catch {
    Write-Host "✗ 恢复配置失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "步骤7: 重启PostgreSQL服务" -ForegroundColor Yellow
try {
    Restart-Service "postgresql-x64-17"
    Start-Sleep -Seconds 3
    Write-Host "✓ PostgreSQL服务已重启" -ForegroundColor Green
} catch {
    Write-Host "✗ 重启服务失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✓ PostgreSQL密码重置完成！" -ForegroundColor Green
Write-Host "新密码: $newPassword" -ForegroundColor Cyan
Write-Host ""
Write-Host "请更新.env文件中的DB_PASSWORD=$newPassword" -ForegroundColor Yellow

# 询问是否自动更新.env文件
$updateEnv = Read-Host "是否自动更新.env文件？(y/n)"
if ($updateEnv -eq "y" -or $updateEnv -eq "Y") {
    try {
        $envPath = ".env"
        if (Test-Path $envPath) {
            $envContent = Get-Content $envPath
            $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$newPassword"
            $envContent = $envContent -replace "DB_TYPE=.*", "DB_TYPE=postgresql"
            $envContent | Set-Content $envPath
            Write-Host "✓ .env文件已更新" -ForegroundColor Green
        } else {
            Write-Host "✗ 找不到.env文件" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ 更新.env文件失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "按Enter键退出"
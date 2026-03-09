param(
  [string]$OutputRoot = "",
  [switch]$KeepExpanded
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[ProxyCast Support] $Message"
}

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Get-WebView2Version {
  $keys = @(
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
    "HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
    "HKCU:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
    "HKCU:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
  )

  foreach ($key in $keys) {
    try {
      $value = (Get-ItemProperty -LiteralPath $key -Name "pv" -ErrorAction Stop).pv
      if ($value -and $value -ne "0.0.0.0") {
        return [string]$value
      }
    } catch {
    }
  }

  return $null
}

function Get-PathMetadata {
  param([string]$TargetPath)

  if (-not (Test-Path -LiteralPath $TargetPath)) {
    return [pscustomobject]@{
      path = $TargetPath
      exists = $false
      type = $null
      last_write_time = $null
      size_bytes = $null
    }
  }

  $item = Get-Item -LiteralPath $TargetPath -Force
  $size = $null
  if ($item.PSIsContainer) {
    try {
      $size = (Get-ChildItem -LiteralPath $TargetPath -Recurse -Force -File -ErrorAction Stop |
        Measure-Object -Property Length -Sum).Sum
    } catch {
      $size = $null
    }
  } else {
    $size = $item.Length
  }

  return [pscustomobject]@{
    path = $TargetPath
    exists = $true
    type = if ($item.PSIsContainer) { "directory" } else { "file" }
    last_write_time = $item.LastWriteTime.ToString("o")
    size_bytes = $size
  }
}

function Export-PathListing {
  param(
    [string]$SourcePath,
    [string]$OutputFile
  )

  if (-not (Test-Path -LiteralPath $SourcePath)) {
    "路径不存在: $SourcePath" | Set-Content -LiteralPath $OutputFile -Encoding UTF8
    return
  }

  Get-ChildItem -LiteralPath $SourcePath -Recurse -Force -ErrorAction SilentlyContinue |
    Select-Object FullName, PSIsContainer, Length, LastWriteTime |
    ConvertTo-Json -Depth 4 |
    Set-Content -LiteralPath $OutputFile -Encoding UTF8
}

function Copy-DirectoryIfExists {
  param(
    [string]$SourcePath,
    [string]$DestinationPath
  )

  if (-not (Test-Path -LiteralPath $SourcePath)) {
    return $false
  }

  Ensure-Directory -Path (Split-Path -Parent $DestinationPath)
  Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Recurse -Force
  return $true
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$desktop = [Environment]::GetFolderPath("Desktop")
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = if ([string]::IsNullOrWhiteSpace($desktop)) { $env:TEMP } else { $desktop }
}

$bundleName = "ProxyCast-Support-$timestamp"
$bundleDir = Join-Path $OutputRoot $bundleName
$zipPath = "$bundleDir.zip"

$appDataDir = Join-Path $env:APPDATA "proxycast"
$legacyDir = Join-Path $env:USERPROFILE ".proxycast"
$configPath = Join-Path $appDataDir "config.yaml"
$dbPath = Join-Path $legacyDir "proxycast.db"
$logsDir = Join-Path $legacyDir "logs"
$requestLogsDir = Join-Path $legacyDir "request_logs"

Write-Step "输出目录: $bundleDir"
Ensure-Directory -Path $bundleDir
Ensure-Directory -Path (Join-Path $bundleDir "logs")
Ensure-Directory -Path (Join-Path $bundleDir "meta")

$systemInfo = [ordered]@{
  collected_at = (Get-Date).ToString("o")
  computer_name = $env:COMPUTERNAME
  username = $env:USERNAME
  windows_version = [System.Environment]::OSVersion.VersionString
  powershell_version = $PSVersionTable.PSVersion.ToString()
  webview2_version = Get-WebView2Version
  appdata_dir = $appDataDir
  legacy_proxycast_dir = $legacyDir
  config_path = $configPath
  database_path = $dbPath
  shell_paths = @{
    powershell = (Get-Command powershell.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue)
    pwsh = (Get-Command pwsh.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue)
    cmd = $env:ComSpec
  }
  path_checks = @(
    Get-PathMetadata -TargetPath $appDataDir
    Get-PathMetadata -TargetPath $legacyDir
    Get-PathMetadata -TargetPath $configPath
    Get-PathMetadata -TargetPath $dbPath
    Get-PathMetadata -TargetPath $logsDir
    Get-PathMetadata -TargetPath $requestLogsDir
  )
}

$systemInfo | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $bundleDir "meta/system-info.json") -Encoding UTF8

Export-PathListing -SourcePath $appDataDir -OutputFile (Join-Path $bundleDir "meta/appdata-listing.json")
Export-PathListing -SourcePath $legacyDir -OutputFile (Join-Path $bundleDir "meta/legacy-listing.json")

$copiedLogs = Copy-DirectoryIfExists -SourcePath $logsDir -DestinationPath (Join-Path $bundleDir "logs/logs")
$copiedRequestLogs = Copy-DirectoryIfExists -SourcePath $requestLogsDir -DestinationPath (Join-Path $bundleDir "logs/request_logs")

@(
  "ProxyCast 支持包已生成。",
  "",
  "已收集内容：",
  "- system-info.json（系统与路径元数据）",
  "- appdata-listing.json / legacy-listing.json（目录结构摘要）",
  "- logs/（如果存在）",
  "- request_logs/（如果存在）",
  "",
  "默认未收集内容：",
  "- config.yaml 正文（避免泄露 API Key / 凭证）",
  "- proxycast.db 正文（避免泄露会话与敏感数据）",
  "- credentials/ 目录内容",
  "",
  "是否复制 logs: $copiedLogs",
  "是否复制 request_logs: $copiedRequestLogs",
  "",
  "请将生成的 zip 文件发给支持人员。"
) | Set-Content -LiteralPath (Join-Path $bundleDir "README.txt") -Encoding UTF8

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $bundleDir -DestinationPath $zipPath -Force

if (-not $KeepExpanded) {
  Remove-Item -LiteralPath $bundleDir -Recurse -Force
}

Write-Step "支持包已生成: $zipPath"

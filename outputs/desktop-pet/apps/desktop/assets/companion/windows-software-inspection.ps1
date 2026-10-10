param([Parameter(Mandatory = $true)][string]$LiteralPath)

# 只读取选定安装文件；不启动安装包、不解包运行、不上传文件或调用信誉库。
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$maximumBytes = 256MB
# 固定系统模块，避免继承其他 PowerShell 版本的模块搜索路径造成读取失败。
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Utility\Microsoft.PowerShell.Utility.psd1')
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1')

function Ordinary-Installer {
  if ($LiteralPath -notmatch '^[A-Za-z]:\\' -or $LiteralPath.Substring(2).Contains(':')) { throw '路径不受支持。' }
  $root = [IO.Path]::GetPathRoot($LiteralPath)
  $drive = New-Object IO.DriveInfo($root)
  if ($drive.DriveType -ne [IO.DriveType]::Fixed -or !$drive.IsReady) { throw '只接受本机固定磁盘。' }
  $current = $root
  foreach ($part in $LiteralPath.Substring($root.Length).Split('\')) {
    if ([string]::IsNullOrEmpty($part) -or $part -eq '.' -or $part -eq '..') { throw '路径不受支持。' }
    $current = [IO.Path]::Combine($current, $part)
    $item = Get-Item -LiteralPath $current -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw '不读取链接或目录联接。' }
  }
  if ($item.PSIsContainer -or [IO.Path]::GetExtension($LiteralPath) -notin @('.exe', '.msi')) { throw '只接受普通 EXE/MSI。' }
  if ($item.Length -gt $maximumBytes) { throw '安装文件超过大小上限。' }
  return $item
}

function Optional-Text($value) {
  if ([string]::IsNullOrWhiteSpace([string]$value)) { return $null }
  $text = [string]$value
  if ($text.Length -gt 1024) { $text = $text.Substring(0, 1024) }
  return $text
}

function Source-Marker {
  $stream = $null
  try {
    # ADS 只读取固定 Zone.Identifier，最多 16 KiB；绝不转发完整来源 URL。
    # .NET Framework 的常规路径解析拒绝 ADS；仅对已验证的本机路径加固定扩展前缀。
    $stream = [IO.File]::Open('\\?\' + $LiteralPath + ':Zone.Identifier', [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
    if ($stream.Length -gt 16384) { return @{ zoneId = $null; sourceHost = $null } }
    $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::UTF8, $true, 1024, $true)
    try { $marker = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $zoneId = $null
    $sourceHost = $null
    $inZone = $false
    foreach ($line in $marker -split "`r?`n") {
      if ($line -match '^\s*\[([^]]+)\]\s*$') { $inZone = $Matches[1] -eq 'ZoneTransfer'; continue }
      if (!$inZone) { continue }
      if ($line -match '^ZoneId=([0-4])\s*$') { $zoneId = [int]$Matches[1] }
      if ($line -match '^HostUrl=(.+)$') {
        $uri = $null
        if ([Uri]::TryCreate($Matches[1], [UriKind]::Absolute, [ref]$uri) -and $uri.Scheme -in @('http', 'https') -and $uri.Host) {
          $hostCandidate = $uri.IdnHost.ToLowerInvariant().TrimEnd('.')
          if ($uri.HostNameType -eq [UriHostNameType]::IPv6) { $hostCandidate = '[' + $hostCandidate + ']' }
          if ($hostCandidate.Length -le 253) { $sourceHost = $hostCandidate }
        }
      }
    }
    return @{ zoneId = $zoneId; sourceHost = $sourceHost }
  } catch { return @{ zoneId = $null; sourceHost = $null } }
  finally { if ($null -ne $stream) { $stream.Dispose() } }
}

$before = Ordinary-Installer
$sizeBefore = $before.Length
$modifiedBefore = $before.LastWriteTimeUtc.Ticks.ToString()
$lockedFile = $null
try {
  # 共享只读句柄阻止写入和替换；仍在采集前后复核路径、大小、时间和内容摘要。
  $lockedFile = [IO.File]::Open($LiteralPath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
  $hashBefore = (Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash
  $versionInfo = $null
  try { $versionInfo = [Diagnostics.FileVersionInfo]::GetVersionInfo($LiteralPath) } catch { }
  $signatureStatus = 'UnknownError'
  $signer = $null
  try {
    # Windows 可能按本机策略查询证书链服务；应用不上传安装文件、不查询远程信誉库。
    $signature = Get-AuthenticodeSignature -LiteralPath $LiteralPath
    $signatureStatus = $signature.Status.ToString()
    if ($null -ne $signature.SignerCertificate) { $signer = Optional-Text $signature.SignerCertificate.Subject }
  } catch { }
  $source = Source-Marker
  $hashAfter = (Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash
  $after = Ordinary-Installer
  $modifiedAfter = $after.LastWriteTimeUtc.Ticks.ToString()
  if ($sizeBefore -ne $after.Length -or $modifiedBefore -ne $modifiedAfter -or $hashBefore -ne $hashAfter) { throw '文件在采集期间发生变化。' }
  [pscustomobject]@{
    version = 1
    checkedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    fileName = [IO.Path]::GetFileName($LiteralPath)
    sizeBytes = $sizeBefore
    sha256 = $hashBefore
    modifiedTicks = $modifiedBefore
    sizeAfterBytes = $after.Length
    sha256After = $hashAfter
    modifiedAfterTicks = $modifiedAfter
    signatureStatus = $signatureStatus
    signer = $signer
    productName = Optional-Text $versionInfo.ProductName
    publisher = Optional-Text $versionInfo.CompanyName
    fileDescription = Optional-Text $versionInfo.FileDescription
    fileVersion = Optional-Text $versionInfo.FileVersion
    productVersion = Optional-Text $versionInfo.ProductVersion
    zoneId = $source.zoneId
    sourceHost = $source.sourceHost
  } | ConvertTo-Json -Depth 4 -Compress
} finally {
  if ($null -ne $lockedFile) { $lockedFile.Dispose() }
}

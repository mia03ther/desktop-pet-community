param([string]$ManifestPath)
$ErrorActionPreference = 'Stop'

function Test-UpdateChild([string]$Parent, [string]$Child) {
  return $Child.StartsWith($Parent.TrimEnd('\') + '\', [System.StringComparison]::OrdinalIgnoreCase)
}
function Assert-UpdateDirectory([string]$Directory) {
  $cursor = [System.IO.Path]::GetFullPath($Directory)
  while ($cursor) {
    $item = Get-Item -LiteralPath $cursor -Force
    if (!$item.PSIsContainer -or ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) { throw '更新目录不能经过链接或特殊目录。' }
    $parent = [System.IO.Directory]::GetParent($cursor)
    $cursor = if ($parent) { $parent.FullName } else { $null }
  }
}
function Get-UpdateExtendedPath([string]$Path) {
  # 正式程序的依赖可能形成超过 260 字符的绝对路径；文件流使用 Windows 扩展路径。
  $absolute = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { [System.IO.Path]::GetFullPath($Path) }
  $extended = if ($absolute.StartsWith('\\?\')) { $absolute } elseif ($absolute.StartsWith('\\')) { '\\?\UNC\' + $absolute.Substring(2) } else { '\\?\' + $absolute }
  return $extended
}
function Get-UpdateFileHash([string]$Path) {
  $stream = [System.IO.File]::OpenRead((Get-UpdateExtendedPath $Path))
  $hash = [System.Security.Cryptography.SHA256]::Create()
  try { return [System.BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
  finally { $stream.Dispose(); $hash.Dispose() }
}
function Start-UpdatedDesktopPet([string]$Directory, [string]$Profile, [string]$Intent) {
  $start = New-Object System.Diagnostics.ProcessStartInfo
  $start.FileName = Join-Path $Directory 'desktop-pet.exe'
  $start.WorkingDirectory = $Directory
  $start.Arguments = '"--desktop-pet-profile-dir=' + $Profile + '" ' + $Intent
  $start.UseShellExecute = $false
  $start.EnvironmentVariables['DESKTOP_PET_PROFILE_DIR'] = $Profile
  $start.EnvironmentVariables.Remove('ELECTRON_RUN_AS_NODE')
  $process = [System.Diagnostics.Process]::Start($start)
  if (!$process) { throw '更新后的程序未能启动。' }
  Start-Sleep -Milliseconds 1500
  if ($process.HasExited) { throw '更新后的程序在启动时退出。' }
}
function Invoke-DesktopPetUpdate($Plan, [bool]$Restart = $true) {
  $install = [System.IO.Path]::GetFullPath($Plan.installDir)
  $work = [System.IO.Path]::GetFullPath($Plan.workDir)
  $stage = [System.IO.Path]::GetFullPath($Plan.stagedDir)
  $backup = [System.IO.Path]::GetFullPath($Plan.backupDir)
  $profile = [System.IO.Path]::GetFullPath($Plan.profileDir)
  if ([System.IO.Directory]::GetParent($install).FullName -ne [System.IO.Directory]::GetParent($work).FullName -or [System.IO.Path]::GetFileName($work) -notmatch '^\.desktop-pet-update-[a-zA-Z0-9]+$') { throw '更新只允许替换同父目录的本次程序。' }
  if (!(Test-UpdateChild $work $stage) -or $backup -ne (Join-Path $work 'previous-app') -or (Test-UpdateChild $install $profile) -or $profile -eq $install -or (Test-UpdateChild $work $profile)) { throw '更新目录和用户档案范围冲突。' }
  Assert-UpdateDirectory $install
  Assert-UpdateDirectory $work
  Assert-UpdateDirectory $stage
  if (Test-Path -LiteralPath $backup) { throw '已有更新备份，不能覆盖。' }
  if ($Plan.launchIntent -notin @('--open-studio', '--show-pet')) { throw '启动意图无效。' }
  $expected = @{}
  if (!$Plan.files -or $Plan.files.Count -gt 40000) { throw '更新文件清单无效。' }
  foreach ($file in $Plan.files) {
    $name = [string]$file.name
    if (!$name -or $name.Contains('\') -or $name.Contains(':') -or $name.StartsWith('/') -or $name -match '(^|/)\.{1,2}(/|$)' -or $name -match '[\x00-\x1f]' -or $file.sha256 -notmatch '^[a-f0-9]{64}$' -or $expected.ContainsKey($name)) { throw '更新文件路径或摘要无效。' }
    $expected[$name] = $file.sha256
  }
  if (!$expected.ContainsKey('desktop-pet.exe') -or !$expected.ContainsKey('resources/app.asar')) { throw '更新缺少完整程序。' }
  $stageExtended = Get-UpdateExtendedPath $stage
  $actual = @(Get-ChildItem -LiteralPath $stageExtended -Recurse -Force)
  if ($actual.Count -gt 80000) { throw '更新目录条目过多。' }
  $count = 0
  foreach ($file in $actual) {
    if ($file.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { throw '更新目录包含链接。' }
    if ($file.PSIsContainer) { continue }
    $name = $file.FullName.Substring($stageExtended.TrimEnd('\').Length + 1).Replace('\', '/')
    if (!$expected.ContainsKey($name) -or (Get-UpdateFileHash $file.FullName) -ne $expected[$name]) { throw '更新文件在准备后发生变化。' }
    $count++
  }
  if ($count -ne $expected.Count) { throw '更新文件不完整。' }
  $originalExe = Join-Path $install 'desktop-pet.exe'
  $parent = Get-Process -Id ([int]$Plan.parentProcessId) -ErrorAction SilentlyContinue
  if ($parent -and $parent.Path -ne $originalExe) { throw '等待的进程并非本次桌宠。' }
  @{ parentProcessId = $Plan.parentProcessId; ready = $true } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $work 'ready.json') -Encoding UTF8
  if ($parent) {
    try { $parent | Wait-Process -Timeout 120 } catch { if (Get-Process -Id $parent.Id -ErrorAction SilentlyContinue) { throw '桌宠仍在运行，更新未替换任何程序。' } }
  }
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    $remaining = @(Get-Process -Name 'desktop-pet' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $originalExe })
    if (!$remaining.Count) { break }
    Start-Sleep -Milliseconds 500
  }
  if ($remaining.Count) { throw '同一路径另有桌宠运行，更新未替换程序。' }
  $oldMoved = $false
  $newMoved = $false
  try {
    Move-Item -LiteralPath $install -Destination $backup
    $oldMoved = $true
    Move-Item -LiteralPath $stage -Destination $install
    $newMoved = $true
    if ($Restart) { Start-UpdatedDesktopPet $install $profile $Plan.launchIntent }
    @{ passed = $true; backupDir = $backup; profilePreserved = $true } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $work 'result.json') -Encoding UTF8
  } catch {
    $failure = $_
    if ($newMoved) { Move-Item -LiteralPath $install -Destination $stage }
    if ($oldMoved) { Move-Item -LiteralPath $backup -Destination $install }
    @{ passed = $false; rolledBack = $oldMoved; error = $failure.Exception.Message; profilePreserved = $true } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $work 'result.json') -Encoding UTF8
    if ($oldMoved -and $Restart) { Start-UpdatedDesktopPet $install $profile $Plan.launchIntent }
    throw $failure
  }
}
if ($ManifestPath) {
  $plan = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
  Invoke-DesktopPetUpdate $plan
}
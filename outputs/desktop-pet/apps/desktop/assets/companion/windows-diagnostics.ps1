param(
  [ValidateSet('Snapshot', 'Cursor')][string]$Mode = 'Snapshot',
  [ValidateRange(0, 10)][int]$DelaySeconds = 0
)

# 固定只读采集器：不执行注册表里的命令，不查 Win32_Product，不改变用户软件。
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$issues = New-Object 'System.Collections.Generic.List[string]'
$script:appsComplete = $true

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class CompanionReadOnlyWindows {
  public delegate bool EnumWindowCallback(IntPtr handle, IntPtr parameter);
  [StructLayout(LayoutKind.Sequential)] public struct Point { public int X; public int Y; }
  [StructLayout(LayoutKind.Sequential)] public struct FileTime { public uint Low; public uint High; }
  [StructLayout(LayoutKind.Sequential)] public struct MemoryStatus {
    public uint Length; public uint Load; public ulong TotalPhysical; public ulong AvailablePhysical;
    public ulong TotalPageFile; public ulong AvailablePageFile; public ulong TotalVirtual;
    public ulong AvailableVirtual; public ulong AvailableExtendedVirtual;
  }
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowCallback callback, IntPtr parameter);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr handle);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr handle);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out Point point);
  [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(Point point);
  [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr handle, uint flag);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr handle, out uint processId);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr handle, StringBuilder text, int capacity);
  [DllImport("kernel32.dll")] public static extern IntPtr OpenProcess(uint access, bool inherit, uint processId);
  [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr handle);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] public static extern bool QueryFullProcessImageName(IntPtr handle, uint flags, StringBuilder text, ref uint capacity);
  [DllImport("kernel32.dll")] public static extern bool GetSystemTimes(out FileTime idle, out FileTime kernel, out FileTime user);
  [DllImport("kernel32.dll")] public static extern bool GlobalMemoryStatusEx(ref MemoryStatus status);
  public static double[] CpuTimes() {
    FileTime idle, kernel, user;
    if (!GetSystemTimes(out idle, out kernel, out user)) return null;
    return new double[] { ((ulong)idle.High << 32) | idle.Low, ((ulong)kernel.High << 32) | kernel.Low, ((ulong)user.High << 32) | user.Low };
  }
  public static ulong[] Memory() {
    MemoryStatus value = new MemoryStatus(); value.Length = (uint)Marshal.SizeOf(value);
    if (!GlobalMemoryStatusEx(ref value)) return null;
    return new ulong[] { value.TotalPhysical, value.AvailablePhysical };
  }
  public static string ProcessPath(uint processId) {
    IntPtr handle = OpenProcess(0x1000, false, processId);
    if (handle == IntPtr.Zero) return null;
    try {
      StringBuilder text = new StringBuilder(32768); uint size = 32768;
      return QueryFullProcessImageName(handle, 0, text, ref size) ? text.ToString() : null;
    } finally { CloseHandle(handle); }
  }
  public static IntPtr[] VisibleWindows() {
    List<IntPtr> handles = new List<IntPtr>();
    EnumWindows(delegate(IntPtr handle, IntPtr unused) {
      if (IsWindowVisible(handle) && !IsIconic(handle)) handles.Add(handle);
      return handles.Count < 401;
    }, IntPtr.Zero);
    return handles.ToArray();
  }
}
'@

function Short-Text($value, [int]$limit = 2048) {
  $result = [string]$value
  if ($result.Length -gt $limit) { return $result.Substring(0, $limit) }
  return $result
}

function Window-Evidence([IntPtr]$handle, [IntPtr]$foreground) {
  if ($handle -eq [IntPtr]::Zero) { return $null }
  [uint32]$ownerProcess = 0
  [void][CompanionReadOnlyWindows]::GetWindowThreadProcessId($handle, [ref]$ownerProcess)
  $title = New-Object System.Text.StringBuilder 513
  [void][CompanionReadOnlyWindows]::GetWindowText($handle, $title, $title.Capacity)
  $processName = ''
  try { $processName = [System.Diagnostics.Process]::GetProcessById($ownerProcess).ProcessName } catch { }
  return [pscustomobject]@{
    handle = $handle.ToInt64().ToString()
    title = $title.ToString()
    pid = [int]$ownerProcess
    processName = $processName
    executablePath = [CompanionReadOnlyWindows]::ProcessPath($ownerProcess)
    isForeground = ($handle -eq $foreground)
  }
}

if ($Mode -eq 'Cursor') {
  if ($DelaySeconds -gt 0) { Start-Sleep -Seconds $DelaySeconds }
  $point = New-Object CompanionReadOnlyWindows+Point
  $handle = [IntPtr]::Zero
  if ([CompanionReadOnlyWindows]::GetCursorPos([ref]$point)) {
    $handle = [CompanionReadOnlyWindows]::WindowFromPoint($point)
    if ($handle -ne [IntPtr]::Zero) { $handle = [CompanionReadOnlyWindows]::GetAncestor($handle, 2) }
  }
  [pscustomobject]@{
    version = 1
    sampledAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    window = Window-Evidence $handle ([CompanionReadOnlyWindows]::GetForegroundWindow())
  } | ConvertTo-Json -Depth 6 -Compress
  exit 0
}

$disks = New-Object 'System.Collections.Generic.List[object]'
foreach ($drive in [System.IO.DriveInfo]::GetDrives()) {
  if ($drive.DriveType -ne [System.IO.DriveType]::Fixed) { continue }
  try {
    if (!$drive.IsReady -or $drive.TotalSize -le 0) { continue }
    $disks.Add([pscustomobject]@{
      name = $drive.Name
      totalBytes = $drive.TotalSize
      freeBytes = $drive.AvailableFreeSpace
      usedPercent = [Math]::Round(100 * (1 - $drive.AvailableFreeSpace / $drive.TotalSize), 1)
    })
  } catch { $issues.Add('部分固定磁盘的容量无法读取。') }
}

$memory = $null
$memoryBytes = [CompanionReadOnlyWindows]::Memory()
if ($null -ne $memoryBytes -and $memoryBytes[0] -gt 0) {
  $memory = [pscustomobject]@{
    totalBytes = $memoryBytes[0]
    availableBytes = $memoryBytes[1]
    usedPercent = [Math]::Round(100 * (1 - $memoryBytes[1] / $memoryBytes[0]), 1)
  }
} else { $issues.Add('物理内存容量无法读取。') }

# 两次进程 CPU 累计时间相减，并按逻辑处理器数归一化。核对创建时间，避免 PID 复用。
$first = @{}
$cpuBefore = [CompanionReadOnlyWindows]::CpuTimes()
$clock = [System.Diagnostics.Stopwatch]::StartNew()
foreach ($process in [System.Diagnostics.Process]::GetProcesses()) {
  try {
    $first[$process.Id] = @{ ticks = $process.TotalProcessorTime.Ticks; started = $process.StartTime.Ticks }
  } catch { }
  finally { $process.Dispose() }
}
Start-Sleep -Milliseconds 1000
$cpuAfter = [CompanionReadOnlyWindows]::CpuTimes()
$sampleDurationMs = $clock.Elapsed.TotalMilliseconds
$cpuPercent = $null
if ($null -ne $cpuBefore -and $null -ne $cpuAfter) {
  $totalDelta = ($cpuAfter[1] - $cpuBefore[1]) + ($cpuAfter[2] - $cpuBefore[2])
  if ($totalDelta -gt 0) {
    $cpuPercent = [Math]::Round([Math]::Max(0, [Math]::Min(100, 100 * (1 - ($cpuAfter[0] - $cpuBefore[0]) / $totalDelta))), 1)
  }
}
if ($null -eq $cpuPercent) { $issues.Add('CPU 短采样无法读取。') }
$processes = New-Object 'System.Collections.Generic.List[object]'
$restricted = 0
foreach ($process in [System.Diagnostics.Process]::GetProcesses()) {
  try {
    $usage = $null
    if ($first.ContainsKey($process.Id)) {
      try {
        if ($first[$process.Id].started -eq $process.StartTime.Ticks) {
          $delta = $process.TotalProcessorTime.Ticks - $first[$process.Id].ticks
          $usage = [Math]::Round([Math]::Max(0, [Math]::Min(100, 100 * $delta / ($sampleDurationMs * 10000 * [Environment]::ProcessorCount))), 1)
        }
      } catch { $restricted++ }
    }
    $processes.Add([pscustomobject]@{
      pid = $process.Id
      name = $process.ProcessName
      executablePath = [CompanionReadOnlyWindows]::ProcessPath($process.Id)
      workingSetBytes = $process.WorkingSet64
      cpuPercent = $usage
    })
  } catch { $restricted++ }
  finally { $process.Dispose() }
}
if ($restricted -gt 0) { $issues.Add('部分进程已退出或读取权限不足；缺失的 CPU 值保留为空。') }
if ($processes.Count -gt 500) { $issues.Add('进程超过 500 个，仅展示工作集最大的 500 个。') }
$selectedProcesses = @($processes | Sort-Object -Property workingSetBytes -Descending | Select-Object -First 500)

$apps = New-Object 'System.Collections.Generic.List[object]'
$startup = New-Object 'System.Collections.Generic.List[object]'
$views = @([Microsoft.Win32.RegistryView]::Registry32)
if ([Environment]::Is64BitOperatingSystem) { $views = @([Microsoft.Win32.RegistryView]::Registry64, [Microsoft.Win32.RegistryView]::Registry32) }
foreach ($hive in @([Microsoft.Win32.RegistryHive]::CurrentUser, [Microsoft.Win32.RegistryHive]::LocalMachine)) {
  foreach ($view in $views) {
    $base = $null
    try {
      $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey($hive, $view)
      foreach ($branch in @('Run', 'RunOnce')) {
        $keyPath = 'Software\Microsoft\Windows\CurrentVersion\' + $branch
        $key = $null
        try {
          $key = $base.OpenSubKey($keyPath, $false)
          if ($null -eq $key) { continue }
          foreach ($name in $key.GetValueNames()) {
            if ($startup.Count -ge 1000) { break }
            $startup.Add([pscustomobject]@{
              id = "${hive}:${view}:${keyPath}:${name}"
              name = Short-Text $name 256
              source = "${hive}/${view}/${branch}"
              command = Short-Text ($key.GetValue($name))
            })
          }
        } catch { $issues.Add('部分 Run/RunOnce 启动项无法读取。') }
        finally { if ($null -ne $key) { $key.Dispose() } }
      }
      $uninstall = $null
      try {
        $uninstallPath = 'Software\Microsoft\Windows\CurrentVersion\Uninstall'
        $uninstall = $base.OpenSubKey($uninstallPath, $false)
        if ($null -eq $uninstall) { continue }
        foreach ($subName in $uninstall.GetSubKeyNames()) {
          if ($apps.Count -ge 1000) { $script:appsComplete = $false; break }
          $entry = $null
          try {
            $entry = $uninstall.OpenSubKey($subName, $false)
            if ($null -eq $entry) { $script:appsComplete = $false; continue }
            $name = Short-Text ($entry.GetValue('DisplayName')) 256
            if ([string]::IsNullOrWhiteSpace($name)) { continue }
            $apps.Add([pscustomobject]@{
              id = "${hive}:${view}:${uninstallPath}\${subName}"
              name = $name
              version = Short-Text ($entry.GetValue('DisplayVersion')) 256
              publisher = Short-Text ($entry.GetValue('Publisher')) 256
              installLocation = Short-Text ($entry.GetValue('InstallLocation'))
              source = "${hive}/${view}/Uninstall"
            })
          } catch { $script:appsComplete = $false }
          finally { if ($null -ne $entry) { $entry.Dispose() } }
        }
      } catch { $script:appsComplete = $false }
      finally { if ($null -ne $uninstall) { $uninstall.Dispose() } }
    } catch {
      $script:appsComplete = $false
      $issues.Add('部分注册表视图无法读取。')
    } finally { if ($null -ne $base) { $base.Dispose() } }
  }
}
if (!$script:appsComplete) { $issues.Add('软件清单部分读取失败或达到 1000 条上限；不能用本次清单断言软件已卸载。') }
foreach ($folder in @([Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('CommonStartup'))) {
  if ([string]::IsNullOrEmpty($folder)) { continue }
  try {
    foreach ($item in [System.IO.Directory]::EnumerateFiles($folder)) {
      if ($startup.Count -ge 1000) { break }
      $startup.Add([pscustomobject]@{
        id = 'folder:' + $item
        name = [System.IO.Path]::GetFileName($item)
        source = '启动文件夹'
        command = Short-Text $item
      })
    }
  } catch { $issues.Add('部分启动文件夹无法读取。') }
}
if ($startup.Count -ge 1000) { $issues.Add('启动项达到 1000 条上限，结果可能不完整。') }

$windows = New-Object 'System.Collections.Generic.List[object]'
$foreground = [CompanionReadOnlyWindows]::GetForegroundWindow()
$handles = [CompanionReadOnlyWindows]::VisibleWindows()
if ($handles.Count -gt 400) { $issues.Add('可见窗口超过 400 个，清单已截断。') }
foreach ($handle in ($handles | Select-Object -First 400)) {
  $windows.Add((Window-Evidence $handle $foreground))
}
[pscustomobject]@{
  version = 1
  sampledAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  sampleDurationMs = [Math]::Round($sampleDurationMs)
  cpuPercent = $cpuPercent
  memory = $memory
  disks = @($disks.ToArray())
  processes = $selectedProcesses
  startupItems = @($startup.ToArray())
  installedApps = @($apps.ToArray())
  installedAppsComplete = $script:appsComplete
  windows = @($windows.ToArray())
  collectionIssues = @($issues | Select-Object -Unique -First 64)
  coverage = @(
    '本机固定磁盘容量、物理内存及约 1 秒 CPU 采样；不是持续性能监测。',
    '进程工作集与归一化 CPU 占用；进程可能退出或无法读取，工作集不可简单相加。',
    '自启覆盖 HKCU/HKLM 的 Run、RunOnce 和两个启动文件夹，不含服务、计划任务等。',
    '软件清单覆盖 HKCU/HKLM 的适用 32/64 位卸载注册表视图，不代表全部商店应用或便携软件。',
    '窗口清单只含当前桌面的可见、非最小化顶层窗口。窗口进程不等于通知发布应用或网页。',
    '路径、窗口标题和启动命令仅在本地显示；本次采集没有网络请求。'
  )
} | ConvertTo-Json -Depth 7 -Compress

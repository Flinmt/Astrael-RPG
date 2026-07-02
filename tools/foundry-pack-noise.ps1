param(
  [ValidateSet("ignore", "track", "status")]
  [string] $Mode = "ignore",

  [string] $Pack = "packs/gm-macros"
)

$ErrorActionPreference = "Stop"

$repoRoot = git rev-parse --show-toplevel
Push-Location $repoRoot
try {
  $trackedFiles = @(git ls-files -- "$Pack")

  if ($trackedFiles.Count -eq 0) {
    throw "No tracked files found for '$Pack'."
  }

  switch ($Mode) {
    "ignore" {
      git update-index --skip-worktree -- $trackedFiles

      $excludePath = Join-Path $repoRoot ".git/info/exclude"
      $begin = "# BEGIN Astrael local Foundry pack noise"
      $end = "# END Astrael local Foundry pack noise"
      $patterns = @(
        $begin,
        "/$Pack/LOCK",
        "/$Pack/LOG",
        "/$Pack/LOG.old",
        "/$Pack/CURRENT",
        "/$Pack/MANIFEST-*",
        "/$Pack/*.log",
        "/$Pack/*.ldb",
        "/$Pack/*.sst",
        $end
      )

      $existing = if (Test-Path $excludePath) {
        Get-Content $excludePath -Raw
      } else {
        ""
      }

      $blockPattern = "(?ms)^$([regex]::Escape($begin))\r?\n.*?^$([regex]::Escape($end))\r?\n?"
      $cleaned = [regex]::Replace($existing, $blockPattern, "")
      $newContent = $cleaned.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + ($patterns -join [Environment]::NewLine) + [Environment]::NewLine
      Set-Content -Path $excludePath -Value $newContent -NoNewline

      Write-Host "Ignoring local Foundry pack noise for '$Pack'."
      Write-Host "Run: powershell -ExecutionPolicy Bypass -File tools/foundry-pack-noise.ps1 -Mode track"
      Write-Host "Use track mode before intentionally updating and committing this pack."
    }

    "track" {
      git update-index --no-skip-worktree -- $trackedFiles
      Write-Host "Tracking local changes again for '$Pack'."
      Write-Host "Untracked LevelDB files may still be ignored by .git/info/exclude; use git add -f when promoting a real pack update."
    }

    "status" {
      git ls-files -v -- "$Pack" | Where-Object { $_ -match "^[S]" }
    }
  }
}
finally {
  Pop-Location
}

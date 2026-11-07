param([ValidateSet('Start','Stop','RebuildFrontend','RebuildBackend')][string]$Action = 'Start')
$ErrorActionPreference = 'Stop'
$repoPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$manifestPath = Join-Path $repoPath 'frontend/node_modules/.cache/pipre-audit/environment.json'
$composePath = Join-Path $repoPath 'docker-compose.audit.yaml'

function Invoke-AuditDocker([string[]]$DockerArguments) {
    $result = & docker @DockerArguments
    if ($LASTEXITCODE -ne 0) { throw "Docker $($DockerArguments[0]) failed ($LASTEXITCODE)." }
    return $result
}
function Assert-AuditContainers($manifest) {
    if ($manifest.project -notmatch '^pipre-audit-[a-f0-9]{32}$' -or $manifest.runId -notmatch '^[a-f0-9]{32}$') { throw 'Invalid audit manifest.' }
    $ids = @(Invoke-AuditDocker @('ps','-aq','--filter',"label=com.docker.compose.project=$($manifest.project)"))
    foreach ($id in $ids) {
        $label = Invoke-AuditDocker @('inspect','--format','{{index .Config.Labels "pipre.audit.run"}}',$id)
        if ($label -ne $manifest.runId) { throw 'Refusing to change a container without this audit label.' }
    }
}

Push-Location $repoPath
try {
    if ($Action -eq 'Start') {
        if (Test-Path -LiteralPath $manifestPath) { throw 'An audit manifest exists. Stop its environment first.' }
        foreach ($port in @(15183,18183)) {
            $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$port)
            try { $listener.Start() }
            catch { throw "Audit port $port is already in use." }
            finally { $listener.Stop() }
        }
        $runId = [guid]::NewGuid().ToString('N')
        $manifest = @{runId=$runId;project="pipre-audit-$runId";baseUrl='http://127.0.0.1:15183';apiUrl='http://127.0.0.1:18183/api/v1'}
        $env:PIPRE_AUDIT_RUN = $runId
        New-Item -ItemType Directory -Force (Split-Path $manifestPath) | Out-Null
        # Persist before starting so a failed build can still be cleaned up safely.
        $manifest | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding utf8
        Invoke-AuditDocker @('compose','-p',$manifest.project,'-f',$composePath,'up','-d','--build','--wait','--wait-timeout','240')
        $manifest.dbContainer = (Invoke-AuditDocker @('compose','-p',$manifest.project,'-f',$composePath,'ps','-q','postgres')).Trim()
        $manifest | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding utf8
        Assert-AuditContainers $manifest
        Write-Output "Audit ready at $($manifest.baseUrl). PostgreSQL is not exposed to the host."
    } else {
        if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'No audit manifest exists.' }
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        $env:PIPRE_AUDIT_RUN = $manifest.runId
        Assert-AuditContainers $manifest
        if ($Action -eq 'Stop') {
            Invoke-AuditDocker @('compose','-p',$manifest.project,'-f',$composePath,'down','--volumes','--remove-orphans')
            Remove-Item -LiteralPath $manifestPath
        } else {
            $service = if ($Action -eq 'RebuildBackend') { 'backend' } else { 'frontend' }
            Invoke-AuditDocker @('compose','-p',$manifest.project,'-f',$composePath,'up','-d','--build','--no-deps','--wait','--wait-timeout','240',$service)
        }
    }
} finally { Pop-Location }

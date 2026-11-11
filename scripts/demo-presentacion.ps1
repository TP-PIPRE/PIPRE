param([ValidateSet('Start','Import','Stop')][string]$Action = 'Start')
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$auditScript = Join-Path $PSScriptRoot 'audit-environment.ps1'
$cache = Join-Path $root 'frontend/node_modules/.cache/pipre-audit'
$auditPath = Join-Path $cache 'environment.json'
$demoPath = Join-Path $cache 'presentation.json'

function Invoke-DemoDocker([string[]]$DockerArguments) {
    $result = & docker @DockerArguments
    if ($LASTEXITCODE -ne 0) { throw "Docker $($DockerArguments[0]) failed ($LASTEXITCODE)." }
    return $result
}

function Get-DemoEnvironment {
    if (-not (Test-Path -LiteralPath $demoPath) -or -not (Test-Path -LiteralPath $auditPath)) {
        throw 'No hay un entorno de presentación propio. Ejecuta Start para crearlo.'
    }
    $demo = Get-Content -LiteralPath $demoPath -Raw | ConvertFrom-Json
    $audit = Get-Content -LiteralPath $auditPath -Raw | ConvertFrom-Json
    if ($demo.runId -notmatch '^[a-f0-9]{32}$' -or $audit.runId -ne $demo.runId -or $audit.project -ne "pipre-audit-$($demo.runId)") {
        throw 'Los manifiestos no corresponden a la misma presentación.'
    }
    return @{ audit = $audit; anchor = $demo.anchor }
}

if ($Action -eq 'Start') {
    if (Test-Path -LiteralPath $auditPath) { throw 'Ya existe un entorno aislado. Usa Import para una presentación existente.' }
    $previousTutor = $env:PIPRE_AUDIT_PROGRESSIVE_ENABLED
    try {
        $env:PIPRE_AUDIT_PROGRESSIVE_ENABLED = 'false'
        & $auditScript -Action Start | Out-Host
    } finally { $env:PIPRE_AUDIT_PROGRESSIVE_ENABLED = $previousTutor }
    $audit = Get-Content -LiteralPath $auditPath -Raw | ConvertFrom-Json
    $anchor = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(-5)).ToString('yyyy-MM-dd')
    @{ runId = $audit.runId; anchor = $anchor } | ConvertTo-Json | Set-Content -LiteralPath $demoPath -Encoding utf8
}

$presentation = Get-DemoEnvironment
$audit = $presentation.audit
if ($Action -eq 'Stop') {
    & $auditScript -Action Stop | Out-Host
    Remove-Item -LiteralPath $demoPath
    return
}

$database = (Invoke-DemoDocker @('inspect', $audit.dbContainer) | ConvertFrom-Json)[0]
$dbLabel = $database.Config.Labels
$databaseTmpfs = $database.HostConfig.Tmpfs
if ($dbLabel.'pipre.audit.run' -ne $audit.runId -or $dbLabel.'com.docker.compose.project' -ne $audit.project `
    -or $dbLabel.'com.docker.compose.service' -ne 'postgres' -or -not $databaseTmpfs.PSObject.Properties['/var/lib/postgresql/data'] `
    -or $database.HostConfig.PortBindings.PSObject.Properties.Count -gt 0) {
    throw 'La carga requiere un PostgreSQL desechable propio, en memoria y sin puertos publicados.'
}
$network = "$($audit.project)_default"
$networkLabel = Invoke-DemoDocker @('network','inspect','--format','{{index .Labels "pipre.audit.run"}}',$network)
if ($networkLabel -ne $audit.runId) { throw 'La red no pertenece a esta presentación.' }

$runnerName = "$($audit.project)-demo-import"
$runnerArguments = @('run','--rm','--name',$runnerName,'--network',$network,'--label',"pipre.audit.run=$($audit.runId)",
    '-e','PIPRE_PRESENTATION_IMPORT=true','-e',"PIPRE_PRESENTATION_ANCHOR=$($presentation.anchor)",
    '--mount',"type=bind,source=$(Join-Path $root 'backend'),target=/source,readonly",
    '--mount',"type=bind,source=$(Join-Path $root 'demo'),target=/fixtures,readonly",
    '--mount','type=volume,source=pipre-security-m2,target=/root/.m2',
    'maven:3.9.12-eclipse-temurin-21-alpine','sh','-c',
    'mkdir -p /build && cp -r /source/pom.xml /source/src /build/ && cd /build && mvn -B -ntp -Dtest=DemoPresentationImportTest test')
& docker @runnerArguments
if ($LASTEXITCODE -ne 0) { throw "La carga de demostración falló ($LASTEXITCODE)." }
Write-Output "Presentación lista en $($audit.baseUrl). Fecha de referencia: $($presentation.anchor)."

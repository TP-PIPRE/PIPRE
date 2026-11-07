param([string]$MavenImage = 'maven:3.9.12-eclipse-temurin-21-alpine')

$ErrorActionPreference = 'Stop'
$repoPath = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$runId = 'pipre-audit-' + [guid]::NewGuid().ToString('N')
$networkName = $runId + '-network'
$databaseName = $runId + '-db'
$runnerName = $runId + '-runner'
$networkCreated = $false

function Invoke-Docker([string[]]$DockerArguments) {
    & docker @DockerArguments
    if ($LASTEXITCODE -ne 0) { throw "Docker failed: $($DockerArguments[0]) (exit $LASTEXITCODE)" }
}

try {
    Invoke-Docker @('network', 'create', '--label', "pipre.audit.run=$runId", $networkName)
    $networkCreated = $true
    Invoke-Docker @('run', '-d', '--name', $databaseName, '--label', "pipre.audit.run=$runId",
        '--network', $networkName, '--network-alias', 'audit-db',
        '-e', 'POSTGRES_DB=pipre_audit', '-e', 'POSTGRES_USER=audit', '-e', 'POSTGRES_PASSWORD=audit-test-only',
        '--health-cmd', 'pg_isready -U audit -d pipre_audit', '--health-interval', '1s',
        '--health-timeout', '3s', '--health-retries', '45', 'postgres:16-alpine')
    $ready = $false
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        $health = & docker inspect --format '{{.State.Health.Status}}' $databaseName
        if ($health -eq 'healthy') { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'The disposable PostgreSQL did not become healthy.' }

    # No host port, existing database volume, application credentials or arbitrary DB URL.
    # The Maven cache contains dependencies only. The test class uses the fixed audit-db alias.
    Invoke-Docker @('run', '--rm', '--name', $runnerName, '--label', "pipre.audit.run=$runId",
        '--network', $networkName, '-e', 'PIPRE_AUDIT_POSTGRES=true',
        '--mount', "type=bind,source=$repoPath,target=/workspace",
        '--mount', 'type=volume,source=pipre-security-m2,target=/root/.m2',
        '-w', '/workspace/backend', $MavenImage, 'mvn', '-B', '-ntp',
        '-Dtest=BackendPersistenceIntegrationTest', '-Djacoco.destFile=target/jacoco-postgres.exec',
        '-Dtest.reportsDirectory=target/surefire-postgres', 'test')
}
finally {
    # Delete only resources created for this invocation and carrying its unique label.
    foreach ($containerName in @($runnerName, $databaseName)) {
        $label = & docker inspect --format '{{index .Config.Labels "pipre.audit.run"}}' $containerName 2>$null
        if ($LASTEXITCODE -eq 0 -and $label -eq $runId) {
            & docker rm -f -v $containerName | Out-Null
        }
    }
    if ($networkCreated) {
        $label = & docker network inspect --format '{{index .Labels "pipre.audit.run"}}' $networkName
        if ($LASTEXITCODE -eq 0 -and $label -eq $runId) { & docker network rm $networkName | Out-Null }
    }
}

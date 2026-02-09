param(
    [string]$BaseUrl = "http://127.0.0.1:3005",
    [string]$UserId = "",
    [string]$Username = "",
    [string]$AccessToken = ""
)

$ErrorActionPreference = "Stop"

function Test-2xx {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Url,
        [hashtable]$Headers = @{}
    )

    try {
        $resp = Invoke-WebRequest -Uri $Url -Method GET -Headers $Headers
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
            Write-Host "[PASS] $Name ($($resp.StatusCode))"
            return
        }
        throw "status code $($resp.StatusCode)"
    }
    catch {
        Write-Error "[FAIL] $Name at $Url`n$($_.Exception.Message)"
        exit 1
    }
}

Write-Host "Running users smoke checks against $BaseUrl"

Test-2xx -Name "healthz" -Url "$BaseUrl/healthz"
Test-2xx -Name "readyz" -Url "$BaseUrl/readyz"
Test-2xx -Name "metrics" -Url "$BaseUrl/metrics"

if ($UserId -and $AccessToken) {
    $cookieHeader = @{ Cookie = "accessToken=$AccessToken" }
    Test-2xx -Name "overview canonical path" -Url "$BaseUrl/api/users/$UserId/overview?device_id=smoke-check" -Headers $cookieHeader
    Test-2xx -Name "overview compatibility path" -Url "$BaseUrl/api/$UserId/overview?device_id=smoke-check" -Headers $cookieHeader
}
else {
    Write-Host "Skipping protected overview checks (set -UserId and -AccessToken to enable)"
}

if ($Username) {
    Test-2xx -Name "public snapshot canonical path" -Url "$BaseUrl/api/public/users/$Username"
    Test-2xx -Name "public snapshot compatibility path" -Url "$BaseUrl/api/users/public/users/$Username"
}
else {
    Write-Host "Skipping public snapshot checks (set -Username to enable)"
}

Write-Host "Users smoke checks completed successfully."

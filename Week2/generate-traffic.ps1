Write-Host "Generating traffic to populate Application Insights..."
for ($i=1; $i -le 20; $i++) {
    try {
        $response = Invoke-WebRequest -Uri 'https://mindx-minhnh.135.171.192.18.nip.io/api/health' -UseBasicParsing
        Write-Host "Request $i sent - Status: $($response.StatusCode)"
    } catch {
        Write-Host "Request $i failed: $_"
    }
    Start-Sleep -Milliseconds 300
}
Write-Host "Done! Check Azure Portal in 2-3 minutes for metrics."

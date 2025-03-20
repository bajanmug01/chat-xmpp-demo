# Navigate to the certs directory
cd prosody-config\certs

# Generate a self-signed certificate
openssl req -new -x509 -days 365 -nodes `
  -out localhost.crt `
  -keyout localhost.key `
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Check if the OpenSSL command was successful
if ($LASTEXITCODE -eq 0) {
  Write-Host "Certificates generated successfully!"
  Write-Host "You can now start Prosody with: docker-compose up -d"
} else {
  Write-Host "Certificate generation failed with exit code $LASTEXITCODE"
} 
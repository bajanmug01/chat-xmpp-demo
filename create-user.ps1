# Create the user
#prosodyctl register admin localhost secretAdminPassword
docker exec -it prosody-xmpp prosodyctl register alice localhost password123

# Check if the command was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "User created successfully!"
    Write-Host "You can now log in with these credentials in your app."
} else {
    Write-Host "Failed to create user. Error code: $LASTEXITCODE"
} 
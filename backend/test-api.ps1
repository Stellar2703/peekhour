# Comprehensive API Test Script for PeekHour
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PeekHour API Comprehensive Test Suite" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:5000/api"
$testResults = @()

function Test-Endpoint {
    param($name, $test)
    Write-Host "Testing: $name" -ForegroundColor Yellow
    try {
        & $test
        Write-Host "✓ PASSED: $name`n" -ForegroundColor Green
        $testResults += @{Name=$name; Status="PASS"}
    } catch {
        Write-Host "✗ FAILED: $name" -ForegroundColor Red
        Write-Host "Error: $_`n" -ForegroundColor Red
        $testResults += @{Name=$name; Status="FAIL"; Error=$_}
    }
}

# Test 1: Health Check
Test-Endpoint "Health Check" {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    if (-not $response.success) { throw "Health check failed" }
    Write-Host "  Server is running" -ForegroundColor Gray
}

# Test 2: Login with correct credentials
$global:token = $null
Test-Endpoint "Login - Valid Credentials (johndoe)" {
    $body = @{
        username = "johndoe"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
    if (-not $response.success) { throw "Login failed" }
    if (-not $response.data.token) { throw "No token received" }
    
    $global:token = $response.data.token
    Write-Host "  User: $($response.data.user.username)" -ForegroundColor Gray
    Write-Host "  Token: $($global:token.Substring(0,20))..." -ForegroundColor Gray
}

# Test 3: Login with invalid credentials
Test-Endpoint "Login - Invalid Credentials" {
    $body = @{
        username = "johndoe"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
        throw "Should have failed with invalid credentials"
    } catch {
        if ($_.Exception.Response.StatusCode -ne 401) {
            throw "Expected 401 Unauthorized"
        }
        Write-Host "  Correctly rejected invalid credentials" -ForegroundColor Gray
    }
}

# Test 4: Get user profile
Test-Endpoint "Get User Profile (Authenticated)" {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers
    
    if (-not $response.success) { throw "Failed to get profile" }
    Write-Host "  Name: $($response.data.user.name)" -ForegroundColor Gray
    Write-Host "  Email: $($response.data.user.email)" -ForegroundColor Gray
}

# Test 5: Get departments
Test-Endpoint "Get Departments (Authenticated)" {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-RestMethod -Uri "$baseUrl/departments" -Method GET -Headers $headers
    
    if (-not $response.success) { throw "Failed to get departments" }
    $depts = $response.data.departments
    Write-Host "  Total departments: $($depts.Count)" -ForegroundColor Gray
    Write-Host "  Joined departments: $($($depts | Where-Object {$_.is_member}).Count)" -ForegroundColor Gray
    
    $depts | Select-Object id, name, is_member, member_count, post_count | Format-Table -AutoSize | Out-String | Write-Host -ForegroundColor Gray
}

# Test 6: Get posts
Test-Endpoint "Get Posts (Authenticated)" {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?page=1`&limit=5" -Method GET -Headers $headers
    
    if (-not $response.success) { throw "Failed to get posts" }
    Write-Host "  Total posts: $($response.data.total)" -ForegroundColor Gray
    Write-Host "  Posts retrieved: $($response.data.posts.Count)" -ForegroundColor Gray
    
    if ($response.data.posts.Count -gt 0) {
        $post = $response.data.posts[0]
        Write-Host "  First post by: $($post.author_name)" -ForegroundColor Gray
    }
}

# Test 7: Get notifications
Test-Endpoint "Get Notifications (Authenticated)" {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-RestMethod -Uri "$baseUrl/users/notifications" -Method GET -Headers $headers
    
    if (-not $response.success) { throw "Failed to get notifications" }
    Write-Host "  Total notifications: $($response.data.notifications.Count)" -ForegroundColor Gray
    Write-Host "  Unread: $($($response.data.notifications | Where-Object {-not $_.is_read}).Count)" -ForegroundColor Gray
}

# Test 8: Login as different user
$global:token2 = $null
Test-Endpoint "Login - Different User (janesmith)" {
    $body = @{
        username = "janesmith"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
    if (-not $response.success) { throw "Login failed" }
    
    $global:token2 = $response.data.token
    Write-Host "  User: $($response.data.user.username)" -ForegroundColor Gray
}

# Test 9: Join department (as janesmith)
Test-Endpoint "Join Department (janesmith -> Startup Founders)" {
    $headers = @{ "Authorization" = "Bearer $global:token2" }
    $deptId = 5 # Startup Founders
    
    # First check if already a member
    $deptsResponse = Invoke-RestMethod -Uri "$baseUrl/departments" -Method GET -Headers $headers
    $dept = $deptsResponse.data.departments | Where-Object {$_.id -eq $deptId}
    
    if ($dept.is_member) {
        Write-Host "  Already a member of $($dept.name)" -ForegroundColor Gray
    } else {
        $response = Invoke-RestMethod -Uri "$baseUrl/departments/$deptId/join" -Method POST -Headers $headers
        if (-not $response.success) { throw "Failed to join department" }
        Write-Host "  Successfully joined: $($dept.name)" -ForegroundColor Gray
    }
}

# Test 10: Search posts
Test-Endpoint "Search Posts (by city)" {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/search?city=New York" -Method GET -Headers $headers
    
    if (-not $response.success) { throw "Search failed" }
    Write-Host "  Posts in New York: $($response.data.posts.Count)" -ForegroundColor Gray
}

# Test 11: Get post comments
Test-Endpoint "Get Post Comments" {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    
    # Get a post first
    $postsResponse = Invoke-RestMethod -Uri "$baseUrl/posts?page=1`&limit=1" -Method GET -Headers $headers
    if ($postsResponse.data.posts.Count -eq 0) { throw "No posts found" }
    
    $postId = $postsResponse.data.posts[0].id
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/$postId/comments" -Method GET -Headers $headers
    
    if (-not $response.success) { throw "Failed to get comments" }
    Write-Host "  Comments on post $postId : $($response.data.comments.Count)" -ForegroundColor Gray
}

# Test 12: Unauthorized access
Test-Endpoint "Unauthorized Access (No Token)" {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET
        throw "Should have failed without token"
    } catch {
        if ($_.Exception.Response.StatusCode -ne 401) {
            throw "Expected 401 Unauthorized"
        }
        Write-Host "  Correctly rejected unauthorized request" -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object {$_.Status -eq "PASS"}).Count
$failed = ($testResults | Where-Object {$_.Status -eq "FAIL"}).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if($failed -eq 0){"Green"}else{"Red"})

if ($failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $testResults | Where-Object {$_.Status -eq "FAIL"} | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Red
    }
}

Write-Host "`n================================================`n" -ForegroundColor Cyan

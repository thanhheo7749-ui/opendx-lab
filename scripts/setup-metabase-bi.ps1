# ==============================================================================
# Metabase Auto-Setup for Decision Intelligence
# Creates admin user, connects to dashboard_db, creates business dashboards
# ==============================================================================

# Platform: Windows (PowerShell 5.1+) or PowerShell Core (cross-platform)
# Linux/macOS: Use 'pwsh' (PowerShell Core) to run this script.

$METABASE = "http://localhost:3300"

# ── Step 1: Get setup token ──
Write-Host "=== Step 1: Getting setup token ===" -ForegroundColor Cyan
$props = Invoke-RestMethod -Uri "$METABASE/api/session/properties" -Method Get
$setupToken = $props.'setup-token'

if (-not $setupToken) {
    Write-Host "Metabase already set up. Trying to login..." -ForegroundColor Yellow
    $loginBody = @{ username = "admin@opendx.local"; password = "OpenDX2024!" } | ConvertTo-Json
    $session = Invoke-RestMethod -Uri "$METABASE/api/session" -Method Post -Body $loginBody -ContentType "application/json"
    $TOKEN = $session.id
} else {
    Write-Host "Setup token: $setupToken" -ForegroundColor Green

    # ── Step 2: Run setup ──
    Write-Host "=== Step 2: Running initial setup ===" -ForegroundColor Cyan
    $setupBody = @{
        token = $setupToken
        user = @{
            first_name = "Admin"
            last_name = "OpenDX"
            email = "admin@opendx.local"
            password = "OpenDX2024!"
            site_name = "OpenDX Decision Intelligence"
        }
        database = @{
            engine = "postgres"
            name = "OpenDX Dashboard DB"
            details = @{
                host = "postgres"
                port = 5432
                dbname = "dashboard_db"
                user = "opendx_admin"
                password = "secure_postgres_pass_123"
                ssl = $false
            }
        }
        prefs = @{
            site_name = "OpenDX Decision Intelligence"
            site_locale = "vi"
            allow_tracking = $false
        }
    } | ConvertTo-Json -Depth 5

    $setupResp = Invoke-RestMethod -Uri "$METABASE/api/setup" -Method Post -Body $setupBody -ContentType "application/json"
    $TOKEN = $setupResp.id
    Write-Host "Setup complete! Session: $TOKEN" -ForegroundColor Green
}

$headers = @{ "X-Metabase-Session" = $TOKEN }

# ── Step 3: Get database ID ──
Write-Host "=== Step 3: Finding database ===" -ForegroundColor Cyan
$dbs = Invoke-RestMethod -Uri "$METABASE/api/database" -Method Get -Headers $headers
$dbId = ($dbs.data | Where-Object { $_.name -like "*Dashboard*" -or $_.name -like "*dashboard*" } | Select-Object -First 1).id
if (-not $dbId) { $dbId = ($dbs.data | Select-Object -First 1).id }
Write-Host "Using database ID: $dbId" -ForegroundColor Green

# Force sync
Invoke-RestMethod -Uri "$METABASE/api/database/$dbId/sync_schema" -Method Post -Headers $headers -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5

# ── Step 4: Create saved questions (charts) ──
Write-Host "=== Step 4: Creating business intelligence questions ===" -ForegroundColor Cyan

$questions = @(
    @{
        name = "Doanh thu theo ngay (30 ngay)"
        query = "SELECT DATE(""orderDate"") as ngay, SUM(""totalAmount"") as doanh_thu, SUM(profit) as loi_nhuan, COUNT(*) as so_don FROM sb_orders WHERE status = 'COMPLETED' AND ""orderDate"" >= NOW() - INTERVAL '30 days' GROUP BY DATE(""orderDate"") ORDER BY ngay"
        display = "line"
    },
    @{
        name = "Top 10 san pham ban chay"
        query = "SELECT p.name as san_pham, SUM(oi.quantity) as so_luong, SUM(oi.""totalPrice"") as doanh_thu FROM sb_order_items oi JOIN sb_products p ON oi.""productId"" = p.id JOIN sb_orders o ON oi.""orderId"" = o.id WHERE o.status = 'COMPLETED' GROUP BY p.name ORDER BY so_luong DESC LIMIT 10"
        display = "bar"
    },
    @{
        name = "Doanh thu theo kenh ban"
        query = "SELECT channel as kenh, COUNT(*) as so_don, SUM(""totalAmount"") as doanh_thu FROM sb_orders WHERE status = 'COMPLETED' GROUP BY channel ORDER BY doanh_thu DESC"
        display = "pie"
    },
    @{
        name = "Ton kho hien tai"
        query = "SELECT p.name as san_pham, p.category as danh_muc, i.quantity as ton_kho, i.""daysInStock"" as ngay_ton, p.""costPrice"" * i.quantity as von_ket FROM sb_inventory i JOIN sb_products p ON i.""productId"" = p.id WHERE p.""isActive"" = true ORDER BY i.""daysInStock"" DESC"
        display = "table"
    },
    @{
        name = "Hieu qua quang cao theo kenh"
        query = "SELECT c.channel as kenh, c.name as campaign, SUM(d.spent) as chi_phi, SUM(d.revenue) as doanh_thu, ROUND(CAST(SUM(d.revenue) / NULLIF(SUM(d.spent), 0) AS numeric), 2) as roas, SUM(d.orders) as so_don FROM sb_ad_campaigns c JOIN sb_ad_daily_stats d ON c.id = d.""campaignId"" WHERE c.status = 'ACTIVE' GROUP BY c.channel, c.name ORDER BY roas DESC"
        display = "table"
    },
    @{
        name = "ROAS theo kenh (7 ngay)"
        query = "SELECT c.channel as kenh, ROUND(CAST(SUM(d.revenue) / NULLIF(SUM(d.spent), 0) AS numeric), 2) as roas, SUM(d.spent) as chi_phi, SUM(d.revenue) as doanh_thu FROM sb_ad_campaigns c JOIN sb_ad_daily_stats d ON c.id = d.""campaignId"" WHERE d.date >= NOW() - INTERVAL '7 days' GROUP BY c.channel ORDER BY roas DESC"
        display = "bar"
    }
)

$questionIds = @()
foreach ($q in $questions) {
    $qBody = @{
        name = $q.name
        dataset_query = @{
            type = "native"
            native = @{ query = $q.query }
            database = $dbId
        }
        display = $q.display
        visualization_settings = @{}
    } | ConvertTo-Json -Depth 5

    try {
        $resp = Invoke-RestMethod -Uri "$METABASE/api/card" -Method Post -Body $qBody -ContentType "application/json" -Headers $headers
        $questionIds += $resp.id
        Write-Host "  Created: $($q.name) (ID: $($resp.id))" -ForegroundColor Green
    } catch {
        Write-Host "  Failed: $($q.name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ── Step 5: Create dashboards ──
Write-Host "=== Step 5: Creating dashboards ===" -ForegroundColor Cyan

$dashboards = @(
    @{
        name = "Doanh thu & Don hang"
        description = "Tong quan doanh thu, loi nhuan, xu huong ban hang"
        cards = @(0, 2)  # indices into questionIds
    },
    @{
        name = "San pham & Ton kho"
        description = "Top SP, ton kho, toc do ban"
        cards = @(1, 3)
    },
    @{
        name = "Quang cao & Kenh ban"
        description = "ROAS, chi phi, hieu qua tung campaign"
        cards = @(4, 5)
    }
)

foreach ($dash in $dashboards) {
    $dashBody = @{
        name = $dash.name
        description = $dash.description
    } | ConvertTo-Json

    try {
        $dashResp = Invoke-RestMethod -Uri "$METABASE/api/dashboard" -Method Post -Body $dashBody -ContentType "application/json" -Headers $headers
        $dashId = $dashResp.id
        Write-Host "  Created dashboard: $($dash.name) (ID: $dashId)" -ForegroundColor Green

        # Add cards to dashboard
        $row = 0
        foreach ($cardIdx in $dash.cards) {
            if ($cardIdx -lt $questionIds.Count) {
                $addCardBody = @{
                    cardId = $questionIds[$cardIdx]
                    row = $row
                    col = 0
                    size_x = 18
                    size_y = 8
                } | ConvertTo-Json

                Invoke-RestMethod -Uri "$METABASE/api/dashboard/$dashId/cards" -Method Post -Body $addCardBody -ContentType "application/json" -Headers $headers | Out-Null
                $row += 8
            }
        }

        # Enable embedding
        $embedBody = @{ enable_embedding = $true } | ConvertTo-Json
        Invoke-RestMethod -Uri "$METABASE/api/dashboard/$dashId" -Method Put -Body $embedBody -ContentType "application/json" -Headers $headers | Out-Null
    } catch {
        Write-Host "  Failed: $($dash.name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ── Step 6: Enable embedding in settings ──
Write-Host "=== Step 6: Enabling embedding ===" -ForegroundColor Cyan
try {
    $embedSetting = @{ value = $true } | ConvertTo-Json
    Invoke-RestMethod -Uri "$METABASE/api/setting/enable-embedding" -Method Put -Body $embedSetting -ContentType "application/json" -Headers $headers | Out-Null
    Write-Host "  Embedding enabled" -ForegroundColor Green
} catch {
    Write-Host "  Embedding setting failed (may already be enabled)" -ForegroundColor Yellow
}

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host "Metabase: http://localhost:3300"
Write-Host "Login: admin@opendx.local / OpenDX2024!"
Write-Host "3 dashboards created for Decision Intelligence"

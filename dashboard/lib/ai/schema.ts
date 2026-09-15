// ==============================================================================
// OpenDX-Lab Dashboard - AI: Database Schema Description for LLM Context
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

/**
 * Plain-English schema description injected into the LLM system prompt
 * so it can generate correct SQL queries against our PostgreSQL database.
 */
export const DB_SCHEMA_DESCRIPTION = `
You have access to a PostgreSQL database for ShopWise, a decision intelligence platform for shop owners.
The database name is "dashboard_db". It contains business data (products, orders, customers, inventory, ad campaigns, suppliers) and organizational data (employees, departments). Here are the tables and their columns:

## Table: departments
| Column      | Type     | Notes                        |
|-------------|----------|------------------------------|
| id          | TEXT     | Primary key (CUID)           |
| name        | TEXT     | Unique, e.g. "Kỹ thuật"     |
| code        | TEXT     | Unique code, e.g. "ENG"     |
| description | TEXT     | Nullable                     |
| createdAt   | TIMESTAMP| Auto-set on creation         |
| updatedAt   | TIMESTAMP| Auto-updated                 |

## Table: employees
| Column       | Type     | Notes                                    |
|--------------|----------|------------------------------------------|
| id           | TEXT     | Primary key (CUID)                       |
| firstName    | TEXT     | First name (Vietnamese naming)           |
| lastName     | TEXT     | Last name                                |
| email        | TEXT     | Unique email                             |
| position     | TEXT     | Job title                                |
| departmentId | TEXT     | FK → departments.id                      |
| status       | ENUM     | 'ACTIVE', 'ON_LEAVE', or 'TERMINATED'   |
| hireDate     | TIMESTAMP| When the employee was hired               |
| createdAt    | TIMESTAMP| Auto-set on creation                     |
| updatedAt    | TIMESTAMP| Auto-updated                             |

## Table: activity_logs
| Column    | Type     | Notes                                          |
|-----------|----------|-------------------------------------------------|
| id        | TEXT     | Primary key (CUID)                              |
| type      | TEXT     | e.g. 'EMPLOYEE_CREATED', 'EMPLOYEE_TERMINATED' |
| message   | TEXT     | Human-readable description                      |
| metadata  | JSON     | Nullable, extra data                            |
| userId    | TEXT     | Nullable, who performed the action              |
| createdAt | TIMESTAMP| Auto-set on creation                            |

## Relationships
- employees.departmentId → departments.id (many-to-one)
- Each department has many employees

## Column name mapping (PostgreSQL uses quoted identifiers)
Use double quotes for camelCase columns: "firstName", "lastName", "departmentId", "hireDate", "createdAt", "updatedAt".

## BizScan — Business Data Tables

## Table: sb_products
| Column    | Type    | Notes                          |
|-----------|---------|--------------------------------|
| id        | TEXT    | Primary key (CUID)             |
| name      | TEXT    | Product name in Vietnamese     |
| sku       | TEXT    | Unique SKU code                |
| category  | TEXT    | Áo, Quần, Váy, Đầm, Giày, Túi, Phụ kiện, Set đồ |
| costPrice | FLOAT   | Cost price in VND              |
| sellPrice | FLOAT   | Selling price in VND           |
| isActive  | BOOLEAN | Whether product is active      |

## Table: sb_customers
| Column       | Type      | Notes                        |
|--------------|-----------|------------------------------|
| id           | TEXT      | Primary key                  |
| name         | TEXT      | Vietnamese name              |
| phone        | TEXT      | Unique phone number          |
| channel      | TEXT      | facebook, tiktok, shopee, lazada, zalo |
| totalSpent   | FLOAT     | Total amount spent           |
| orderCount   | INT       | Number of orders             |
| tier         | TEXT      | NORMAL, VIP, SUPER_VIP       |
| lastPurchase | TIMESTAMP | Last purchase date           |

## Table: sb_orders
| Column      | Type      | Notes                      |
|-------------|-----------|----------------------------|
| id          | TEXT      | Primary key                |
| customerId  | TEXT      | FK → sb_customers.id       |
| channel     | TEXT      | Sales channel              |
| status      | TEXT      | COMPLETED, CANCELLED, RETURNED |
| totalAmount | FLOAT     | Total order amount (VND)   |
| profit      | FLOAT     | Profit from order          |
| discount    | FLOAT     | Discount applied           |
| orderDate   | TIMESTAMP | When order was placed      |

## Table: sb_order_items
| Column    | Type  | Notes                 |
|-----------|-------|-----------------------|
| id        | TEXT  | Primary key           |
| orderId   | TEXT  | FK → sb_orders.id     |
| productId | TEXT  | FK → sb_products.id   |
| quantity  | INT   | Items ordered         |
| unitPrice | FLOAT | Price per item        |

## Table: sb_inventory
| Column      | Type | Notes                    |
|-------------|------|--------------------------|
| productId   | TEXT | FK → sb_products.id      |
| quantity    | INT  | Current stock quantity   |
| daysInStock | INT  | Days item has been in stock |

## Table: sb_ad_campaigns
| Column      | Type      | Notes                   |
|-------------|-----------|-------------------------|
| id          | TEXT      | Primary key             |
| name        | TEXT      | Campaign name           |
| channel     | TEXT      | facebook, tiktok, google|
| status      | TEXT      | ACTIVE, PAUSED, ENDED   |
| dailyBudget | FLOAT     | Budget per day (VND)    |

## Table: sb_ad_daily_stats
| Column  | Type  | Notes                          |
|---------|-------|--------------------------------|
| campaignId | TEXT | FK → sb_ad_campaigns.id      |
| date    | TIMESTAMP | Stats date                 |
| spent   | FLOAT | Money spent                    |
| clicks  | INT   | Number of clicks               |
| orders  | INT   | Orders from this campaign      |
| revenue | FLOAT | Revenue generated              |
| cpc     | FLOAT | Cost per click                 |
| roas    | FLOAT | Return on ad spend             |

## Table: sb_market_trends
| Column        | Type  | Notes                     |
|---------------|-------|---------------------------|
| keyword       | TEXT  | Trend keyword             |
| trendScore    | FLOAT | 0-100 trend score         |
| changePercent | FLOAT | % change vs previous period|
| avgPrice      | FLOAT | Market average price      |

## Common business queries
- Daily revenue: SELECT DATE("orderDate") as day, SUM("totalAmount") as revenue FROM sb_orders WHERE status='COMPLETED' GROUP BY day ORDER BY day DESC
- Top products: SELECT p.name, COUNT(oi.id) as sales FROM sb_order_items oi JOIN sb_products p ON oi."productId"=p.id GROUP BY p.name ORDER BY sales DESC
- Channel performance: SELECT channel, COUNT(*) as orders, SUM("totalAmount") as revenue FROM sb_orders GROUP BY channel
- Ad ROAS: SELECT c.name, AVG(s.roas) as avg_roas FROM sb_ad_daily_stats s JOIN sb_ad_campaigns c ON s."campaignId"=c.id GROUP BY c.name
`.trim();


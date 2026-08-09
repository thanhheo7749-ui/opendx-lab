// ==============================================================================
// OpenDX-Lab Dashboard - AI: Database Schema Description for LLM Context
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

/**
 * Plain-English schema description injected into the LLM system prompt
 * so it can generate correct SQL queries against our PostgreSQL database.
 */
export const DB_SCHEMA_DESCRIPTION = `
You have access to a PostgreSQL database for an employee management system.
The database name is "dashboard_db". Here are the tables and their columns:

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

## Common queries
- Count employees: SELECT COUNT(*) FROM employees
- Count by department: SELECT d.name, COUNT(e.id) FROM employees e JOIN departments d ON e."departmentId" = d.id GROUP BY d.name
- Active employees: SELECT * FROM employees WHERE status = 'ACTIVE'
- Recent hires: SELECT * FROM employees ORDER BY "hireDate" DESC LIMIT 10
`.trim();

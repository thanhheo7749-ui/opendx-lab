# 🔌 OpenDX-Lab API Documentation

Tài liệu này mô tả các API nội bộ phục vụ cho việc tích hợp giữa Dashboard Next.js, n8n, và các dịch vụ khác.

---

## 🏥 1. Health Checks API

*   **Endpoint:** `/api/services/health`
*   **Method:** `GET`
*   **Mô tả:** Trả về trạng thái hoạt động (UP/DOWN) và thời gian phản hồi của tất cả các container trong hệ sinh thái.
*   **Response mẫu (200 OK):**
    ```json
    {
      "status": "healthy",
      "services": [
        { "name": "Keycloak", "status": "UP", "responseTime": "12ms" },
        { "name": "Mattermost", "status": "UP", "responseTime": "24ms" }
      ]
    }
    ```

---

## 👥 2. Employee Management API

*   **Endpoint:** `/api/employees`
*   **Method:** `GET` | `POST`
*   **Mô tả:** Lấy danh sách hoặc thêm nhân viên mới vào hệ thống. Khi thêm mới, Dashboard sẽ kích hoạt webhook đồng bộ sang n8n.

### Sửa/Xóa Nhân viên:
*   **Endpoint:** `/api/employees/[id]`
*   **Method:** `PATCH` | `DELETE`

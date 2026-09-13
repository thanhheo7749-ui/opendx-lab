// ==============================================================================
// ShopWise — i18n Dictionaries (VI + EN)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

export type Locale = "vi" | "en";

const vi = {
  // -- Nav --
  "nav.overview": "Tổng quan",
  "nav.employees": "Nhân viên",
  "nav.workflows": "Quy trình",
  "nav.analytics": "Phân tích BI",
  "nav.aiChat": "Hỏi AI",
  "nav.knowledgeGraph": "Bản đồ quan hệ",
  "nav.bizscan": "Phát hiện vấn đề",
  "nav.decision": "Tư vấn quyết định",
  "nav.simulator": "Mô phỏng What-if",
  "nav.services": "Dịch vụ",
  "nav.supplier": "Nhà cung cấp",
  "nav.journal": "Nhật ký QĐ",

  // -- Header --
  "header.profile": "Hồ sơ",
  "header.settings": "Cài đặt",
  "header.logout": "Đăng xuất",

  // -- Breadcrumb --
  "breadcrumb.home": "Trang chủ",
  "breadcrumb.employees": "Nhân viên",
  "breadcrumb.workflows": "Quy trình",
  "breadcrumb.analytics": "Phân tích",
  "breadcrumb.aiChat": "AI Chat",
  "breadcrumb.knowledgeGraph": "Knowledge Graph",
  "breadcrumb.services": "Dịch vụ",

  // -- Dashboard home --
  "home.title": "Tổng quan shop",
  "home.hdpiStatus": "Trạng thái hệ thống",
  "home.human": "Con người",
  "home.process": "Quy trình",
  "home.data": "Dữ liệu",
  "home.intelligence": "Trí tuệ",
  "home.servicesUp": "dịch vụ hoạt động",
  "home.workflowsActive": "quy trình sẵn sàng",
  "home.databaseOnline": "cơ sở dữ liệu",
  "home.aiReady": "mô hình AI",
  "home.decisionsToday": "Quyết định cần xử lý",
  "home.noDecisions": "Không có vấn đề cần quyết định hôm nay 👍",

  // -- Metrics --
  "metrics.totalEmployees": "Tổng nhân viên",
  "metrics.active": "Hoạt động",
  "metrics.onLeave": "Nghỉ phép",
  "metrics.departments": "Phòng ban",

  // -- Status --
  "status.active": "Hoạt động",
  "status.onLeave": "Nghỉ phép",
  "status.terminated": "Đã nghỉ",
  "status.total": "Tổng",

  // -- Sections --
  "section.staffByDept": "Nhân sự theo phòng ban",
  "section.recentHires": "Nhân viên gần đây",
  "section.recentActivity": "Hoạt động gần đây",
  "section.quickAccess": "Truy cập nhanh",
  "section.viewAll": "Xem tất cả",
  "section.staffAllocation": "Phân bổ nhân sự",

  // -- Empty states --
  "empty.noActivity": "Chưa có hoạt động nào.",
  "empty.noActivityHint": "Thêm hoặc chỉnh sửa nhân viên để tạo log.",

  // -- Loading --
  "loading.dashboard": "Đang tải...",

  // -- Services --
  "services.title": "Dịch vụ",
  "services.sso": "Xác thực SSO",
  "services.chat": "Chat nội bộ",
  "services.wiki": "Tài liệu",
  "services.automation": "Tự động hóa",
  "services.bi": "Phân tích BI",
  "services.ai": "AI cục bộ",
  "services.database": "Cơ sở dữ liệu",
  "services.controlCenter": "Trung tâm dịch vụ",
  "services.subtitle": "Giám sát trạng thái tất cả dịch vụ trong hệ thống",
  "services.systemHealth": "Sức khỏe hệ thống",
  "services.servicesRunning": "dịch vụ hoạt động",
  "services.autoRefresh30s": "Tự động mỗi 30 giây",

  // -- Roles --
  "role.admin": "Quản trị viên",
  "role.manager": "Quản lý",
  "role.employee": "Nhân viên",

  // -- Actions --
  "action.refresh": "Làm mới",
  "action.create": "Tạo mới",
  "action.edit": "Chỉnh sửa",
  "action.delete": "Xoá",
  "action.save": "Lưu",
  "action.cancel": "Huỷ",
  "action.search": "Tìm kiếm",
  "action.openEditor": "Mở trình soạn",

  // -- Time --
  "time.updatedAt": "Cập nhật lúc",
  "time.autoRefresh": "Tự động mỗi 60s",

  // -- Employees --
  "employees.title": "Quản lý nhân viên",
  "employees.subtitle": "Quản lý thông tin và trạng thái nhân viên trong tổ chức",
  "employees.addNew": "Thêm nhân viên",
  "employees.name": "Họ tên",
  "employees.firstName": "Tên",
  "employees.lastName": "Họ",
  "employees.email": "Email",
  "employees.position": "Chức vụ",
  "employees.department": "Phòng ban",
  "employees.status": "Trạng thái",
  "employees.hireDate": "Ngày vào",
  "employees.actions": "Thao tác",
  "employees.noEmployees": "Chưa có nhân viên nào.",
  "employees.confirmDelete": "Bạn có chắc muốn xoá nhân viên này?",
  "employees.allDepartments": "Tất cả phòng ban",
  "employees.allStatuses": "Tất cả trạng thái",

  // -- AI Chat --
  "aiChat.title": "Trợ lý AI",
  "aiChat.subtitle": "Hỏi đáp dữ liệu kinh doanh bằng AI — hỗ trợ tiếng Việt",
  "aiChat.placeholder": "Nhập câu hỏi...",
  "aiChat.send": "Gửi",
  "aiChat.thinking": "Đang suy nghĩ...",
  "aiChat.welcome": "Xin chào! Tôi có thể giúp gì cho bạn?",
  "aiChat.errorMsg": "Có lỗi xảy ra. Vui lòng thử lại.",

  // -- Workflows --
  "workflows.title": "Quy trình tự động",
  "workflows.subtitle": "Workflows Activepieces tự động hóa quy trình Onboarding / Offboarding",
  "workflows.status": "Trạng thái",
  "workflows.lastRun": "Lần chạy cuối",
  "workflows.trigger": "Trigger",
  "workflows.steps": "Các bước",
  "workflows.automationFlow": "Luồng tự động hóa",
  "workflows.onboarding": "Onboarding nhân viên",
  "workflows.offboarding": "Offboarding nhân viên",
  "workflows.onboardingDesc": "Thêm nhân viên → Tạo tài khoản SSO + Gửi thông báo",
  "workflows.offboardingDesc": "Nghỉ việc → Vô hiệu hóa SSO + Thông báo",

  // -- Analytics --
  "analytics.title": "Phân tích dữ liệu",
  "analytics.subtitle": "Thống kê và biểu đồ trực quan từ Metabase",
  "analytics.openMetabase": "Mở Metabase",
  "analytics.embedError": "Không thể tải dashboard Metabase.",

  // -- Knowledge Graph --
  "kg.title": "Bản đồ quan hệ kinh doanh",
  "kg.subtitle": "Liên kết sản phẩm, NCC, kênh bán, thị trường & vị trí",
} as const;

const en: Record<keyof typeof vi, string> = {
  // -- Nav --
  "nav.overview": "Overview",
  "nav.employees": "Employees",
  "nav.workflows": "Workflows",
  "nav.analytics": "Analytics BI",
  "nav.aiChat": "Ask AI",
  "nav.knowledgeGraph": "Business Map",
  "nav.bizscan": "Issue Scanner",
  "nav.decision": "Decision Advisor",
  "nav.simulator": "What-if Simulator",
  "nav.services": "Services",
  "nav.supplier": "Suppliers",
  "nav.journal": "Decision Log",

  // -- Header --
  "header.profile": "Profile",
  "header.settings": "Settings",
  "header.logout": "Log out",

  // -- Breadcrumb --
  "breadcrumb.home": "Home",
  "breadcrumb.employees": "Employees",
  "breadcrumb.workflows": "Workflows",
  "breadcrumb.analytics": "Analytics",
  "breadcrumb.aiChat": "AI Chat",
  "breadcrumb.knowledgeGraph": "Knowledge Graph",
  "breadcrumb.services": "Services",

  // -- Dashboard home --
  "home.title": "Shop Overview",
  "home.hdpiStatus": "System status",
  "home.human": "Human",
  "home.process": "Process",
  "home.data": "Data",
  "home.intelligence": "Intelligence",
  "home.servicesUp": "services online",
  "home.workflowsActive": "workflows ready",
  "home.databaseOnline": "database",
  "home.aiReady": "AI model",
  "home.decisionsToday": "Decisions needed",
  "home.noDecisions": "No issues to decide today \ud83d\udc4d",

  // -- Metrics --
  "metrics.totalEmployees": "Total employees",
  "metrics.active": "Active",
  "metrics.onLeave": "On leave",
  "metrics.departments": "Departments",

  // -- Status --
  "status.active": "Active",
  "status.onLeave": "On leave",
  "status.terminated": "Terminated",
  "status.total": "Total",

  // -- Sections --
  "section.staffByDept": "Staff by department",
  "section.recentHires": "Recent hires",
  "section.recentActivity": "Recent activity",
  "section.quickAccess": "Quick access",
  "section.viewAll": "View all",
  "section.staffAllocation": "Staff allocation",

  // -- Empty states --
  "empty.noActivity": "No activity yet.",
  "empty.noActivityHint": "Add or edit employees to create logs.",

  // -- Loading --
  "loading.dashboard": "Loading...",

  // -- Services --
  "services.title": "Services",
  "services.sso": "SSO & IAM",
  "services.chat": "Internal chat",
  "services.wiki": "Documentation",
  "services.automation": "Automation",
  "services.bi": "BI & Reports",
  "services.ai": "Local AI",
  "services.database": "Database",
  "services.controlCenter": "Service Control Center",
  "services.subtitle": "Monitor the status of all services in the ecosystem",
  "services.systemHealth": "System health",
  "services.servicesRunning": "services running",
  "services.autoRefresh30s": "Auto-refresh every 30s",

  // -- Roles --
  "role.admin": "Administrator",
  "role.manager": "Manager",
  "role.employee": "Employee",

  // -- Actions --
  "action.refresh": "Refresh",
  "action.create": "Create",
  "action.edit": "Edit",
  "action.delete": "Delete",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.search": "Search",
  "action.openEditor": "Open editor",

  // -- Time --
  "time.updatedAt": "Updated at",
  "time.autoRefresh": "Auto-refresh every 60s",

  // -- Employees --
  "employees.title": "Employee management",
  "employees.subtitle": "Manage employee information and status in the organization",
  "employees.addNew": "Add employee",
  "employees.name": "Full name",
  "employees.firstName": "First name",
  "employees.lastName": "Last name",
  "employees.email": "Email",
  "employees.position": "Position",
  "employees.department": "Department",
  "employees.status": "Status",
  "employees.hireDate": "Hire date",
  "employees.actions": "Actions",
  "employees.noEmployees": "No employees yet.",
  "employees.confirmDelete": "Are you sure you want to delete this employee?",
  "employees.allDepartments": "All departments",
  "employees.allStatuses": "All statuses",

  // -- AI Chat --
  "aiChat.title": "AI Assistant",
  "aiChat.subtitle": "Ask questions about business data with AI — supports Vietnamese",
  "aiChat.placeholder": "Type a question...",
  "aiChat.send": "Send",
  "aiChat.thinking": "Thinking...",
  "aiChat.welcome": "Hello! How can I help you?",
  "aiChat.errorMsg": "An error occurred. Please try again.",

  // -- Workflows --
  "workflows.title": "Workflow automation",
  "workflows.subtitle": "Activepieces workflows automate Onboarding / Offboarding processes",
  "workflows.status": "Status",
  "workflows.lastRun": "Last run",
  "workflows.trigger": "Trigger",
  "workflows.steps": "Steps",
  "workflows.automationFlow": "Automation flow",
  "workflows.onboarding": "Employee Onboarding",
  "workflows.offboarding": "Employee Offboarding",
  "workflows.onboardingDesc": "Add employee → Create SSO account + Send notification",
  "workflows.offboardingDesc": "Terminate → Disable SSO + Notify",

  // -- Analytics --
  "analytics.title": "Data analytics",
  "analytics.subtitle": "Visual statistics and charts from Metabase",
  "analytics.openMetabase": "Open Metabase",
  "analytics.embedError": "Failed to load Metabase dashboard.",

  // -- Knowledge Graph --
  "kg.title": "Business Relationship Map",
  "kg.subtitle": "Connect products, suppliers, channels, market & location",
};

export type DictionaryKey = keyof typeof vi;
export const dictionaries: Record<Locale, Record<DictionaryKey, string>> = { vi, en };

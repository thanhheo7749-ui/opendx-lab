// ==============================================================================
// OpenDX-Lab Dashboard - Seed Script
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { PrismaClient, EmployeeStatus } from "@prisma/client";

const prisma = new PrismaClient();

const departments = [
  { name: "Kỹ thuật", code: "ENG", description: "Phòng Kỹ thuật & Phát triển phần mềm" },
  { name: "Nhân sự", code: "HR", description: "Phòng Quản lý Nhân sự" },
  { name: "Kinh doanh", code: "SALES", description: "Phòng Kinh doanh & Phát triển khách hàng" },
  { name: "Marketing", code: "MKT", description: "Phòng Marketing & Truyền thông" },
  { name: "Tài chính", code: "FIN", description: "Phòng Tài chính & Kế toán" },
];

const employees = [
  // Engineering (8)
  { firstName: "Nguyễn", lastName: "Văn An", email: "an.nguyen@opendx-lab.local", position: "Senior Developer", deptCode: "ENG", status: EmployeeStatus.ACTIVE },
  { firstName: "Trần", lastName: "Thị Bình", email: "binh.tran@opendx-lab.local", position: "Tech Lead", deptCode: "ENG", status: EmployeeStatus.ACTIVE },
  { firstName: "Lê", lastName: "Minh Châu", email: "chau.le@opendx-lab.local", position: "Backend Developer", deptCode: "ENG", status: EmployeeStatus.ACTIVE },
  { firstName: "Phạm", lastName: "Đức Dũng", email: "dung.pham@opendx-lab.local", position: "Frontend Developer", deptCode: "ENG", status: EmployeeStatus.ACTIVE },
  { firstName: "Hoàng", lastName: "Thị Em", email: "em.hoang@opendx-lab.local", position: "QA Engineer", deptCode: "ENG", status: EmployeeStatus.ACTIVE },
  { firstName: "Vũ", lastName: "Quang Phúc", email: "phuc.vu@opendx-lab.local", position: "DevOps Engineer", deptCode: "ENG", status: EmployeeStatus.ACTIVE },
  { firstName: "Đặng", lastName: "Hải Giang", email: "giang.dang@opendx-lab.local", position: "Junior Developer", deptCode: "ENG", status: EmployeeStatus.ON_LEAVE },
  { firstName: "Bùi", lastName: "Thị Hạnh", email: "hanh.bui@opendx-lab.local", position: "UX Designer", deptCode: "ENG", status: EmployeeStatus.ACTIVE },

  // HR (5)
  { firstName: "Mai", lastName: "Thị Hương", email: "huong.mai@opendx-lab.local", position: "HR Manager", deptCode: "HR", status: EmployeeStatus.ACTIVE },
  { firstName: "Ngô", lastName: "Văn Khải", email: "khai.ngo@opendx-lab.local", position: "Recruiter", deptCode: "HR", status: EmployeeStatus.ACTIVE },
  { firstName: "Dương", lastName: "Thị Linh", email: "linh.duong@opendx-lab.local", position: "HR Specialist", deptCode: "HR", status: EmployeeStatus.ACTIVE },
  { firstName: "Đinh", lastName: "Quốc Minh", email: "minh.dinh@opendx-lab.local", position: "Training Lead", deptCode: "HR", status: EmployeeStatus.ACTIVE },
  { firstName: "Lý", lastName: "Thị Ngọc", email: "ngoc.ly@opendx-lab.local", position: "Admin Assistant", deptCode: "HR", status: EmployeeStatus.TERMINATED },

  // Sales (7)
  { firstName: "Phan", lastName: "Văn Ơn", email: "on.phan@opendx-lab.local", position: "Sales Director", deptCode: "SALES", status: EmployeeStatus.ACTIVE },
  { firstName: "Trương", lastName: "Thị Phương", email: "phuong.truong@opendx-lab.local", position: "Account Manager", deptCode: "SALES", status: EmployeeStatus.ACTIVE },
  { firstName: "Nguyễn", lastName: "Quốc Anh", email: "quocanh.nguyen@opendx-lab.local", position: "Sales Executive", deptCode: "SALES", status: EmployeeStatus.ACTIVE },
  { firstName: "Lê", lastName: "Thị Rung", email: "rung.le@opendx-lab.local", position: "Business Analyst", deptCode: "SALES", status: EmployeeStatus.ON_LEAVE },
  { firstName: "Trần", lastName: "Văn Sơn", email: "son.tran@opendx-lab.local", position: "Sales Executive", deptCode: "SALES", status: EmployeeStatus.ACTIVE },
  { firstName: "Phạm", lastName: "Thị Tuyết", email: "tuyet.pham@opendx-lab.local", position: "Client Relations", deptCode: "SALES", status: EmployeeStatus.ACTIVE },
  { firstName: "Hoàng", lastName: "Văn Uy", email: "uy.hoang@opendx-lab.local", position: "Junior Sales", deptCode: "SALES", status: EmployeeStatus.ACTIVE },

  // Marketing (5)
  { firstName: "Vũ", lastName: "Thị Vân", email: "van.vu@opendx-lab.local", position: "Marketing Manager", deptCode: "MKT", status: EmployeeStatus.ACTIVE },
  { firstName: "Đặng", lastName: "Xuân Yến", email: "yen.dang@opendx-lab.local", position: "Content Creator", deptCode: "MKT", status: EmployeeStatus.ACTIVE },
  { firstName: "Bùi", lastName: "Văn Anh Tú", email: "anhtu.bui@opendx-lab.local", position: "Social Media Specialist", deptCode: "MKT", status: EmployeeStatus.ACTIVE },
  { firstName: "Mai", lastName: "Thị Bảo Trân", email: "tran.mai@opendx-lab.local", position: "Brand Designer", deptCode: "MKT", status: EmployeeStatus.ACTIVE },
  { firstName: "Ngô", lastName: "Cẩm Tú", email: "camtu.ngo@opendx-lab.local", position: "SEO Specialist", deptCode: "MKT", status: EmployeeStatus.TERMINATED },

  // Finance (5)
  { firstName: "Dương", lastName: "Văn Đạt", email: "dat.duong@opendx-lab.local", position: "Finance Manager", deptCode: "FIN", status: EmployeeStatus.ACTIVE },
  { firstName: "Đinh", lastName: "Thị Hà", email: "ha.dinh@opendx-lab.local", position: "Accountant", deptCode: "FIN", status: EmployeeStatus.ACTIVE },
  { firstName: "Lý", lastName: "Văn Khoa", email: "khoa.ly@opendx-lab.local", position: "Financial Analyst", deptCode: "FIN", status: EmployeeStatus.ACTIVE },
  { firstName: "Phan", lastName: "Thị Lan Anh", email: "lananh.phan@opendx-lab.local", position: "Payroll Specialist", deptCode: "FIN", status: EmployeeStatus.ACTIVE },
  { firstName: "Trương", lastName: "Minh Nhật", email: "nhat.truong@opendx-lab.local", position: "Auditor", deptCode: "FIN", status: EmployeeStatus.ON_LEAVE },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create departments
  const deptMap: Record<string, string> = {};
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    deptMap[dept.code] = created.id;
    console.log(`  ✓ Department: ${dept.name} (${dept.code})`);
  }

  // Create employees
  for (const emp of employees) {
    const { deptCode, ...data } = emp;
    await prisma.employee.upsert({
      where: { email: data.email },
      update: {},
      create: {
        ...data,
        departmentId: deptMap[deptCode],
        hireDate: new Date(
          2023 + Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 12),
          1 + Math.floor(Math.random() * 28)
        ),
      },
    });
  }
  console.log(`  ✓ Employees: ${employees.length} records`);

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      { type: "SYSTEM", message: "Hệ thống được khởi tạo lần đầu", metadata: { version: "1.0.0" } },
      { type: "SEED", message: `Đã tạo ${departments.length} phòng ban và ${employees.length} nhân viên`, metadata: { departments: departments.length, employees: employees.length } },
    ],
  });
  console.log("  ✓ Activity logs created");

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

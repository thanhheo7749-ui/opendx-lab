"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Employee Management Page
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Search, Pencil, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";
import type { DictionaryKey } from "@/lib/i18n-dictionaries";

// ---------------------------------------------------------------------------
// Position suggestions per department code
// ---------------------------------------------------------------------------
const positionsByDept: Record<string, string[]> = {
  ENG: [
    "Senior Developer",
    "Tech Lead",
    "Backend Developer",
    "Frontend Developer",
    "Fullstack Developer",
    "QA Engineer",
    "DevOps Engineer",
    "Junior Developer",
    "UX Designer",
    "Data Engineer",
  ],
  HR: [
    "HR Manager",
    "Recruiter",
    "HR Specialist",
    "Training Lead",
    "Admin Assistant",
    "Talent Acquisition",
  ],
  SALES: [
    "Sales Director",
    "Account Manager",
    "Sales Executive",
    "Business Analyst",
    "Client Relations",
    "Junior Sales",
    "Key Account Manager",
  ],
  MKT: [
    "Marketing Manager",
    "Content Creator",
    "Social Media Specialist",
    "Brand Designer",
    "SEO Specialist",
    "Graphic Designer",
    "Digital Marketer",
  ],
  FIN: [
    "Finance Manager",
    "Accountant",
    "Financial Analyst",
    "Payroll Specialist",
    "Auditor",
    "Tax Specialist",
    "Budget Analyst",
  ],
};

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  status: "ACTIVE" | "ON_LEAVE" | "TERMINATED";
  badgeConfig?: string;
  hireDate: string;
  department: Department;
}

const statusConfig = {
  ACTIVE: { label: "status.active", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700" },
  ON_LEAVE: { label: "status.onLeave", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700" },
  TERMINATED: { label: "status.terminated", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" },
};

// ---------------------------------------------------------------------------
// Reusable PositionCombobox
// ---------------------------------------------------------------------------
function PositionCombobox({
  deptCode,
  value,
  onChange,
  name,
}: {
  deptCode: string;
  value: string;
  onChange: (v: string) => void;
  name?: string;
}) {
  const [isCustom, setIsCustom] = useState(false);
  const suggestions = positionsByDept[deptCode] ?? [];

  // If the current value is not in the list, show custom input
  const valueInList = suggestions.includes(value);

  return (
    <div className="space-y-2">
      <select
        name={isCustom || (!valueInList && value) ? undefined : name}
        value={isCustom || (!valueInList && value) ? "__custom__" : value}
        onChange={(e) => {
          if (e.target.value === "__custom__") {
            setIsCustom(true);
            onChange("");
          } else {
            setIsCustom(false);
            onChange(e.target.value);
          }
        }}
        required={!isCustom}
        className="w-full p-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">Chọn vị trí</option>
        {suggestions.map((pos) => (
          <option key={pos} value={pos}>
            {pos}
          </option>
        ))}
        <option value="__custom__">✏️ Nhập vị trí khác...</option>
      </select>
      {(isCustom || (!valueInList && value)) && (
        <Input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder="Nhập vị trí tùy chỉnh..."
          className="bg-white border-gray-200 text-gray-900"
          autoFocus
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function EmployeesPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add form state
  const [addDeptId, setAddDeptId] = useState("");
  const [addPosition, setAddPosition] = useState("");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    departmentId: "",
    status: "" as "ACTIVE" | "ON_LEAVE" | "TERMINATED",
  });

  // In demo mode (no SSO), allow all operations. When SSO is configured, check roles.
  const isAdmin = !session ? true : (session.user?.roles?.includes("admin") || session.user?.roles?.includes("manager"));

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (deptFilter && deptFilter !== "all") params.set("department", deptFilter);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      setEmployees(data);

      // Extract unique departments
      const depts = Array.from(
        new Map(data.map((e: Employee) => [e.department.id, e.department])).values()
      ) as Department[];
      if (departments.length === 0) setDepartments(depts);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      toast("error", "Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, departments.length]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Get deptCode for a department id
  const getDeptCode = (deptId: string) => {
    return departments.find((d) => d.id === deptId)?.code ?? "";
  };

  // ---- Handlers ----
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      position: formData.get("position"),
      departmentId: formData.get("departmentId"),
    };

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDialogOpen(false);
        setAddDeptId("");
        setAddPosition("");
        fetchEmployees();
      }
    } catch (err) {
      console.error("Failed to create:", err);
      toast("error", "Không thể tạo nhân viên");
    }
  };

  const openEditDialog = (emp: Employee) => {
    setEditEmployee(emp);
    setEditForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      position: emp.position,
      departmentId: emp.department.id,
      status: emp.status,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editEmployee) return;

    try {
      const res = await fetch(`/api/employees/${editEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        setEditEmployee(null);
        fetchEmployees();
      }
    } catch (err) {
      console.error("Failed to update:", err);
      toast("error", "Không thể cập nhật thông tin nhân viên");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            {t("employees.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {employees.length} {t("employees.name")}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setAddDeptId(""); setAddPosition(""); } }}>
            <DialogTrigger render={
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                {t("employees.addNew")}
              </Button>
            } />
            <DialogContent className="bg-background border-border text-foreground max-w-md shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">{t("employees.addNew")}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Nhập thông tin nhân viên. Hệ thống sẽ tự động kích hoạt quy trình onboarding.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Họ</label>
                    <Input name="firstName" required placeholder="Nguyễn" className="bg-white border-gray-200 text-gray-900 mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tên</label>
                    <Input name="lastName" required placeholder="Văn A" className="bg-white border-gray-200 text-gray-900 mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input name="email" type="email" required placeholder="a.nguyen@company.com" className="bg-white border-gray-200 text-gray-900 mt-1" />
                </div>
                {/* Department FIRST, then Position */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Phòng ban</label>
                  <select
                    name="departmentId"
                    required
                    value={addDeptId}
                    onChange={(e) => { setAddDeptId(e.target.value); setAddPosition(""); }}
                    className="w-full mt-1 p-2 rounded-md bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Chọn phòng ban</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Vị trí</label>
                  {addDeptId ? (
                    <div className="mt-1">
                      <PositionCombobox
                        deptCode={getDeptCode(addDeptId)}
                        value={addPosition}
                        onChange={setAddPosition}
                        name="position"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      ↑ Vui lòng chọn phòng ban trước để xem danh sách vị trí
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white">
                  Tạo nhân viên
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("action.search") + "..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val ?? "all")}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t("employees.allDepartments")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("employees.allDepartments")}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchEmployees}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead className="text-muted-foreground font-semibold">{t("employees.name")}</TableHead>
                <TableHead className="text-muted-foreground font-semibold">{t("employees.email")}</TableHead>
                <TableHead className="text-muted-foreground font-semibold">{t("employees.department")}</TableHead>
                <TableHead className="text-muted-foreground font-semibold">{t("employees.position")}</TableHead>
                <TableHead className="text-muted-foreground font-semibold">{t("employees.status")}</TableHead>
                <TableHead className="text-muted-foreground font-semibold">{t("employees.hireDate")}</TableHead>
                {isAdmin && <TableHead className="text-muted-foreground font-semibold text-center">{t("employees.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-12">
                    {loading ? t("loading.dashboard") : t("employees.noEmployees")}
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const statusInfo = statusConfig[emp.status];
                  return (
                    <TableRow key={emp.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        {emp.firstName} {emp.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted border-border text-foreground shadow-sm">
                          {emp.department.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{emp.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusInfo.color}>
                          {t(statusInfo.label as DictionaryKey)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(emp.hireDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(emp)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 font-medium"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            {t("action.edit")}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditEmployee(null); }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Chỉnh sửa nhân viên</DialogTitle>
            <DialogDescription className="text-gray-500">
              Cập nhật thông tin nhân viên: {editEmployee?.firstName} {editEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          {editEmployee && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Họ</label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                    className="bg-white border-gray-200 text-gray-900 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tên</label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                    className="bg-white border-gray-200 text-gray-900 mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  type="email"
                  required
                  className="bg-white border-gray-200 text-gray-900 mt-1"
                />
              </div>
              {/* Department */}
              <div>
                <label className="text-sm font-medium text-gray-700">Phòng ban</label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value, position: "" })}
                  required
                  className="w-full mt-1 p-2 rounded-md bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {/* Position combobox */}
              <div>
                <label className="text-sm font-medium text-gray-700">Vị trí</label>
                <div className="mt-1">
                  <PositionCombobox
                    deptCode={getDeptCode(editForm.departmentId)}
                    value={editForm.position}
                    onChange={(v) => setEditForm({ ...editForm, position: v })}
                  />
                </div>
              </div>
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "ACTIVE" | "ON_LEAVE" | "TERMINATED" })}
                  className="w-full mt-1 p-2 rounded-md bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ACTIVE">🟢 Hoạt động</option>
                  <option value="ON_LEAVE">🟡 Nghỉ phép</option>
                  <option value="TERMINATED">🔴 Đã nghỉ việc</option>
                </select>
              </div>
              {/* Buttons */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white">
                  Lưu thay đổi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==============================================================================
// OpenDX-Lab Dashboard - Employee Validation Schemas
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { z } from "zod";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "Họ không được để trống").max(100),
  lastName: z.string().min(1, "Tên không được để trống").max(100),
  email: z.string().email("Email không hợp lệ"),
  position: z.string().min(1, "Vị trí không được để trống").max(200),
  departmentId: z.string().uuid("ID phòng ban không hợp lệ"),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  position: z.string().min(1).max(200).optional(),
  departmentId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Cần ít nhất một trường để cập nhật",
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

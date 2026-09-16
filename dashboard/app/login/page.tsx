// ==============================================================================
// ShopWise — Login Page (Keycloak SSO + Demo Accounts)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Demo accounts for presentation
const demoAccounts = [
  { username: "admin", password: "admin123", role: "Admin", color: "from-red-500 to-pink-600", icon: "👑", desc: "Toàn quyền hệ thống" },
  { username: "demo.manager", password: "demo1234", role: "Manager", color: "from-amber-500 to-orange-600", icon: "📊", desc: "Quản lý cửa hàng" },
  { username: "demo.staff", password: "demo1234", role: "Staff", color: "from-blue-500 to-cyan-600", icon: "🛒", desc: "Nhân viên bán hàng" },
  { username: "demo.viewer", password: "demo1234", role: "Viewer", color: "from-gray-400 to-slate-500", icon: "👁️", desc: "Chỉ xem báo cáo" },
];

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/30 mb-5 relative">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent tracking-tight">
            ShopWise
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Retail Decision Intelligence Platform
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Đăng nhập</h2>
          <p className="text-gray-500 text-sm mb-6">
            Đăng nhập bằng tài khoản SSO hoặc chọn tài khoản demo
          </p>

          {/* SSO Login button */}
          <form
            action={async () => {
              "use server";
              await signIn("keycloak", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              id="sso-login-button"
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
              Đăng nhập / Đăng ký với SSO
            </button>
          </form>

          <p className="text-[10px] text-gray-600 text-center mt-2">
            Trang đăng nhập Keycloak hỗ trợ cả Đăng nhập và Đăng ký tài khoản mới
          </p>

          {/* Separator */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-gray-600 uppercase tracking-widest">Tài khoản demo</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Demo accounts */}
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <form
                key={acc.username}
                action={async () => {
                  "use server";
                  await signIn("keycloak", { redirectTo: "/" });
                }}
              >
                <input type="hidden" name="username" value={acc.username} />
                <button
                  type="submit"
                  className="w-full group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] p-3 text-left transition-all duration-200 hover:border-white/[0.12] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${acc.color} opacity-0 group-hover:opacity-[0.06] transition-opacity`} />
                  <div className="relative flex items-start gap-2.5">
                    <span className="text-lg mt-0.5">{acc.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">{acc.role}</span>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r ${acc.color}`} />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{acc.desc}</p>
                      <p className="text-[9px] text-gray-600 font-mono mt-1">{acc.username}</p>
                    </div>
                  </div>
                </button>
              </form>
            ))}
          </div>

          {/* Login hint */}
          <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              💡 <strong className="text-gray-400">Demo:</strong> Click vào tài khoản demo → trang Keycloak mở ra → nhập username/password bên trên → đăng nhập.
              Hoặc nhấn <strong className="text-gray-400">Register</strong> trên trang Keycloak để tạo tài khoản mới.
            </p>
          </div>
        </div>

        {/* Role explanation */}
        <div className="mt-4 bg-white/[0.02] backdrop-blur-sm border border-white/[0.04] rounded-xl p-4">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Phân quyền hệ thống</h3>
          <div className="space-y-1.5">
            {[
              { role: "Admin", perms: "Toàn quyền: CRUD SP, kho, nhân sự, import, xóa", color: "text-red-400" },
              { role: "Manager", perms: "Quản lý: CRUD SP, kho, xem nhân sự, import", color: "text-amber-400" },
              { role: "Staff", perms: "Nhân viên: Sửa SP, cập nhật kho, import CSV", color: "text-blue-400" },
              { role: "Viewer", perms: "Chỉ xem: Dashboard, báo cáo, AI chat", color: "text-gray-400" },
            ].map((r) => (
              <div key={r.role} className="flex items-start gap-2 text-[10px]">
                <span className={`font-semibold ${r.color} w-14 shrink-0`}>{r.role}</span>
                <span className="text-gray-600">{r.perms}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-700 mt-6">
          © 2026 ShopWise • Powered by Keycloak SSO
        </p>
      </div>
    </div>
  );
}

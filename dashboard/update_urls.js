const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const urlMap = {
  'Quy trình Onboarding': 'http://localhost:3200/vi/quy-trinh/onboarding',
  'Quy trình Offboarding': 'http://localhost:3200/vi/quy-trinh/offboarding',
  'Quy trình Đánh giá hiệu suất': 'http://localhost:3200/vi/quy-trinh/danh-gia-hieu-suat',
  'Quy trình Xin nghỉ phép': 'http://localhost:3200/vi/quy-trinh/xin-nghi-phep',
  'Quy trình Tuyển dụng': 'http://localhost:3200/vi/quy-trinh/tuyen-dung',
  'Chính sách Nghỉ phép': 'http://localhost:3200/vi/chinh-sach/nghi-phep',
  'Chính sách Lương & Phúc lợi': 'http://localhost:3200/vi/chinh-sach/luong-phuc-loi',
  'Chính sách Bảo mật Thông tin': 'http://localhost:3200/vi/chinh-sach/bao-mat-thong-tin',
  'Chính sách Làm việc từ xa': 'http://localhost:3200/vi/chinh-sach/lam-viec-tu-xa',
  'Nội quy Công ty': 'http://localhost:3200/vi/chinh-sach/noi-quy-cong-ty',
  'Sổ tay Nhân viên 2024': 'http://localhost:3200/vi/tai-lieu/so-tay-nhan-vien-2024',
  'Hướng dẫn sử dụng OpenDX-Lab': 'http://localhost:3200/vi/tai-lieu/huong-dan-opendx-lab',
  'Quy chế Đào tạo nội bộ': 'http://localhost:3200/vi/tai-lieu/quy-che-dao-tao',
  'Wiki.js': 'http://localhost:3200',
  'Mattermost': 'http://localhost:3100',
  'Activepieces': 'http://localhost:5678',
  'Metabase': 'http://localhost:3300',
  'Keycloak': 'http://localhost:8080',
};

(async () => {
  let count = 0;
  for (const [name, url] of Object.entries(urlMap)) {
    const result = await p.kgNode.updateMany({ where: { name }, data: { sourceUrl: url } });
    if (result.count > 0) count += result.count;
  }
  console.log('Updated ' + count + ' nodes with sourceUrl');
  await p.$disconnect();
})();

# WMS Mobile Codex Context

Thư mục `.codex` là lớp cấu hình theo dự án cho Codex trong `wms-mobile`.

## 1. Mục đích

- Cung cấp bối cảnh dự án ngay từ đầu mỗi phiên làm việc.
- Tách riêng quy tắc, bộ nhớ, kỹ năng và agent chuyên biệt.
- Cho phép ghi đè các quy tắc dùng chung ở mức workspace khi cần.

## 2. Cấu trúc cốt lõi

- `codex.md`: bản tóm tắt dự án quan trọng nhất, được ưu tiên đọc đầu phiên.
- `codex.local.md`: thiết lập cục bộ hoặc riêng tư trên máy, không nên commit thông tin nhạy cảm.
- `settings.json`: nơi đặt cấu hình nâng cao như hooks hoặc automation theo dự án.
- `rules/`: chia nhỏ các quy tắc theo từng chủ đề để tránh làm file gốc quá dài.
- `memory/`: bộ nhớ xuyên phiên cho team context và quyết định kỹ thuật.
- `agents/`: các sub-agent chuyên biệt cho nghiên cứu, review và kiểm thử.
- `skills/`: macro/tài liệu thao tác lặp lại để giảm token và chuẩn hóa quy trình.

## 3. Bối cảnh dự án

- Repo: `wms-mobile`
- Stack hiện tại: Expo, React Native, TypeScript, NativeWind, React Navigation, Axios
- Mục tiêu: ứng dụng mobile phục vụ các luồng vận hành WMS như đăng nhập, dashboard, inbound, outbound, inventory, shipping, in ấn và hồ sơ người dùng

## 4. Thứ tự ưu tiên cấu hình

1. Global Codex rules trên máy
2. `@WDP/.codex/codex.md`
3. `@WDP/.codex/rules/*.md`
4. `wms-mobile/.codex/codex.md`
5. `wms-mobile/.codex/rules/*.md`
6. Các chỉ dẫn cục bộ khác trong repo

Nếu có xung đột, quy tắc ở mức repo `wms-mobile` được ưu tiên hơn cấu hình dùng chung, trừ các ràng buộc an toàn cấp cao hơn.

## 5. Cách dùng

- Đặt các quy tắc ngắn, quan trọng ở đầu file để tăng khả năng được tuân thủ nhất quán.
- Không lưu mật khẩu, token hay API key trong `memory/` hoặc `codex.local.md`.
- Khi quy trình lặp lại trở nên ổn định, chuyển nó vào `skills/`.
- Khi cần giảm tải context chính, đưa nhiệm vụ độc lập sang `agents/`.

## 6. Tham chiếu

- Workflow: `rules/workflow.md`
- Design: `rules/design.md`
- Tech stack: `rules/tech-stack.md`
- Decisions: `memory/decisions.md`
- Team context: `memory/team.md`

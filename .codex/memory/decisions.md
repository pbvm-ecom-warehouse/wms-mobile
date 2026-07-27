# Technical Decisions

Ghi lại các quyết định kỹ thuật đã thống nhất để dùng lại ở các phiên sau.

## 2026-07-27

- Nền tảng mobile đã được chuẩn hóa trên Expo SDK 57, React Native 0.86, Expo Router và cấu trúc `src/app/(auth)` cùng `src/app/(app)/(tabs)`.
- Chỉ giữ authentication thật; các phân hệ WMS còn lại đang dùng mock data và màn hình khung để hoàn thiện role navigation trước khi nối nghiệp vụ.
- Role navigation là nguồn sự thật duy nhất cho quyền hiển thị tab và redirect route; tránh rải điều kiện role riêng trong từng màn hình nếu có thể gom về config chung.
- Theme hiện tại chốt theo light-only: nền xám lạnh, card trắng, accent xanh cobalt, floating bottom tabs, safe area chuẩn Android/iOS.
- Chưa thêm TanStack Query hoặc state library mới cho nghiệp vụ; chỉ mở rộng khi bắt đầu tích hợp API ngoài auth.
- Với Android emulator, ưu tiên chạy Expo bằng `localhost` thay vì LAN để tránh lỗi mở `exp://<lan-ip>:8081` không ổn định trong môi trường hiện tại.
- Script vận hành ổn định cho emulator là `npm run android:localhost`; khi cần mở thủ công thì dùng `adb reverse tcp:8081 tcp:8081`.
- Nếu Expo Go báo không đủ bộ nhớ cài app trên emulator, cách xử lý chuẩn là `wipe-data` AVD trước khi debug tiếp, không đi sửa logic app.

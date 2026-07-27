# Tech Stack Rules

- Framework: Expo + React Native
- Ngôn ngữ: TypeScript
- Điều hướng: React Navigation
- HTTP client: Axios
- Styling: NativeWind + Tailwind config hiện có

## Quy ước

- Tái sử dụng cấu trúc thư mục hiện có trong `src/`.
- Không thêm thư viện mới nếu có thể giải quyết bằng stack sẵn có.
- Khi thêm module mới, giữ ranh giới rõ giữa `api`, `context`, `navigation`, `screens`, `types`, `utils`.

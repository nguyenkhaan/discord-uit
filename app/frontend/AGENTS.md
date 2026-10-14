# Frontend Rules

File này áp dụng cho toàn bộ thư mục `app/frontend`.

## Công nghệ

- Dùng React, TypeScript strict, Vite, Tailwind CSS v4 và Bun.
- Dùng TanStack Query cho server state.
- Dùng Axios trong lớp API/service.
- Dùng CVA và `cn()` để quản lý class theo biến thể.

## Cấu trúc thư mục

```text
frontend/
├── public/                     # Tài nguyên tĩnh truy cập bằng URL gốc
├── src/
│   ├── api/                    # Axios client, interceptor, cấu hình HTTP
│   ├── assets/                 # Tài nguyên được import vào source
│   ├── components/
│   │   ├── common/             # UI primitive dùng chung: Button, Input...
│   │   └── layout/             # Header, Footer và layout dùng chung
│   ├── context/                # Context, Provider và hook đọc context
│   ├── contract/               # Type sinh tự động từ OpenAPI
│   ├── features/
│   │   └── <feature>/
│   │       ├── components/     # Component chỉ thuộc feature
│   │       ├── pages/          # Route-level page
│   │       ├── *.hooks.ts      # Query, mutation và hook của feature
│   │       ├── *.service.ts    # Gọi API và ánh xạ dữ liệu
│   │       └── *.keys.ts       # Query keys khi cần
│   ├── lib/                    # Tiện ích độc lập, dùng chung
│   ├── routes/                 # Khai báo route
│   ├── App.tsx
│   ├── index.css               # Tailwind, design tokens và global reset
│   └── main.tsx                # Điểm khởi tạo ứng dụng
├── tests/                      # Test; cấu trúc bám theo `src`
├── tsconfig.json               # Cấu hình TypeScript duy nhất
└── vite.config.ts
```

- Đặt code ở phạm vi hẹp nhất có thể.
- Code chỉ dùng trong một feature phải nằm trong `features/<feature>`.
- Chỉ đưa component vào `components/common` khi có thể tái sử dụng độc lập.
- Page chỉ ghép UI và điều phối hành vi. Không gọi Axios trực tiếp trong page.
- API call nằm trong `*.service.ts`. Query và mutation nằm trong `*.hooks.ts`.
- Mỗi file chỉ đảm nhiệm một vai trò chính.

## Import

- Dùng `@` để biểu thị thư mục `src`.
- Mọi import nội bộ phải dùng `@/...`.
- Không dùng `../` hoặc `./` cho module nội bộ.
- Import package bên thứ ba bằng tên package.
- Dùng `import type` cho type chỉ tồn tại lúc compile.

```ts
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/useAuth';
import type { LoginRequest } from '@/features/auth/auth.service';
```

## TypeScript và React

- Không dùng `any`. Khai báo type rõ ràng tại biên API và component.
- Ưu tiên function component và named export cho code dùng chung.
- Page có thể dùng default export để phục vụ lazy loading và routing.
- Giữ state gần nơi sử dụng nhất. Chỉ dùng Context cho state dùng xuyên cây component.
- Tách Context, Provider và consumer hook thành các file riêng.
- Không đặt side effect trong render.
- Không để code chết, import thừa, comment thừa hoặc code đã comment-out.
- Comment phải giải thích lý do hoặc ràng buộc khó thấy.

## Tailwind và design tokens

- Chỉ dùng Tailwind class để viết giao diện component và page.
- Không tạo CSS riêng cho component hoặc page.
- `src/index.css` chỉ chứa Tailwind import, global reset, CSS variables và `@theme` mapping.
- Màu sắc, typography, shadow và token dùng chung phải khai báo trong `index.css`.
- Ưu tiên semantic token như `bg-surface`, `text-foreground`, `text-brand`, `border-line`.
- Không lặp lại mã màu trực tiếp trong JSX nếu đã có token phù hợp.
- Viết responsive theo hướng mobile-first.
- Luôn có trạng thái `hover`, `focus-visible`, `disabled` khi control cần chúng.

## Variants, CVA và `cn()`

- Dùng CVA khi component có nhiều variant, size hoặc state hình thức.
- Đặt cấu hình variant cạnh component, ví dụ `Button.tsx` và `buttonVariants.ts`.
- Component phải expose variant qua props typed bằng `VariantProps`.
- Component dùng chung phải nhận `className` và merge bằng `cn()`.
- Dùng `cn()` cho class có điều kiện hoặc khi ghép class từ nhiều nguồn.
- Không tự nối chuỗi class bằng template literal khi `cn()` xử lý được.
- Không viết lại class của primitive tại page nếu một variant có thể tái sử dụng.
- Xóa variant không còn nơi sử dụng.

```tsx
<Button className={cn(isActive && 'text-brand')} variant="tab">
    Tài khoản cá nhân
</Button>
```

## Component và accessibility

- Dùng `Button`, `Input` và primitive hiện có trước khi tạo component mới.
- Dùng đúng phần tử HTML semantic.
- Input phải có label liên kết bằng `htmlFor` và `id`.
- Control chỉ có icon phải có `aria-label`.
- Tab phải dùng `tablist`, `tab`, `tabpanel` và hỗ trợ bàn phím.
- Không bỏ focus outline nếu chưa cung cấp `focus-visible` thay thế.

## API contract

- `src/contract/api-contract.ts` là file sinh tự động. Không sửa thủ công.
- Sinh lại contract bằng lệnh:

```bash
bunx openapi-typescript http://localhost:4000/api/docs/openapi \
  --output src/contract/api-contract.ts
```

## Kiểm tra trước khi hoàn tất

- Chạy `bun run build`.
- Chạy `bun run lint`.
- Chạy `bun test` khi thay đổi logic hoặc tiện ích đã có test.
- Không hoàn tất khi còn lỗi TypeScript, ESLint hoặc test liên quan.
- Không sửa hoặc hoàn tác thay đổi ngoài phạm vi nhiệm vụ.

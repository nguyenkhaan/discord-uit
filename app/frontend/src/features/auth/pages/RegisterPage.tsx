import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { buttonVariants } from "@/components/common/buttonVariants";
import { Input } from "@/components/common/Input";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogInIcon,
  MailIcon,
  UserIcon,
  VisualPanel,
} from "@/features/auth/components/AuthShared";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="grid min-h-svh min-w-80 bg-surface md:grid-cols-[minmax(18rem,42%)_minmax(0,1fr)] lg:grid-cols-[minmax(20rem,46%)_minmax(0,1fr)]">
      <VisualPanel
        backgroundImage="/register-background.webp"
        description="Tạo tài khoản để bắt đầu chia sẻ tài liệu, tham gia diễn đàn, kết nối và học hỏi cùng hàng ngàn sinh viên khác."
        title={
          <>
            Tham gia
            <br />
            cộng đồng
            <br />
            UIT Connect
          </>
        }
        titleId="register-community-title"
        variant="register"
      />

      <section
        aria-labelledby="register-title"
        className="grid min-w-0 place-items-center bg-surface px-5 py-11 md:min-h-svh md:overflow-y-auto md:px-[clamp(2rem,6vw,4rem)] md:py-10 lg:px-[clamp(3rem,5vw,6rem)]"
      >
        <div className="w-full max-w-[37rem] text-left">
          <header>
            <h2
              className="m-0 text-title leading-tight font-extrabold tracking-[-0.035em] text-heading lg:text-[clamp(2.4rem,2.7vw,3.2rem)]"
              id="register-title"
            >
              Tạo tài khoản mới
            </h2>
            <p className="mt-2 text-[1.05rem] leading-normal text-muted lg:text-[1.12rem]">
              Đăng ký tài khoản cá nhân để tham gia cộng đồng
            </p>
          </header>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2 block text-[0.95rem] font-bold text-foreground lg:text-[1.02rem]"
                htmlFor="register-name"
              >
                Họ và tên
              </label>
              <Input
                autoComplete="name"
                id="register-name"
                maxLength={100}
                name="fullName"
                placeholder="Nhập họ và tên của bạn"
                required
                startIcon={<UserIcon />}
                type="text"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-[0.95rem] font-bold text-foreground lg:text-[1.02rem]"
                htmlFor="register-email"
              >
                Email cá nhân
              </label>
              <Input
                aria-describedby="register-email-help"
                autoComplete="email"
                id="register-email"
                maxLength={254}
                name="email"
                placeholder="Nhập email cá nhân"
                required
                startIcon={<MailIcon />}
                type="email"
              />
              <span
                className="mt-1.5 block text-[0.85rem] leading-normal text-muted lg:text-[0.92rem]"
                id="register-email-help"
              >
                Không sử dụng email @uit.edu.vn
              </span>
            </div>

            <div>
              <label
                className="mb-2 block text-[0.95rem] font-bold text-foreground lg:text-[1.02rem]"
                htmlFor="register-password"
              >
                Mật khẩu
              </label>
              <Input
                aria-describedby="register-password-help"
                autoComplete="new-password"
                endAdornment={
                  <Button
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                    className="text-muted hover:bg-transparent hover:text-brand"
                    onClick={() => setShowPassword((value) => !value)}
                    size="icon"
                    variant="ghost"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                }
                id="register-password"
                maxLength={128}
                minLength={8}
                name="password"
                placeholder="Nhập mật khẩu"
                required
                startIcon={<LockIcon />}
                type={showPassword ? "text" : "password"}
              />
              <div
                className="mt-1.5 text-[0.85rem] leading-relaxed text-muted lg:text-[0.92rem]"
                id="register-password-help"
              >
                <p>Mật khẩu phải có:</p>
                <ul className="mt-1 list-disc pl-5">
                  <li>Ít nhất 8 ký tự</li>
                  <li>Bao gồm chữ hoa, chữ thường</li>
                  <li>Bao gồm số hoặc ký tự đặc biệt</li>
                </ul>
              </div>
            </div>

            <div>
              <label
                className="mb-2 block text-[0.95rem] font-bold text-foreground lg:text-[1.02rem]"
                htmlFor="register-confirm"
              >
                Xác nhận mật khẩu
              </label>
              <Input
                autoComplete="new-password"
                endAdornment={
                  <Button
                    aria-label={
                      showRepeat
                        ? "Ẩn mật khẩu xác nhận"
                        : "Hiện mật khẩu xác nhận"
                    }
                    aria-pressed={showRepeat}
                    className="text-muted hover:bg-transparent hover:text-brand"
                    onClick={() => setShowRepeat((value) => !value)}
                    size="icon"
                    variant="ghost"
                  >
                    {showRepeat ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                }
                id="register-confirm"
                maxLength={128}
                name="repeatPassword"
                placeholder="Nhập lại mật khẩu"
                required
                startIcon={<LockIcon />}
                type={showRepeat ? "text" : "password"}
              />
            </div>

            <label className="grid cursor-pointer grid-cols-[auto_1fr] items-start gap-2 text-sm leading-normal text-foreground-secondary lg:text-[0.96rem]">
              <input
                className="mt-0.5 size-4.5 accent-brand"
                name="terms"
                required
                type="checkbox"
              />
              <span>
                Tôi đồng ý với{" "}
                <span className="font-semibold text-brand">
                  Điều khoản sử dụng
                </span>{" "}
                và{" "}
                <span className="font-semibold text-brand">
                  Chính sách bảo mật
                </span>{" "}
                của UIT Connect
              </span>
            </label>

            <Button fullWidth type="submit">
              Tạo tài khoản
            </Button>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm text-muted before:h-px before:bg-line-subtle before:content-[''] after:h-px after:bg-line-subtle after:content-[''] lg:text-[0.96rem]">
              Hoặc
            </div>

            <Link
              className={cn(
                buttonVariants({
                  fullWidth: true,
                  size: "default",
                  variant: "secondary",
                }),
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2",
              )}
              to="/login"
            >
              <LogInIcon />
              Đăng nhập nếu đã có tài khoản
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}

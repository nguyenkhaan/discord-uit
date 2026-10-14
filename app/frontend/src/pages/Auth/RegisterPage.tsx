import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import "../../styles/AuthPage.css";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogInIcon,
  MailIcon,
  UserIcon,
  VisualPanel,
} from "./AuthShared";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  // Giao diện thôi: chưa xử lý đăng ký
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <VisualPanel
          title={
            <>
              Tham gia
              <br />
              cộng đồng
              <br />
              UIT Connect
            </>
          }
          description="Tạo tài khoản để bắt đầu chia sẻ tài liệu, tham gia diễn đàn, kết nối và học hỏi cùng hàng ngàn sinh viên khác."
        />

        <section className="form-panel">
          <div className="form-shell">
            <header className="form-header">
              <h2>Tạo tài khoản mới</h2>
              <p className="subtitle">
                Đăng ký tài khoản cá nhân để tham gia cộng đồng
              </p>
            </header>

            <form className="auth-form register-form" onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="register-name">
                  Họ và tên
                </label>
                <div className="input-wrap">
                  <UserIcon className="field-icon" />
                  <input
                    id="register-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Nhập họ và tên của bạn"
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="register-email">
                  Email cá nhân
                </label>
                <div className="input-wrap">
                  <MailIcon className="field-icon" />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Nhập email cá nhân"
                  />
                </div>
                <span className="field-hint">
                  Không sử dụng email @uit.edu.vn
                </span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="register-password">
                  Mật khẩu
                </label>
                <div className="input-wrap">
                  <LockIcon className="field-icon" />
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="password-requirements">
                <p>Mật khẩu phải có:</p>
                <ul>
                  <li>Ít nhất 8 ký tự</li>
                  <li>Bao gồm chữ hoa, chữ thường</li>
                  <li>Bao gồm số hoặc ký tự đặc biệt</li>
                </ul>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="register-confirm">
                  Xác nhận mật khẩu
                </label>
                <div className="input-wrap">
                  <LockIcon className="field-icon" />
                  <input
                    id="register-confirm"
                    name="repeatPassword"
                    type={showRepeat ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={
                      showRepeat
                        ? "Ẩn mật khẩu xác nhận"
                        : "Hiện mật khẩu xác nhận"
                    }
                    aria-pressed={showRepeat}
                    onClick={() => setShowRepeat((value) => !value)}
                  >
                    {showRepeat ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <label className="terms">
                <input type="checkbox" />
                <span>
                  Tôi đồng ý với{" "}
                  <span className="inactive-link">Điều khoản sử dụng</span> và{" "}
                  <span className="inactive-link">Chính sách bảo mật</span> của
                  UIT Connect
                </span>
              </label>

              <button className="primary-button" type="submit">
                Tạo tài khoản
              </button>

              <div className="divider divider--tight">Hoặc</div>

              <Link className="secondary-button" to="/login">
                <LogInIcon />
                Đăng nhập nếu đã có tài khoản
              </Link>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
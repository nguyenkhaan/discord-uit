import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "../../styles/AuthPage.css";
import {
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  VisualPanel,
} from "../components/AuthShared";

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await login({ username: email, password });
      setPassword("");
    } catch {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.");
    }
  }

  return (
      <div className="auth-card">
        <VisualPanel
          title={
            <>
              Kết nối
              <br />
              Cùng học hỏi
              <br />
              Cùng phát triển
            </>
          }
          description="Nền tảng giao tiếp và diễn đàn dành cho sinh viên, nơi chia sẻ kiến thức, tài liệu và cùng nhau tạo nên cộng đồng UIT vững mạnh."
        />

        <section className="form-panel">
          <div className="form-shell">
            <header className="form-header">
              <h2>Chào mừng trở lại</h2>
              <p className="subtitle">
                Đăng nhập để tiếp tục khám phá cộng đồng
              </p>
            </header>

            <div className="tabs" role="tablist">
              <button
                className="tab is-active"
                type="button"
                role="tab"
                aria-selected="true"
              >
                Sinh viên UIT
              </button>
              <button
                className="tab"
                type="button"
                role="tab"
                aria-selected="false"
              >
                Tài khoản cá nhân
              </button>
            </div>

            <button className="sso-button" type="button">
              <span className="sso-mark">U</span>
              <span className="sso-text">Đăng nhập bằng tài khoản UIT</span>
              <ChevronRightIcon className="chevron" />
            </button>

            <p className="info">
              <span className="info-icon">i</span>
              <span>
                Bạn sẽ được chuyển hướng đến hệ thống xác thực của UIT (SSO).
              </span>
            </p>

            <div className="divider">Hoặc</div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="field">
                <label className="field-label" htmlFor="login-email">
                  Email
                </label>
                <div className="input-wrap">
                  <MailIcon className="field-icon" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="login-password">
                  Mật khẩu
                </label>
                <div className="input-wrap">
                  <LockIcon className="field-icon" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    maxLength={128}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
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

              <div className="options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Ghi nhớ đăng nhập
                </label>
                <span className="inactive-link">Quên mật khẩu?</span>
              </div>

              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <p className="register-prompt">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </div>
        </section>
      </div>

  );
}
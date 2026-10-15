import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/context/useAuth';
import {
    AccountTypeTabs,
    type AccountType,
} from '@/features/auth/components/AccountTypeTabs';
import {
    EyeIcon,
    EyeOffIcon,
    LockIcon,
    MailIcon,
    VisualPanel,
} from '@/features/auth/components/AuthShared';

export default function LoginPage() {
    const { login, isLoggingIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [activeAccountType, setActiveAccountType] =
        useState<AccountType>('personal');

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        try {
            await login({ username: email, password });
            setPassword('');
        } catch {
            setError(
                'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.'
            );
        }
    }

    return (
        <main className="grid min-h-svh min-w-80 bg-surface md:grid-cols-[minmax(18rem,42%)_minmax(0,1fr)] lg:grid-cols-[minmax(20rem,46%)_minmax(0,1fr)]">
            <VisualPanel
                backgroundImage="/login-background.webp"
                description="Nền tảng giao tiếp và diễn đàn dành cho sinh viên, nơi chia sẻ kiến thức, tài liệu và cùng nhau tạo nên cộng đồng UIT vững mạnh."
                title={
                    <>
                        Kết nối
                        <br />
                        Cùng học hỏi
                        <br />
                        Cùng phát triển
                    </>
                }
                titleId="login-community-title"
                variant="login"
            />

            <section
                aria-labelledby="login-title"
                className="grid min-h-svh min-w-0 place-items-center bg-surface px-5 py-11 md:overflow-y-auto md:px-[clamp(2rem,6vw,4rem)] md:py-10 lg:px-[clamp(3rem,5vw,6rem)]"
            >
                <div className="w-full max-w-[35rem] text-left">
                    <header>
                        <h2
                            className="m-0 text-title leading-tight font-extrabold tracking-[-0.035em] text-heading lg:text-[clamp(2.4rem,2.7vw,3.2rem)]"
                            id="login-title"
                        >
                            Chào mừng trở lại
                        </h2>
                        <p className="mt-2 text-[1.05rem] leading-normal text-muted lg:text-[1.12rem]">
                            Đăng nhập để tiếp tục khám phá cộng đồng
                        </p>
                    </header>

                    <AccountTypeTabs
                        activeTab={activeAccountType}
                        onTabChange={setActiveAccountType}
                    />

                    <form className="pt-6" onSubmit={handleLogin}>
                        {activeAccountType === 'personal' ? (
                            <div
                                aria-labelledby="personal-account-tab"
                                className="space-y-5"
                                id="personal-account-panel"
                                role="tabpanel"
                            >
                                <div>
                                    <label
                                        className="mb-2 block text-[0.95rem] font-bold text-foreground lg:text-[1.02rem]"
                                        htmlFor="login-email"
                                    >
                                        Email
                                    </label>
                                    <Input
                                        autoComplete="email"
                                        id="login-email"
                                        maxLength={254}
                                        name="email"
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        placeholder="Nhập email của bạn"
                                        required
                                        startIcon={<MailIcon />}
                                        type="email"
                                        value={email}
                                    />
                                </div>

                                <div>
                                    <label
                                        className="mb-2 block text-[0.95rem] font-bold text-foreground lg:text-[1.02rem]"
                                        htmlFor="login-password"
                                    >
                                        Mật khẩu
                                    </label>
                                    <Input
                                        autoComplete="current-password"
                                        endAdornment={
                                            <Button
                                                aria-label={
                                                    showPassword
                                                        ? 'Ẩn mật khẩu'
                                                        : 'Hiện mật khẩu'
                                                }
                                                aria-pressed={showPassword}
                                                className="text-muted hover:bg-transparent hover:text-brand"
                                                onClick={() =>
                                                    setShowPassword(
                                                        (value) => !value
                                                    )
                                                }
                                                size="icon"
                                                variant="ghost"
                                            >
                                                {showPassword ? (
                                                    <EyeOffIcon />
                                                ) : (
                                                    <EyeIcon />
                                                )}
                                            </Button>
                                        }
                                        id="login-password"
                                        maxLength={128}
                                        name="password"
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        placeholder="Nhập mật khẩu"
                                        required
                                        startIcon={<LockIcon />}
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={password}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div
                                aria-labelledby="student-account-tab"
                                className="grid min-h-[12.25rem] place-items-center text-lg font-semibold text-muted"
                                id="student-account-panel"
                                role="tabpanel"
                            >
                                Coming soon
                            </div>
                        )}

                        <div className="mt-5 space-y-5">
                            <div className="flex items-center justify-between gap-4 text-[0.92rem] text-foreground-secondary lg:text-base">
                                <label className="inline-flex cursor-pointer items-center gap-2">
                                    <input
                                        checked={rememberMe}
                                        className="size-4.5 accent-brand"
                                        onChange={(event) =>
                                            setRememberMe(event.target.checked)
                                        }
                                        type="checkbox"
                                    />
                                    Ghi nhớ đăng nhập
                                </label>
                                
                                {/* ĐÃ SỬA: Chuyển thẻ span thành thẻ Link */}
                                <Link 
                                    to="/forgot-password"
                                    className="font-semibold text-brand hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            {error && (
                                <p
                                    className="rounded-lg bg-danger-subtle px-3 py-2.5 text-[0.8125rem] leading-normal text-feedback-danger"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            <Button
                                disabled={isLoggingIn}
                                fullWidth
                                type="submit"
                            >
                                {isLoggingIn
                                    ? 'Đang đăng nhập...'
                                    : 'Đăng nhập'}
                            </Button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-[0.96rem] text-foreground-secondary lg:text-base">
                        Chưa có tài khoản?{' '}
                        <Link
                            className="font-bold text-brand hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            to="/register"
                        >
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
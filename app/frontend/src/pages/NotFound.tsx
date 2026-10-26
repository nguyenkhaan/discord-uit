import { useNavigate } from 'react-router-dom';
import { Home, RotateCw } from 'lucide-react';

import NotFoundBackground from '../assets/images/NotFoundPage.webp';
import Logo from '../assets/images/Logo.webp';

const BG_RATIO = 1920 / 1080;

// Style chung cho 2 nút: mobile dùng px, từ md trở lên scale theo ảnh (cqw)
const baseBtn = `
  flex shrink-0 items-center justify-center font-bold
  transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0
  h-10 w-[150px] gap-2 rounded-lg border-2 px-3 text-xs
  md:h-[max(38px,2.6cqw)] md:w-[max(140px,10cqw)]
  md:gap-[0.5cqw] md:rounded-[0.55cqw] md:px-[0.8cqw]
  md:border-[max(2px,0.12cqw)] md:text-[max(12px,0.9cqw)]
`;
const iconCls =
    'h-[18px] w-[18px] md:h-[max(15px,1.1cqw)] md:w-[max(15px,1.1cqw)]';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <main className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-900">
            {/* Stage: giữ đúng tỉ lệ ảnh, phủ kín màn hình như object-cover */}
            <div
                className="relative shrink-0 [container-type:inline-size]"
                style={{
                    width: `max(100vw, calc(100dvh * ${BG_RATIO}))`,
                    height: `max(100dvh, calc(100vw / ${BG_RATIO}))`,
                }}
            >
                <img
                    src={NotFoundBackground}
                    alt="404 - Bạn đã đi lạc khỏi server"
                    className="absolute inset-0 h-full w-full select-none"
                    draggable={false}
                />

                {/* Cụm nút — căn giữa theo cột chữ "404", ngay dưới đoạn mô tả */}
                <div
                    className="
            z-10 flex items-center
            fixed bottom-8 left-1/2 -translate-x-1/2 gap-3
            md:absolute md:bottom-auto md:left-[36.8%] md:top-[76%] md:gap-[1cqw]
          "
                >
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className={`${baseBtn} border-blue-500 cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-md`}
                    >
                        <Home strokeWidth={2.5} className={iconCls} />
                        <span>Về trang chủ</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className={`${baseBtn} border-blue-600 bg-white/90 cursor-pointer text-blue-700 shadow-md backdrop-blur-sm hover:bg-white`}
                    >
                        <RotateCw strokeWidth={2.5} className={iconCls} />
                        <span>Thử lại</span>
                    </button>
                </div>
            </div>

            <div className="pointer-events-none fixed left-6 top-6 z-20">
                <img
                    src={Logo}
                    alt="UIT Connect"
                    draggable={false}
                    className="h-12 w-auto select-none object-contain brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] sm:h-20"
                />
            </div>
        </main>
    );
};

export default NotFound;

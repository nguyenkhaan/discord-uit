import { Link } from 'react-router-dom';

import LogoImage from '@/assets/images/Logo.webp';

export function Logo() {
    return (
        <Link
            aria-label="Về trang chủ UIT Connect"
            className="inline-flex shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            to="/"
        >
            <img
                alt="UIT Connect"
                className="h-8 w-auto object-contain sm:h-8 md:h-10 lg:h-14"
                src={LogoImage}
            />
        </Link>
    );
}

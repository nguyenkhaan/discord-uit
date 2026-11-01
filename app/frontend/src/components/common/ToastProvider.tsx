import { ToastContainer } from 'react-toastify';

export function ToastProvider() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            aria-label="Thông báo"
        />
    );
}

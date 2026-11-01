import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from '@/App';
import { ToastProvider } from '@/components/common/ToastProvider';
import { AuthProvider } from '@/context/AuthProvider';
import '@/index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <App />
            </AuthProvider>
            <ToastProvider />
        </QueryClientProvider>
    </StrictMode>
);

import { Suspense } from 'react';
import OutRedirector from './OutRedirector';

export const metadata = {
    title: 'Redirecting | GameDeals',
};

export default function OutPage() {
    return (
        <main className="container">
            <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Carregando link seguro...</div>}>
                <OutRedirector />
            </Suspense>
        </main>
    );
}

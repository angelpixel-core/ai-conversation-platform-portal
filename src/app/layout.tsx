import './globals.css';
import { Metadata } from 'next';
import { QueryProvider } from '@/presentation/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Coffee Chatbot Portal | AI Conversation Platform',
  description: 'Portal de administración y pruebas del motor de chatbot de cafetería con Neubrutalism 3D y Clean Architecture.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#FFFDF8] text-black min-h-screen antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

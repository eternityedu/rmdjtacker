import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const Layout = ({ children, hideHeader = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

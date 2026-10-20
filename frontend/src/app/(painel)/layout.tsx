import { AppShell } from '@/components/app-shell';

export default function LayoutPainel({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}

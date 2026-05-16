import { AppLayout } from "@/components/layout/AppLayout";

import { PushSubscriber } from "@/components/pwa/PushSubscriber";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <PushSubscriber />
      {children}
    </AppLayout>
  );
}

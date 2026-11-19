import { useEffect, useState } from 'react';
import { getLastQuota, HOSTED_QUOTA_EVENT, type HostedQuota } from '../../lib/ai/hosted-client';

/** "12 of 25 free messages left today", once the server has reported it. */
export default function HostedQuotaNote() {
  const [quota, setQuota] = useState<HostedQuota | null>(getLastQuota);

  useEffect(() => {
    const onQuota = (e: Event) => setQuota((e as CustomEvent<HostedQuota>).detail);
    window.addEventListener(HOSTED_QUOTA_EVENT, onQuota);
    return () => window.removeEventListener(HOSTED_QUOTA_EVENT, onQuota);
  }, []);

  if (!quota) return <span className="text-xs text-cream/40">BibleQuest AI mentor</span>;
  return (
    <span className="text-xs text-cream/40">
      {quota.remainingToday} of {quota.dailyLimit} free messages left today
    </span>
  );
}

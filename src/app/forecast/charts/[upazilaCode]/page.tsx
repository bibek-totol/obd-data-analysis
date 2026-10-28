'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ForecastChartsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const upazilaCode = (Array.isArray(params?.upazilaCode) ? params.upazilaCode[0] : params?.upazilaCode) || '302602';

  useEffect(() => {
    router.replace(`/forecast/${upazilaCode}`);
  }, [router, upazilaCode]);

  return null;
}

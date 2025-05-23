// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import "./../../global.css";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login/login');
  }, [router]); // ✅ Agregado aquí como dependencia

  return null;
}

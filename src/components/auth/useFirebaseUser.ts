import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { getFirebaseAuth } from "~/lib/firebase.client";

export function useFirebaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const auth = await getFirebaseAuth();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (e) {
        console.error("Auth setup failed:", e);
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  return { user, loading };
}

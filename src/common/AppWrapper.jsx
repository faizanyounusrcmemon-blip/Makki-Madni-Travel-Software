import React, { useEffect, useState } from "react";
import { Loader } from "./Loader";
import { setGlobalLoader, loaderFetch } from "./loaderFetch";

export default function AppWrapper({ children }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGlobalLoader(setLoading);

    // ✅ fetch ko sirf ek dafa override karo
    window.fetch = loaderFetch;
  }, []);

  return (
    <>
      {loading && <Loader message="⏳ Please wait, loading data..." />}
      {children}
    </>
  );
}


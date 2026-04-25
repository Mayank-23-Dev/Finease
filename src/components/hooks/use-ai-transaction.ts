import { useState } from "react";

export function useAITransaction() {
  const [loading, setLoading] = useState(false);

  const parseTransaction = async (message: string) => {
    setLoading(true);

    try {
      const res = await fetch("/api/ai/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await res.json();
      return data;
    } catch (err) {
      console.error("AI Transaction Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { parseTransaction, loading };
}
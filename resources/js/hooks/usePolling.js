import { useState, useEffect } from "react";
import axios from "axios";

export default function usePolling(url, interval = 5000) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await axios.get(url);
        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, interval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [url, interval]);

  return data;
}

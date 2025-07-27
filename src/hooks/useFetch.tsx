"use client";

import { useEffect, useState } from 'react';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { toast } from 'sonner';

interface UseFetchOptions {
  method?: Method;
  endpoint: string;
  data?: undefined | null;
  headers?: Record<string, string>;
}

export const useFetch = <T = unknown>({
  method = 'GET',
  endpoint,
  data = null,
  headers = {},
}: UseFetchOptions) => {
  const [response, setResponse] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const config: AxiosRequestConfig = {
          url: endpoint,
          method,
          headers,
          ...(method !== 'GET' && { data }),
        };

        const res = await axios(config);
        setResponse(res.data);
        setError(null);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || err.message);
        } else {
          setError("An unknown error occurred");
        }
        toast.error(error);
        setResponse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, data, error, headers, method]);

  return { response, error, loading };
};

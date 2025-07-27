import { useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

interface UseFetchProps<T = unknown> {
    endpoint: string;
    method?: string;
    payload?: T | null;
    headers?: Record<string, string>;
    params?: Record<string, string>;
};

const useFetch = <T = unknown>({
  endpoint,
  method = "GET",
  payload = null,
  headers = {
    "Content-Type": "application/json",
  },
  params = {},
}: UseFetchProps<T>) => {
  const [data, setData] = useState<unknown>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fn = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios({
        url: endpoint,
        method,
        data: payload,
        headers,
        params,
      });

      setData(response.data);
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred");
      const axiosError = err as AxiosError;
      const responseData = axiosError?.response?.data;
      const errorMessage =
        responseData && typeof responseData === "object" && "message" in responseData
          ? (responseData as { message: string }).message
          : (err as Error).message || "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
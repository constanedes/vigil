interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: unknown;
    timeoutMs?: number;
}

interface Response<T = unknown> {
    ok: boolean;
    status: number;
    data: T;
}

const DEFAULT_TIMEOUT = 10_000;

async function request<T>(url: string, options: RequestOptions = {}): Promise<Response<T>> {
    const { method = "GET", headers = {}, body, timeoutMs = DEFAULT_TIMEOUT } = options;

    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs)
    });

    const data = await res.json().catch(() => null);

    return { ok: res.ok, status: res.status, data: data as T };
}

export const http = {
    get: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: "GET" }),
    post: <T>(url: string, body: unknown, options?: RequestOptions) => request<T>(url, { ...options, method: "POST", body }),
    put: <T>(url: string, body: unknown, options?: RequestOptions) => request<T>(url, { ...options, method: "PUT", body }),
    delete: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: "DELETE" }),
};
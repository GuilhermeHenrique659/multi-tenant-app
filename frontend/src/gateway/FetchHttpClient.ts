import type HttpClient from "./HttpClient";

export default class FetchHttpClient implements HttpClient {
    async get<T>(url: string, options?: RequestInit): Promise<T> {
        return await fetch(url, { method: "GET", ...options })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json() as Promise<T>;
            });

    }

    async post<T>(url: string, body: any, options?: RequestInit): Promise<T> {
        return await fetch(url, { method: "POST", body, ...options })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json() as Promise<T>;
            });
    }

    async put<T>(url: string, body: any, options?: RequestInit): Promise<T> {
        return await fetch(url, { method: "PUT", body, ...options })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json() as Promise<T>;
            });
    }

    async delete<T>(url: string, options?: RequestInit): Promise<T> {
        return await fetch(url, { method: "DELETE", ...options })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json() as Promise<T>;
            });
    }
}
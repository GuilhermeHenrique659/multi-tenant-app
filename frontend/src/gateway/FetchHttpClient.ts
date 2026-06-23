import type { UserProps } from "../model/User";
import type HttpClient from "./HttpClient";

export default class FetchHttpClient implements HttpClient {
    private _getUser() {
        const user = localStorage.getItem('user');

        if (!user) return null;

        return JSON.parse(user) as UserProps;
    }

    async get<T>(url: string, options?: RequestInit): Promise<T> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;

        return await fetch(url, { method: "GET", ...options, headers, })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json() as Promise<T>;
            });

    }

    async post<T>(url: string, body: any, options?: RequestInit): Promise<T> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;

        return await fetch(url, { method: "POST", body, ...options, headers })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json() as Promise<T>;
            });
    }

    async put<T>(url: string, body: any, options?: RequestInit): Promise<T> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;

        return await fetch(url, { method: "PUT", body, ...options, headers })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json() as Promise<T>;
            });
    }

    async delete<T>(url: string, options?: RequestInit): Promise<T> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;
        
        return await fetch(url, { method: "DELETE", ...options, headers })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json() as Promise<T>;
            });
    }
}
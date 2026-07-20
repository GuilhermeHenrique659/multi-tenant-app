import type { UserProps } from "../model/User";
import type HttpClient from "./HttpClient";
import { Result } from "../util/Result";

export default class FetchHttpClient implements HttpClient {
    private _getUser() {
        const user = localStorage.getItem('user');

        if (!user) return null;

        return JSON.parse(user) as UserProps;
    }

    async get<T>(url: string, options?: RequestInit): Promise<Result<T, Error>> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;

        try {
            const response = await fetch(url, { method: "GET", ...options, headers });

            if (!response.ok) {
                return Result.Error(new Error(`HTTP error! status: ${response.status}`));
            }

            const data = await response.json() as T;
            return Result.Ok(data);
        } catch (err) {
            return Result.Error(err instanceof Error ? err : new Error('Unknown error'));
        }
    }

    async post<T>(url: string, body: any, options?: RequestInit): Promise<Result<T, Error>> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;

        try {
            const response = await fetch(url, { 
                method: "POST", 
                body: JSON.stringify(body), 
                ...options, 
                headers: { ...headers, "Content-Type": "application/json" } 
            });

            if (!response.ok) {
                return Result.Error(new Error(`HTTP error! status: ${response.status}`));
            }

            const data = await response.json() as T;
            return Result.Ok(data);
        } catch (err) {
            return Result.Error(err instanceof Error ? err : new Error('Unknown error'));
        }
    }

    async put<T>(url: string, body: any, options?: RequestInit): Promise<Result<T, Error>> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;

        try {
            const response = await fetch(url, { method: "PUT", body, ...options, headers });

            if (!response.ok) {
                return Result.Error(new Error(`HTTP error! status: ${response.status}`));
            }

            const data = await response.json() as T;
            return Result.Ok(data);
        } catch (err) {
            return Result.Error(err instanceof Error ? err : new Error('Unknown error'));
        }
    }

    async patch<T>(url: string, body?: any, options?: RequestInit): Promise<Result<T, Error>> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;

        try {
            const response = await fetch(url, {
                method: "PATCH",
                body: body ? JSON.stringify(body) : undefined,
                ...options,
                headers: { ...headers, "Content-Type": "application/json" }
            });

            if (!response.ok) {
                return Result.Error(new Error(`HTTP error! status: ${response.status}`));
            }

            const data = await response.json() as T;
            return Result.Ok(data);
        } catch (err) {
            return Result.Error(err instanceof Error ? err : new Error('Unknown error'));
        }
    }

    async delete<T>(url: string, options?: RequestInit): Promise<Result<T, Error>> {
        const user = this._getUser();
        const headers: HeadersInit | undefined = user ? { ...options?.headers, 'x-user-id': user.id as string } : options?.headers;

        try {
            const response = await fetch(url, { method: "DELETE", ...options, headers });

            if (!response.ok) {
                return Result.Error(new Error(`HTTP error! status: ${response.status}`));
            }

            if (response.status === 204) {
                return Result.Ok(undefined as T);
            }

            const data = await response.json() as T;
            return Result.Ok(data);
        } catch (err) {
            return Result.Error(err instanceof Error ? err : new Error('Unknown error'));
        }
    }
}
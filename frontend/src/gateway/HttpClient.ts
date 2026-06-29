import type { Result } from "../util/Result";

export default interface HttpClient {
    get<T>(url: string, options?: RequestInit): Promise<Result<T, Error>>;
    post<T>(url: string, body: any, options?: RequestInit): Promise<Result<T, Error>>;
    put<T>(url: string, body: any, options?: RequestInit): Promise<Result<T, Error>>;
    delete<T>(url: string, options?: RequestInit): Promise<Result<T, Error>>;
}
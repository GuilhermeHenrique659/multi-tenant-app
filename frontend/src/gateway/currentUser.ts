import type { UserProps } from "../model/User";

/** The signed in user, kept in the local storage by the check in. */
export const currentUser = (): UserProps | null => {
    const user = localStorage.getItem('user');

    if (!user) return null;

    return JSON.parse(user) as UserProps;
}

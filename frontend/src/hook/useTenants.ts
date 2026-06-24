import { useSyncExternalStore } from "react";
import { tenantsStore, type Tenant, type TenantCollection } from "../model/Tenant";

export const useTenantStore = <T>(
    selector: (state: TenantCollection) => T
) => {

    return useSyncExternalStore(
        tenantsStore.subscribe,
        () => selector(tenantsStore.getState())
    );
}

export const useTenants = () => {
    return useTenantStore(s => s);
}

export const useTenant = (id: string | null): Tenant | null => {
    return useTenantStore(state =>
        id === null
            ? null
            : state.tenants.find(
                t => t.props.id === id
            ) ?? null
    );
}

export const useTenantActions = () => {
    return {
        updateTenant: (tenant: Tenant) => {
            tenantsStore.setState((collection) => {
                const updated = collection.tenants.map(t => t.props.id === tenant.props.id ? tenant : t);

                return { tenants: updated };
            });
        }
    };
}
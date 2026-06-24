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
            : state.tenants.get(id) ?? null
    );
}

export const useTenantActions = () => {
    return {
        updateTenant: (tenant: Tenant) => {
            tenantsStore.setState((collection) => {
                const updated = collection.tenants.set(tenant.props.id, tenant);

                return { tenants: updated };
            });
        }
    };
}
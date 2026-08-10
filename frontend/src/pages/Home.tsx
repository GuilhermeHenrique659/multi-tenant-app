import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FetchHttpClient from "../gateway/FetchHttpClient";
import TenantHttpGateway from "../gateway/tenant/TenantHttpGateway";
import { tenantsStore } from "../model/Tenant";
import { useTenant, useTenantActions, useTenantStore } from "../hook/useTenants";
import { ModelToMapFn } from "../util/ArrayUtil";
import { ModelCollection } from "../model/common/Collection";
import { unwrapOrElse } from "../util/Result";
import TenantCard from "../components/molecules/TenantCard";
import TenantModal from "../components/organisms/TenantModal";

export default function Home() {
  const navigate = useNavigate();
  const tenantsCollection = useTenantStore((s) => s);
  const tenentActions = useTenantActions();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const selectedTenant = useTenant(selectedTenantId);

  const tenantGateway = new TenantHttpGateway(new FetchHttpClient());

  useEffect(() => {
    tenantGateway.getList().then((tenants) =>
      tenantsStore.setState(() => ({
        tenants: ModelCollection.from(tenants.unwrapOr([]), ModelToMapFn),
      })),
    );
  }, []);

  const showTenantDetails = (tenantId: string) => async () => {
    const tenant = await tenantGateway
      .getById(tenantId)
      .then(unwrapOrElse(alert));

    if (!tenant) return;

    tenentActions.updateTenant(tenant);

    setSelectedTenantId(tenant.props.id);
  };

  return (
    <div className="home">
      <h1>Home</h1>

      <div className="tenant-grid">
        {tenantsCollection.tenants.values().map((tenant) => (
          <TenantCard
            key={tenant.props.id}
            tenant={tenant}
            onViewDetails={showTenantDetails(tenant.props.id)}
            onOpenProjects={() => navigate(`/tenants/${tenant.props.id}/projects`)}
          />
        ))}
      </div>

      {selectedTenant ? (
        <TenantModal
          tenant={selectedTenant}
          onClose={() => setSelectedTenantId(null)}
        />
      ) : null}
    </div>
  );
}

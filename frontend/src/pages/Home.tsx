import { useEffect, useState } from "react";
import FetchHttpClient from "../gateway/FetchHttpClient";
import TenantHttpGateway from "../gateway/tenant/TenantHttpGateway";
import { AddUser, RemoveUser, type Tenant } from "../model/Tenant";
import { Create } from "../model/User";

type Props = {
  tenant: Tenant;
  onClose: () => void;
  onChange: (tenant: Tenant) => void;
};

function TenantModal({ tenant, onClose, onChange }: Props) {
  const handleAddUser = () => {
    try {
      const updated = AddUser(
        tenant,
        Create({
          name: "test",
          email: "test@gmail.com",
          id: crypto.randomUUID(), //place holder,
        }),
        "member",
      );

      onChange(updated);
    } catch (err) {
      alert(err);
    }
  };

  const handleRemoveUser = (userId?: string) => () => {
    if (!userId) return;

    try {
      const updated = RemoveUser(tenant, userId);

      onChange(updated);
    } catch (err) {
      alert(err);
    }
  };

  return (
    <dialog open>
      <h1>{tenant.props.name}</h1>

      <button onClick={handleAddUser}>Add user</button>

      <p>Lista de membros</p>
      {tenant.members.map((member, index) => (
        <div key={index}>
          <p>{member.user.name}</p>
          <p>{member.role}</p>
          <button onClick={handleRemoveUser(member.user.id)}>
            Remover user
          </button>
        </div>
      ))}

      <button onClick={onClose}>Close</button>
    </dialog>
  );
}

export default function Home() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tenantGateway = new TenantHttpGateway(new FetchHttpClient());

  useEffect(() => {
    tenantGateway.getList().then(setTenants);
  }, []);

  const showTenantDetails = (tenantId: string) => async () => {
    const tenant = await tenantGateway.getById(tenantId);

    if (!tenant) return;

    setTenants((tenants) =>
      tenants.map((t) => (t.props.id === tenantId ? tenant : t)),
    );

    setIsModalOpen(true);
    setSelectedTenantId(tenant.props.id);
  };

  return (
    <div>
      <h1>Home</h1>

      <p>Lista</p>
      {tenants.map((tenant) => {
        return (
          <div key={tenant.props.id}>
            <p>{tenant.props.name}</p>
            <button onClick={showTenantDetails(tenant.props.id)}>
              View details
            </button>
          </div>
        );
      })}

      {isModalOpen && selectedTenantId ? (
        <TenantModal
          tenant={tenants.find((t) => t.props.id === selectedTenantId)!}
          onClose={() => setSelectedTenantId(null)}
          onChange={(tenant) =>
            setTenants((tenants) =>
              tenants.map((t) => (t.props.id === tenant.props.id ? tenant : t)),
            )
          }
        />
      ) : (
        <></>
      )}
    </div>
  );
}

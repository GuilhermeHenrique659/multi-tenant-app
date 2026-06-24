import { useEffect, useState } from "react";
import FetchHttpClient from "../gateway/FetchHttpClient";
import TenantHttpGateway from "../gateway/tenant/TenantHttpGateway";
import { RemoveUser, tenantsStore, type Tenant } from "../model/Tenant";
import { Create, type User } from "../model/User";
import {
  useTenant,
  useTenantActions,
  useTenantStore,
} from "../hook/useTenants";
import type UserGateway from "../gateway/user/UserGateway";
import { AddMember } from "../application/tenant/AddMember";
import { ModelToMapFn } from "../util/ArrayUtil";
import { ModelCollection } from "../model/common/Collection";

class MockUser implements UserGateway {
  async getByName(name: string): Promise<User | null> {
    return Create({
      name: "test",
      email: "test@gmail.com",
      id: "f0169313-d64e-4065-8085-21e9b5e4c380", //place holder,
    });
  }
}

type Props = {
  tenant: Tenant;
  onClose: () => void;
};

function TenantModal({ tenant, onClose }: Props) {
  const tenentActions = useTenantActions();

  const addMemeber = AddMember({
    tenantGateway: new TenantHttpGateway(new FetchHttpClient()),
    userGateway: new MockUser(),
  });

  const handleAddUser = async () => {
    const updated = await addMemeber({
      tenant,
      member: {
        user: {
          name: "test",
          email: "test@gmail.com",
        },
        role: "member",
      },
    });
    if (updated instanceof Error) alert(updated);
    else tenentActions.updateTenant(updated);
  };

  const handleRemoveUser = (userId?: string) => () => {
    if (!userId) return;

    try {
      const updated = RemoveUser(tenant, userId);

      tenentActions.updateTenant(updated);
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
  const tenantsCollection = useTenantStore((s) => s);
  const tenentActions = useTenantActions();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const selectedTenant = useTenant(selectedTenantId);

  const tenantGateway = new TenantHttpGateway(new FetchHttpClient());

  useEffect(() => {
    tenantGateway
      .getList()
      .then((tenants) =>
        tenantsStore.setState(() => ({
          tenants: ModelCollection.from(tenants, ModelToMapFn),
        })),
      );
  }, []);

  const showTenantDetails = (tenantId: string) => async () => {
    const tenant = await tenantGateway.getById(tenantId);

    if (!tenant) return;

    tenentActions.updateTenant(tenant);

    setSelectedTenantId(tenant.props.id);
  };

  return (
    <div>
      <h1>Home</h1>

      <p>Lista</p>
      {tenantsCollection.tenants.values().map((tenant) => {
        return (
          <div key={tenant.props.id}>
            <p>{tenant.props.name}</p>
            <button onClick={showTenantDetails(tenant.props.id)}>
              View details
            </button>
          </div>
        );
      })}

      {selectedTenant ? (
        <TenantModal
          tenant={selectedTenant}
          onClose={() => setSelectedTenantId(null)}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

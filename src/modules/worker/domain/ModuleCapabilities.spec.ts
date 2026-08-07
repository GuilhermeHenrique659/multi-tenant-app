import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Permissions } from '../../@common/Permissions.js';
import { ModuleCapabilities } from './ModuleCapabilities.js';

describe('ModuleCapabilities', () => {
    it('declares every action only once', () => {
        const actions = ModuleCapabilities.map(capability => capability.action);

        assert.equal(new Set(actions).size, actions.length);
    });

    it('declares permissions that exist in the permission map', () => {
        for (const capability of ModuleCapabilities) {
            assert.ok(capability.permissions.length > 0, `${capability.action} has no permission`);

            for (const permission of capability.permissions) {
                assert.ok(Permissions.has(permission), `unknown permission ${permission} on ${capability.action}`);
            }
        }
    });

    it('always requires the tenant and the user of the context in the input', () => {
        for (const capability of ModuleCapabilities) {
            assert.deepEqual(
                ['tenantId', 'userId'].filter(field => capability.input.required?.includes(field)),
                ['tenantId', 'userId'],
                `${capability.action} does not require the context fields`,
            );
        }
    });

    it('does not expose the tenant creation nor the tenant listing', () => {
        const actions = ModuleCapabilities.map(capability => capability.action);

        assert.ok(!actions.includes('createTenant'));
        assert.ok(!actions.includes('listTenants'));
    });
});

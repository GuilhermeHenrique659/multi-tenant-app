export type CapabilityFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export type CapabilityField = {
    type: CapabilityFieldType | CapabilityFieldType[];
    description?: string;
    enum?: string[];
    properties?: Record<string, CapabilityField>;
    required?: string[];
    additionalProperties?: false;
    items?: CapabilityField;
};

export type CapabilitySchema = CapabilityField;

type ModuleCapabilities = {
    action: string;
    compensation?: string
    input: CapabilitySchema;
    output: CapabilitySchema;
    permissions: string[];
}

const CONTEXT_FIELDS = {
    tenantId: { type: 'string', description: 'tenant that owns the operation, always taken from the context' },
    userId: { type: 'string', description: 'user performing the operation, always taken from the context' },
} satisfies Record<string, CapabilityField>;

const TASK_ITEM: CapabilityField = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string', enum: ['screen', 'working', 'review', 'done'] },
        startAt: { type: ['string', 'null'] },
        endAt: { type: ['string', 'null'] },
        projectId: { type: 'string' },
        assigneeId: { type: ['string', 'null'] },
        createdAt: { type: 'string' },
    },
    required: ['id', 'name', 'status', 'projectId', 'createdAt'],
    additionalProperties: false,
};

/**
 * Every use case a agent is allowed to run, with the json schema of its input and output.
 * `createTenant` and `listTenants` are intentionally absent: a agent never creates nor lists tenants.
 */
export const ModuleCapabilities: ModuleCapabilities[] = [
    {
        action: "createProject",
        input: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                ...CONTEXT_FIELDS,
            },
            required: ["name", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
            },
            required: ["projectId"],
            additionalProperties: false,
        },
        permissions: ["project:create"]
    },
    {
        action: "listProjects",
        input: {
            type: 'object',
            properties: { ...CONTEXT_FIELDS },
            required: ["tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'closed'] },
                    tenantId: { type: 'string' },
                    createdAt: { type: 'string' },
                },
                required: ["id", "name", "status", "tenantId", "createdAt"],
                additionalProperties: false,
            },
        },
        permissions: ["project:read"]
    },
    {
        action: "addTask",
        input: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                projectId: { type: 'string' },
                ...CONTEXT_FIELDS,
            },
            required: ["name", "projectId", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                taskId: { type: 'string' },
            },
            required: ["taskId"],
            additionalProperties: false,
        },
        permissions: ["task:assign"]
    },
    {
        action: "updateTask",
        input: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'id of the task being updated' },
                projectId: { type: 'string' },
                name: { type: 'string' },
                status: { type: 'string', enum: ['screen', 'working', 'review', 'done'] },
                startAt: { type: 'string', description: 'ISO date' },
                endAt: { type: 'string', description: 'ISO date' },
                ...CONTEXT_FIELDS,
            },
            required: ["id", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                taskId: { type: 'string' },
            },
            required: ["taskId"],
            additionalProperties: false,
        },
        permissions: ["task:update"]
    },
    {
        action: "assignTask",
        input: {
            type: 'object',
            properties: {
                taskId: { type: 'string' },
                assigneeId: { type: 'string', description: 'user that receives the task' },
                ...CONTEXT_FIELDS,
            },
            required: ["taskId", "assigneeId", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                taskId: { type: 'string' },
            },
            required: ["taskId"],
            additionalProperties: false,
        },
        permissions: ["task:assign"]
    },
    {
        action: "listTasks",
        input: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...CONTEXT_FIELDS,
            },
            required: ["projectId", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'array',
            items: TASK_ITEM,
        },
        permissions: ["task:read"]
    },
    {
        action: "getTask",
        input: {
            type: 'object',
            properties: {
                taskId: { type: 'string' },
                ...CONTEXT_FIELDS,
            },
            required: ["taskId", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                ...TASK_ITEM.properties,
                assignee: {
                    type: ['object', 'null'],
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                    },
                    required: ["id", "name", "email"],
                    additionalProperties: false,
                },
            },
            required: [...TASK_ITEM.required!],
            additionalProperties: false,
        },
        permissions: ["task:read"]
    },
    {
        action: "addMember",
        input: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'name of the user being added' },
                email: { type: 'string', description: 'email of the user being added' },
                role: { type: 'string', enum: ['admin', 'member'] },
                targetUserId: { type: 'string', description: 'id of an existing user, when it is already known' },
                ...CONTEXT_FIELDS,
            },
            required: ["name", "email", "role", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                tenantId: { type: 'string' },
                userId: { type: 'string', description: 'id of the user added to the tenant' },
            },
            required: ["tenantId", "userId"],
            additionalProperties: false,
        },
        permissions: ["tenant:user:add"]
    },
    {
        action: "updateMember",
        input: {
            type: 'object',
            properties: {
                memberUserId: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'member'] },
                ...CONTEXT_FIELDS,
            },
            required: ["memberUserId", "role", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                tenantId: { type: 'string' },
                userId: { type: 'string', description: 'id of the member whose role changed' },
                newRole: { type: 'string', enum: ['admin', 'member'] },
            },
            required: ["tenantId", "userId", "newRole"],
            additionalProperties: false,
        },
        permissions: ["tenant:user:edit"]
    },
    {
        action: "removeMember",
        input: {
            type: 'object',
            properties: {
                memberUserId: { type: 'string' },
                ...CONTEXT_FIELDS,
            },
            required: ["memberUserId", "tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                tenantId: { type: 'string' },
                userId: { type: 'string', description: 'id of the removed member' },
            },
            required: ["tenantId", "userId"],
            additionalProperties: false,
        },
        permissions: ["tenant:user:remove"]
    },
    {
        action: "getTenant",
        input: {
            type: 'object',
            properties: { ...CONTEXT_FIELDS },
            required: ["tenantId", "userId"],
            additionalProperties: false,
        },
        output: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                maxNumberOfMembers: { type: 'number' },
                createdAt: { type: 'string' },
                members: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                },
                                required: ["id", "name"],
                                additionalProperties: false,
                            },
                            role: { type: 'string', enum: ['admin', 'member'] },
                        },
                        required: ["user", "role"],
                        additionalProperties: false,
                    },
                },
            },
            required: ["id", "name", "maxNumberOfMembers", "createdAt", "members"],
            additionalProperties: false,
        },
        permissions: ["tenant:details:view"]
    },
]

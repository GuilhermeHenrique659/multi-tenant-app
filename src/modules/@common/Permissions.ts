export const Permissions = new Map([
    ["tenant:user:read", ["admin", "member"]],
    ["tenant:user:add", ["admin"]],
    ["tenant:user:remove", ["admin"]],
    ["tenant:user:edit", ["admin"]],
    ["tenant:details:view", ["admin", "member"]],
    ["tenant:list", ["admin", "member"]],
    ["tenant:read", ["admin", "member"]],
    ["project:create", ["admin"]],
    ["task:assign", ["admin"]],
    ["task:update", ["admin", "member"]],
    ["task:read", ["admin", "member"]],
]); 
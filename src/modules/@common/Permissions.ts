export const Permissions = new Map([
    ["tenant:users:read", ["admin", "member"]],
    ["tenant:user:add", ["admin"]],
    ["tenant:user:remove", ["admin"]],
    ["tenant:user:updateRole", ["admin"]],
    ["tenant:details:view", ["admin", "member"]],
    ["tenant:list", ["admin", "member"]],
]); 
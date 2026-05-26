export const Permissions = new Map([
    ["tenant:user:read", ["admin", "member"]],
    ["tenant:user:add", ["admin"]],
    ["tenant:user:remove", ["admin"]],
    ["tenant:user:edit", ["admin"]],
    ["tenant:details:view", ["admin", "member"]],
    ["tenant:list", ["admin", "member"]],
    ["tenant:read", ["admin", "member"]]
]); 
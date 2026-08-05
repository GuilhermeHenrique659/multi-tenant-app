type ModuleCapabilities = {
    action: string;
    compensation?: string
    input: string;
    output: string;
    permissions: string[];
}

export const ModuleCapabilities: ModuleCapabilities[] = [
    {
        action: "createProject",
        input: "{ name: string}",
        output: "{ projectId: string, tenantId: string, userId: string }",
        permissions: ["admin"]
    },
    {
        action: "createTask",
        input: "{ name: string, projectId: string, tenantId: string, userId: string }",
        output: "{ taskId: string }",
        permissions: ["admin", "member"]
    },
    {
        action: "updateTask",
        input: "{ taskId: string, name?: string, status?: string, tenantId: string, userId: string }",
        output: "{ taskId: string }",
        permissions: ["admin", "member"]
    },
    {
        action: "assignTask",
        input: "{ taskId: string, tenantId: string, userId: string }",
        output: "{ taskId: string }",
        permissions: ["admin", "member"]
    },
    {
        action: "listTasks",
        input: "{ tenantId: string, userId: string, projectId: string }",
        output: "{ taskId: string }",
        permissions: ["admin", "member"]
    },

]
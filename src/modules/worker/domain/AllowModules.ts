type AllowModulesType = {
    action: string;
    input: string;
    output: string;
    permissions: string[];
}

export const AllowModules: AllowModulesType[] = [
    {
        action: "createProject",
        input: "{ name: string}",
        output: "{ projectId: string }",
        permissions: ["admin"]
    },
    {
        action: "createTask",
        input: "{ name: string, projectId: string }",
        output: "{ taskId: string }",
        permissions: ["admin", "user"]
    },
    {
        action: "updateTask",
        input: "{ taskId: string, name?: string, status?: string }",
        output: "{ taskId: string }",
        permissions: ["admin", "user"]
    },
    {
        action: "assignTask",
        input: "{ taskId: string, userId: string }",
        output: "{ taskId: string }",
        permissions: ["admin"]
    }
]
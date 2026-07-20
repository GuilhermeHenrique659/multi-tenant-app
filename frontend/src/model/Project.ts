import { z } from "zod";
import { createStore } from "./common/Storage";
import { ModelCollection } from "./common/Collection";

const ProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    tenantId: z.string(),
    createdAt: z.string(),
});

type ProjectProps = z.infer<typeof ProjectSchema>;

export type Project = Readonly<{
    props: Readonly<ProjectProps>;
}>;

type ProjectId = string;

export type ProjectCollection = {
    projects: ModelCollection<ProjectId, Project>;
};

export const Create = (data: Record<string, unknown>): Project => {
    const props = ProjectSchema.parse(data);
    return { props };
};

export const From = (data: unknown): Project | null => {
    const result = ProjectSchema.safeParse(data);
    if (!result.success) return null;
    return { props: result.data };
};

export const UpdateStatus = (project: Project, status: string): Project => {
    return { props: { ...project.props, status } };
};

export const projectsStore = createStore<ProjectCollection>({ projects: new ModelCollection(new Map()) });

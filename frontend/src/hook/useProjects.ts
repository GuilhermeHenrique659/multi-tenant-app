import { useSyncExternalStore } from "react";
import { projectsStore, type Project, type ProjectCollection } from "../model/Project";
import { tasksStore, type Task, type TaskCollection } from "../model/Task";
import { ModelCollection } from "../model/common/Collection";
import { ModelToMapFn } from "../util/ArrayUtil";

export const useProjectStore = <T>(
    selector: (state: ProjectCollection) => T
) => {
    return useSyncExternalStore(
        projectsStore.subscribe,
        () => selector(projectsStore.getState())
    );
}

export const useProjects = () => {
    return useProjectStore(s => s);
}

export const useProject = (id: string | null): Project | null => {
    return useProjectStore(state =>
        id === null
            ? null
            : state.projects.get(id) ?? null
    );
}

export const useProjectActions = () => {
    return {
        updateProject: (project: Project) => {
            projectsStore.setState((collection) => ({
                projects: collection.projects.set(project.props.id, project)
            }));
        },
        removeProject: (id: string) => {
            projectsStore.setState((collection) => ({
                projects: collection.projects.delete(id)
            }));
        },
        setProjects: (projects: Project[]) => {
            projectsStore.setState(() => ({
                projects: ModelCollection.from(projects, ModelToMapFn)
            }));
        }
    };
}

export const useTaskStore = <T>(
    selector: (state: TaskCollection) => T
) => {
    return useSyncExternalStore(
        tasksStore.subscribe,
        () => selector(tasksStore.getState())
    );
}

export const useTasksByProject = (projectId: string | null): Task[] => {
    return useTaskStore(state =>
        projectId === null
            ? []
            : state.tasks.values().filter(t => t.props.projectId === projectId)
    );
}

export const useTask = (id: string | null): Task | null => {
    return useTaskStore(state =>
        id === null ? null : state.tasks.get(id) ?? null
    );
}

export const useTaskActions = () => {
    return {
        updateTask: (task: Task) => {
            tasksStore.setState((collection) => ({
                tasks: collection.tasks.set(task.props.id, task)
            }));
        },
        removeTask: (id: string) => {
            tasksStore.setState((collection) => ({
                tasks: collection.tasks.delete(id)
            }));
        },
        setTasks: (tasks: Task[]) => {
            tasksStore.setState(() => ({
                tasks: ModelCollection.from(tasks, ModelToMapFn)
            }));
        }
    };
}

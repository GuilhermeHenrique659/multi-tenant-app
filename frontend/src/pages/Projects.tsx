import { useParams } from "react-router-dom";
import ProjectsNavBar from "../components/ProjectsNavBar";
import TaskList from "../components/TaskList";
import {
  useProject,
  useProjectActions,
  useProjectStore,
} from "../hook/useProjects";
import FetchHttpClient from "../gateway/FetchHttpClient";
import ProjectHttpGateway from "../gateway/project/ProjectHttpGateway";
import { ListProjects } from "../application/project/ListProjects";
import { ModelCollection } from "../model/common/Collection";
import { ModelToMapFn } from "../util/ArrayUtil";
import { useEffect, useState } from "react";
import { projectsStore } from "../model/Project";

export default function Projects() {
  const { tenantId } = useParams();
  const projectCollection = useProjectStore((s) => s);
  const projectActions = useProjectActions();
  const [selectProjectId, setSelectProjectId] = useState<string | null>(null);

  const selectedProject = useProject(selectProjectId);

  const projectGateway = new ProjectHttpGateway(new FetchHttpClient());
  const listProjects = ListProjects({ projectGateway });

  useEffect(() => {
    if (!tenantId) return;

    listProjects({ tenantId }).then((projects) =>
      projectsStore.setState(() => ({
        projects: ModelCollection.from(projects.unwrapOr([]), ModelToMapFn),
      })),
    );
  }, [tenantId]);

  return (
    <div className="projects-page">
      {tenantId ? (
        <ProjectsNavBar
          tenantId={tenantId}
          projects={projectCollection.projects.values()}
          selectedProjectId={selectProjectId}
          onSelectProject={setSelectProjectId}
        />
      ) : null}
      {selectedProject && tenantId ? (
        <TaskList tenantId={tenantId} project={selectedProject} />
      ) : (
        <div className="projects-content">
          <p className="empty-state">Select a project to view tasks</p>
        </div>
      )}
    </div>
  );
}

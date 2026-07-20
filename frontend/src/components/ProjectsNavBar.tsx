import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "../model/Project";
import { useProjectActions } from "../hook/useProjects";
import FetchHttpClient from "../gateway/FetchHttpClient";
import ProjectHttpGateway from "../gateway/project/ProjectHttpGateway";
import { CreateProject } from "../application/project/CreateProject";
import { unwrapOrElse } from "../util/Result";

interface ProjectsNavBarProps {
  tenantId: string;
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export default function ProjectsNavBar({ tenantId, projects, selectedProjectId, onSelectProject }: ProjectsNavBarProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const projectActions = useProjectActions();

  const handleAddProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    const httpClient = new FetchHttpClient();
    const projectGateway = new ProjectHttpGateway(httpClient);

    const project = await CreateProject({ projectGateway })({ tenantId, name: name.trim() }).then(
      unwrapOrElse(alert),
    );

    if (project) {
      projectActions.updateProject(project);
      setName("");
      onSelectProject(project.props.id);
    }
  };

  return (
    <aside className="projects-sidebar">
      <button className="btn btn--small" onClick={() => navigate('/')} style={{ alignSelf: 'flex-start' }}>Home</button>
      <div className="projects-sidebar-header">
        <h2>Projects</h2>
      </div>
      <form className="projects-form" onSubmit={handleAddProject}>
        <input
          className="form-input"
          type="text"
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn--primary btn--small" type="submit">Add</button>
      </form>
      <nav className="projects-nav">
        {projects.map((project) => (
          <button
            key={project.props.id}
            className={`projects-nav-item${selectedProjectId === project.props.id ? ' projects-nav-item--active' : ''}`}
            onClick={() => onSelectProject(project.props.id)}
          >
            <span className={`project-status project-status--${project.props.status === 'active' ? 'active' : 'closed'}`} />
            <span className="projects-nav-name">{project.props.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

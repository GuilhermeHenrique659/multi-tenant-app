import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "../../model/Project";
import { useProjectActions } from "../../hook/useProjects";
import FetchHttpClient from "../../gateway/FetchHttpClient";
import ProjectHttpGateway from "../../gateway/project/ProjectHttpGateway";
import { CreateProject } from "../../application/project/CreateProject";
import { unwrapOrElse } from "../../util/Result";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import StatusDot from "../atoms/StatusDot";

type ProjectsNavBarProps = {
  tenantId: string;
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export default function ProjectsNavBar({ tenantId, projects, selectedProjectId, onSelectProject }: Readonly<ProjectsNavBarProps>) {
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
      <Button size="small" onClick={() => navigate('/')} style={{ alignSelf: 'flex-start' }}>Home</Button>
      <div className="projects-sidebar-header">
        <h2>Projects</h2>
      </div>
      <form className="projects-form" onSubmit={handleAddProject}>
        <Input
          type="text"
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button variant="primary" size="small" type="submit">Add</Button>
      </form>
      <nav className="projects-nav">
        {projects.map((project) => (
          <button
            key={project.props.id}
            className={`projects-nav-item${selectedProjectId === project.props.id ? ' projects-nav-item--active' : ''}`}
            onClick={() => onSelectProject(project.props.id)}
          >
            <StatusDot tone={project.props.status === 'active' ? 'active' : 'closed'} />
            <span className="projects-nav-name">{project.props.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

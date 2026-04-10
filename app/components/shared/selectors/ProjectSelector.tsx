"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { setCurrentProject } from "@/app/redux/slices/projectSlice";
import { getTasksByProject } from "@/app/redux/controllers/taskController";

export default function ProjectSelector() {
  const dispatch = useAppDispatch();

  const { projects, currentProjectId } = useAppSelector(
    (state) => state.project
  );

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;

    dispatch(setCurrentProject(projectId));

    // 🔥 load tasks for selected project
    await dispatch(getTasksByProject(projectId));
  };

  return (
    <div>
      <label className="block mb-1 text-sm font-medium">
        Select Project
      </label>

      <select
        value={currentProjectId ?? ""}
        onChange={handleChange}
        className="p-2 border rounded w-full"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
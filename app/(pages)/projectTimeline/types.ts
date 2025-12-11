// A single project in the timeline
export interface ProjectTimelineItem {
  id: string;
  name: string;
  startDate: string; // ISO format from DB
  endDate: string;   // ISO format from DB
}

// Props for the Header (date row)
export interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
}

// Props for the Project bar
export interface TimelineProjectBarProps {
  project: ProjectTimelineItem;
  timelineStart: Date;
}

// Grid background lines
export interface TimelineGridProps {
  startDate: Date;
  endDate: Date;
}

export interface TimelineFilterProps {
  filter: string;
  setFilter: (value: string) => void;
}

export interface TimelineContainerProps {
  children: React.ReactNode;
}

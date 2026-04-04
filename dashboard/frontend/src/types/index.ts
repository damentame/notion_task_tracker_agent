export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
}

export interface WorkflowRun {
  workflow_id: string;
  workflow_type: string;
  status: WorkflowStatus;
  project_id: string;
  project_name?: string;
  started_at: string;
  completed_at?: string;
  duration?: number;
}

export type WorkflowStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ActivityRun {
  activity_id: string;
  activity_name: string;
  activity_type: string;
  status: ActivityStatus;
  started_at: string;
  completed_at?: string;
  duration?: number;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error?: string;
}

export type ActivityStatus = 'SCHEDULED' | 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface Task {
  id: string;
  project_id: string;
  workflow_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Teammate {
  id: string;
  name: string;
  role: string;
  department?: string;
  avatar: string;
  maxCapacityPerWeek: number;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  tasklistId: string;
  tasklistName: string;
  title: string;
  description: string;
  assigneeId: string; // Primary/legacy
  assigneeIds: string[]; // Support for multiple
  userHourSplits: Record<string, number>; // Mapping userId -> hours
  userLoggedSplits?: Record<string, number>; // Mapping userId -> logged hours
  startDate: string;
  deadline: string;
  allocatedHours: number;
  loggedHours: number;
  monthlyLoggedHours: number;
  isRowApproved: boolean;
  isVirtual?: boolean;
  focusedTimeEntries?: any[];
}

export interface ProposedChange {
  taskId: string;
  field: keyof Task;
  oldValue: any;
  newValue: any;
  approved: boolean; // This is now redundant but kept for logic
}

export const MOCK_TEAMMATES: Teammate[] = [
  { id: '1', name: 'Alex Rivera', role: 'Solutions Architect', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', maxCapacityPerWeek: 35 },
  { id: '2', name: 'Sarah Chen', role: 'Full Stack Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', maxCapacityPerWeek: 30 },
  { id: '3', name: 'James Wilson', role: 'Data Analyst', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', maxCapacityPerWeek: 38 },
  { id: '4', name: 'Elena Rodriguez', role: 'Delivery Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', maxCapacityPerWeek: 25 },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', projectId: 'p1', projectName: 'Global SEO Audit', tasklistId: 'l1', tasklistName: 'Production', title: 'Technical Site Review', description: 'Deep dive into crawl errors and indexing issues.', assigneeId: '1', assigneeIds: ['1'], userHourSplits: {'1': 12}, startDate: '2026-06-01', deadline: '2026-06-15', allocatedHours: 12, loggedHours: 4, monthlyLoggedHours: 4, isRowApproved: false },
  { id: 't2', projectId: 'p1', projectName: 'Global SEO Audit', tasklistId: 'l1', tasklistName: 'Production', title: 'Keyword Research', description: 'Competitor mapping for main verticals.', assigneeId: '2', assigneeIds: ['2'], userHourSplits: {'2': 8}, startDate: '2026-06-05', deadline: '2026-06-20', allocatedHours: 8, loggedHours: 0, monthlyLoggedHours: 0, isRowApproved: false },
  { id: 't3', projectId: 'p2', projectName: 'E-commerce Migration', tasklistId: 'l2', tasklistName: 'Development', title: 'Data Mapping', description: 'Lining up Shopify fields with legacy DB.', assigneeId: '2', assigneeIds: ['2'], userHourSplits: {'2': 15}, startDate: '2026-06-20', deadline: '2026-07-05', allocatedHours: 15, loggedHours: 2, monthlyLoggedHours: 2, isRowApproved: false },
  { id: 't4', projectId: 'p2', projectName: 'E-commerce Migration', tasklistId: 'l2', tasklistName: 'Development', title: 'API Integration', description: 'Auth flow for loyalty program.', assigneeId: '1', assigneeIds: ['1'], userHourSplits: {'1': 20}, startDate: '2026-07-01', deadline: '2026-07-12', allocatedHours: 20, loggedHours: 0, monthlyLoggedHours: 0, isRowApproved: false },
  { id: 't5', projectId: 'p3', projectName: 'Content Velocity', tasklistId: 'l3', tasklistName: 'Content', title: 'Topic Cluster Strategy', description: 'Editorial calendar development.', assigneeId: '4', assigneeIds: ['4'], userHourSplits: {'4': 10}, startDate: '2026-06-01', deadline: '2026-06-10', allocatedHours: 10, loggedHours: 6, monthlyLoggedHours: 6, isRowApproved: false },
  { id: 't6', projectId: 'p3', projectName: 'Content Velocity', tasklistId: 'l3', tasklistName: 'Content', title: 'Monthly Reporting', description: 'Performance metrics dashboard.', assigneeId: '3', assigneeIds: ['3'], userHourSplits: {'3': 6}, startDate: '2026-06-01', deadline: '2026-06-05', allocatedHours: 6, loggedHours: 0, monthlyLoggedHours: 0, isRowApproved: false },
  { id: 't7', projectId: 'p1', projectName: 'Global SEO Audit', tasklistId: 'l1', tasklistName: 'Production', title: 'Schema Markup Implementation', description: 'Implementing JSON-LD across product pages.', assigneeId: '2', assigneeIds: ['2'], userHourSplits: {'2': 10}, startDate: '2026-06-10', deadline: '2026-06-25', allocatedHours: 10, loggedHours: 0, monthlyLoggedHours: 0, isRowApproved: false },
  { id: 't8', projectId: 'p4', projectName: 'Brand Refresh', tasklistId: 'l4', tasklistName: 'Design', title: 'Logo Refinement', description: 'Vectorizing and polishing final concepts.', assigneeId: '4', assigneeIds: ['4'], userHourSplits: {'4': 14}, startDate: '2026-06-10', deadline: '2026-06-18', allocatedHours: 14, loggedHours: 0, monthlyLoggedHours: 0, isRowApproved: false },
];

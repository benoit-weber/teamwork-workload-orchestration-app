/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { 
  Download, 
  LayoutDashboard, 
  BarChart3, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Users,
  Search,
  ArrowRight,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { Logo } from './components/Logo';
import { Task, Teammate, ProposedChange } from './types';
import { cn } from './lib/utils';
import { format, startOfWeek, addWeeks, isSameWeek, parseISO, parse } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine,
  Legend,
  ComposedChart,
  Line,
  Area
} from 'recharts';

type Step = 'extract' | 'plan' | 'stage';

function SortableHeader({ 
  label, 
  field, 
  currentSort, 
  order, 
  onSort,
  center
}: { 
  label: string; 
  field: keyof Task; 
  currentSort: keyof Task; 
  order: 'asc' | 'desc'; 
  onSort: (field: keyof Task) => void;
  center?: boolean;
}) {
  const active = currentSort === field;
  return (
    <th 
      className={cn(
        "px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors",
        center && "text-center"
      )}
      onClick={() => onSort(field)}
    >
      <div className={cn("flex items-center gap-1", center && "justify-center")}>
        {label}
        {active && (
          <span className="text-brand-orange animate-pulse">
            {order === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}

interface TaskRowProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  teammates: Teammate[];
  extractUserIds: string[];
  originalTask?: Task;
}

const TaskRow: React.FC<TaskRowProps> = ({ 
  task, 
  onUpdate, 
  teammates, 
  extractUserIds,
  originalTask
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const dailyBreakdown = useMemo(() => {
    const entries = task.focusedTimeEntries || [];
    const map: Record<string, { totalHours: number; details: { name: string; hours: number; desc: string }[] }> = {};
    
    entries.forEach(entry => {
      let rawDate = entry.date || 'No Date';
      if (rawDate && rawDate.includes("T")) {
        rawDate = rawDate.split("T")[0];
      }
      if (!map[rawDate]) {
        map[rawDate] = { totalHours: 0, details: [] };
      }
      const hours = Number(entry.hours) || 0;
      map[rawDate].totalHours += hours;
      map[rawDate].details.push({
        name: entry.personName || 'Unknown',
        hours,
        desc: entry.description || ''
      });
    });
    
    return Object.entries(map)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateStr, data]) => {
        let dateLabel = dateStr;
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            dateLabel = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', weekday: 'short' });
          }
        } catch (e) {}
        
        return {
          dateStr,
          dateLabel,
          totalHours: data.totalHours,
          details: data.details
        };
      });
  }, [task.focusedTimeEntries]);

  const isFieldChanged = (field: keyof Task) => {
    if (task.isVirtual) return false;
    if (!originalTask) return false;
    if (field === 'userHourSplits') {
      return JSON.stringify(task[field]) !== JSON.stringify(originalTask[field]);
    }
    return task[field] !== originalTask[field];
  };

  const isChanged = useMemo(() => {
    if (task.isVirtual) return false;
    if (!originalTask) return false;
    return (
      task.title !== originalTask.title ||
      task.description !== originalTask.description ||
      task.startDate !== originalTask.startDate ||
      task.deadline !== originalTask.deadline ||
      task.allocatedHours !== originalTask.allocatedHours ||
      task.assigneeId !== originalTask.assigneeId ||
      JSON.stringify(task.userHourSplits) !== JSON.stringify(originalTask.userHourSplits)
    );
  }, [task, originalTask]);

  return (
    <motion.tr 
      layout
      className={cn(
        "transition-colors group text-[11px] border-b border-slate-200/60",
        task.isVirtual
          ? "bg-slate-50/40 hover:bg-slate-50/70"
          : isChanged 
            ? "bg-brand-orange/5 hover:bg-brand-orange/10 border-l-[3px] border-l-brand-orange" 
            : task.isRowApproved 
              ? "bg-emerald-500/5 hover:bg-emerald-500/10" 
              : "hover:bg-slate-50 bg-white"
      )}
    >
      <td className={cn(
        "px-4 py-3 font-semibold", 
        isFieldChanged('projectName') ? "text-brand-orange bg-brand-orange/5" : task.isVirtual ? "text-slate-400 italic" : "text-slate-500"
      )}>
        {task.projectName}
      </td>
      <td className={cn(
        "px-4 py-3 font-medium", 
        isFieldChanged('tasklistName') ? "text-brand-orange bg-brand-orange/5" : task.isVirtual ? "text-slate-400 italic" : "text-slate-400"
      )}>
        {task.tasklistName}
      </td>
      <td className="px-4 py-3 min-w-[350px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            {isChanged && (
              <span className="px-1 py-0.2 bg-brand-orange/10 text-brand-orange text-[8px] font-black uppercase rounded tracking-wider animate-pulse inline-block flex-shrink-0">
                Draft
              </span>
            )}
            {task.isRowApproved && (
              <span className="px-1 py-0.2 bg-brand-brown/10 text-brand-brown text-[8px] font-black uppercase rounded tracking-wider inline-block flex-shrink-0">
                Ticked
              </span>
            )}
            {task.isVirtual && (
              <span className="px-1 py-0.2 bg-slate-100 text-slate-500 text-[8.5px] font-bold uppercase rounded tracking-wider inline-block flex-shrink-0 border border-slate-200">
                Direct Log / Completed
              </span>
            )}
          </div>
          <textarea 
            rows={1}
            value={task.title}
            readOnly={task.isVirtual}
            onChange={(e) => onUpdate(task.id, { title: e.target.value })}
            className={cn(
              "font-bold bg-transparent border-none p-0 focus:ring-0 w-full hover:bg-black/5 rounded px-1 -mx-1 resize-none overflow-hidden outline-none",
              task.isVirtual ? "text-slate-500/80 italic pointer-events-none" : isFieldChanged('title') ? "text-brand-orange bg-brand-orange/10" : "text-slate-800"
            )}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
          <textarea 
            rows={1}
            value={task.description}
            readOnly={task.isVirtual}
            onChange={(e) => onUpdate(task.id, { description: e.target.value })}
            className={cn(
              "text-[10px] italic bg-transparent border-none p-0 focus:ring-0 w-full mt-0.5 hover:bg-black/5 rounded px-1 -mx-1 resize-none overflow-hidden outline-none",
              task.isVirtual ? "text-slate-400 font-normal pointer-events-none" : isFieldChanged('description') ? "text-brand-orange" : "text-slate-400"
            )}
            placeholder={task.isVirtual ? "" : "Add description..."}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        {task.isVirtual ? (
          <span className="text-slate-400 italic font-medium">Unassigned</span>
        ) : (
          <select 
            value={task.assigneeId}
            onChange={(e) => onUpdate(task.id, { assigneeId: e.target.value })}
            className={cn(
              "border rounded px-2 py-1 outline-none text-[11px] font-bold focus:ring-1 focus:ring-slate-400 w-full appearance-none cursor-pointer",
              isFieldChanged('assigneeId') ? "bg-brand-orange/10 border-brand-orange text-brand-orange" : "bg-white border-slate-200"
            )}
          >
            <option value="">Unassigned</option>
            {teammates.map(tm => (
              <option key={tm.id} value={tm.id}>{tm.name}</option>
            ))}
          </select>
        )}
      </td>
      <td className="px-4 py-3">
        {task.isVirtual ? (
          <span className="text-slate-400 font-mono">—</span>
        ) : (
          <input 
            type="date"
            value={task.startDate}
            onChange={(e) => onUpdate(task.id, { startDate: e.target.value })}
            className={cn(
              "border rounded px-2 py-1 outline-none text-[11px] font-bold w-full cursor-pointer",
              isFieldChanged('startDate') ? "bg-brand-orange/10 border-brand-orange text-brand-orange" : "bg-white border-slate-200"
            )}
          />
        )}
      </td>
      <td className="px-4 py-3">
        {task.isVirtual ? (
          <span className="text-slate-400 font-mono">—</span>
        ) : (
          <input 
            type="date"
            value={task.deadline}
            onChange={(e) => onUpdate(task.id, { deadline: e.target.value })}
            className={cn(
              "border rounded px-2 py-1 outline-none text-[11px] font-bold w-full cursor-pointer",
              isFieldChanged('deadline') ? "bg-brand-orange/10 border-brand-orange text-brand-orange" : "bg-white border-slate-200"
            )}
          />
        )}
      </td>
      <td 
        className="px-3 py-3 text-center border-l border-slate-200 bg-slate-50/20 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col items-center gap-1 justify-center min-w-[110px]">
          <div className="flex items-center justify-between w-full px-1">
            {/* Input for Budget / Allocated hours */}
            {task.isVirtual ? (
              <span className="text-slate-400 font-mono text-[10px]">—</span>
            ) : (
              <input 
                type="number"
                min="0"
                value={task.allocatedHours || ''}
                onChange={(e) => onUpdate(task.id, { allocatedHours: parseFloat(e.target.value) || 0 })}
                className={cn(
                  "w-12 border rounded px-1 py-0.5 text-center font-mono text-[10px] font-black outline-none focus:ring-1 focus:ring-brand-orange/40 transition-all",
                  isFieldChanged('allocatedHours') 
                    ? "bg-brand-orange/20 border-brand-orange text-brand-orange" 
                    : "bg-white border-slate-200 text-brand-orange"
                )}
                title="Allocated Budget Hours"
              />
            )}
            
            {/* Logged display */}
            <div 
              className={cn(
                "px-1.5 py-0.2 rounded text-[8.5px] font-mono font-black border uppercase tracking-wider text-center flex-shrink-0",
                task.loggedHours > 0 
                  ? "bg-brand-brown text-[#faf5eb] border-brand-brown" 
                  : "bg-slate-100 text-slate-400 border-slate-200"
              )}
              title="Actual Logged Hours"
            >
              {task.loggedHours.toFixed(1)}h
            </div>
          </div>

          {/* Inline Progress Bar & Tooltip hover trigger */}
          {(task.allocatedHours > 0 || task.loggedHours > 0) && (
            <div className="w-full px-1 mt-0.5 relative group/bar cursor-pointer">
              <div 
                className={cn(
                  "w-full h-2 rounded-full overflow-hidden relative border",
                  task.allocatedHours > 0 ? "bg-brand-orange/25 border-brand-orange/30" : "bg-slate-100 border-slate-205"
                )}
              >
                {task.allocatedHours > 0 && (
                  <div 
                    className="bg-brand-brown h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, (task.loggedHours / task.allocatedHours) * 100))}%` }}
                  />
                )}
                {task.allocatedHours <= 0 && task.loggedHours > 0 && (
                  <div 
                    className="bg-brand-brown h-full w-full rounded-full"
                  />
                )}
              </div>
              
              {/* Over-budget pacing badge or label */}
              {!task.isVirtual && task.allocatedHours > 0 && (
                <div className="flex justify-between items-center text-[7.5px] font-bold mt-0.5 w-full font-mono text-slate-500">
                  <span>{Math.round((task.loggedHours / task.allocatedHours) * 100)}% pace</span>
                  {(task.loggedHours / task.allocatedHours) > 1.1 && (
                    <span className="text-red-650 font-extrabold animate-pulse">OVER</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DAILY BREAKDOWN PREVIEW POPOVER (TOOLTIP) */}
          {isHovered && dailyBreakdown.length > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-[#332d2f] text-[#faf5eb] border border-slate-700 shadow-2xl rounded-lg p-3 z-50 text-left pointer-events-none select-none">
              <div className="text-[9px] font-black uppercase text-brand-orange tracking-wider border-b border-slate-700/80 pb-1.5 mb-2 flex justify-between items-center">
                <span>Daily Logged Breakdown</span>
                <span className="text-slate-450 normal-case font-mono">{task.loggedHours.toFixed(1)}h total</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {dailyBreakdown.map(day => (
                  <div key={day.dateStr} className="flex flex-col border-b border-slate-800/40 pb-1 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100">{day.dateLabel}</span>
                      <span className="font-mono font-black text-brand-orange">{day.totalHours.toFixed(1)}h</span>
                    </div>
                    {/* User entries listing under each day */}
                    <div className="text-[8.5px] text-slate-400 pl-2 mt-0.5 space-y-1 leading-relaxed font-sans font-medium">
                      {day.details.map((d, idx) => (
                        <div key={idx} className="flex flex-col text-slate-300 bg-slate-800/20 px-1 py-0.5 rounded-sm">
                          <div className="flex justify-between gap-1 items-center">
                            <span className="font-bold text-slate-205 truncate max-w-[170px]" title={d.name}>{d.name}</span>
                            <span className="font-mono text-[8px] font-bold text-brand-orange">{d.hours.toFixed(1)}h</span>
                          </div>
                          {d.desc && (
                            <span className="text-[8px] italic text-slate-400 line-clamp-2 leading-snug mt-0.5 border-l border-brand-orange/30 pl-1">
                              {d.desc}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Triangulate Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#332d2f]" />
            </div>
          )}
        </div>
      </td>

      {/* Dynamic User Columns (Assigned & Logged Hours per Teammate) */}
      {extractUserIds.map(userId => {
        const splitVal = task.userHourSplits[userId] || 0;
        const origSplitVal = originalTask?.userHourSplits[userId] || 0;
        const loggedVal = task.userLoggedSplits?.[userId] || 0;
        
        return (
          <td key={userId} className="px-2 py-3 text-center border-l border-slate-150 bg-slate-50/25">
            <div className="flex flex-col items-center gap-1 justify-center">
              {/* Assigned hours budget input */}
              {task.isVirtual ? (
                <span className="text-slate-400 font-mono text-[10px]">—</span>
              ) : (
                <div className="relative flex items-center justify-center">
                  <input 
                    type="number"
                    min="0"
                    step="0.5"
                    value={splitVal || ''}
                    placeholder="0"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const newSplits = { ...task.userHourSplits, [userId]: val };
                      onUpdate(task.id, { userHourSplits: newSplits });
                    }}
                    className={cn(
                      "w-12 border rounded px-1 py-0.5 text-center font-mono text-[10px] font-black outline-none focus:ring-1 focus:ring-brand-orange/40 transition-all",
                      splitVal !== origSplitVal 
                        ? "bg-brand-orange/20 border-brand-orange text-brand-orange" 
                        : "bg-white border-brand-lavender/60 text-brand-orange hover:border-brand-lavender"
                    )}
                  />
                </div>
              )}

              {/* Logged hours spent readout badge */}
              <div 
                className={cn(
                  "px-1.5 py-0.2 rounded text-[8.5px] font-mono font-black border uppercase tracking-wider text-center",
                  loggedVal > 0 
                    ? "bg-brand-brown text-brand-beige border-brand-brown" 
                    : "bg-slate-100 text-slate-400 border-slate-200"
                )}
                title="Hours logged spent"
              >
                {loggedVal.toFixed(1)}h
              </div>

              {splitVal > 0 && (
                <div 
                  className={cn(
                    "text-[7.5px] font-mono font-black mt-0.5 px-1 py-0.2 rounded-sm tracking-tight text-center border uppercase leading-none",
                    (loggedVal / splitVal) > 1.1 
                      ? "bg-red-50 text-red-600 border-red-200" 
                      : (loggedVal / splitVal) < 0.7 
                        ? "bg-amber-50 text-amber-600 border-amber-200" 
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                  )}
                  title={`Pacing: ${Math.round((loggedVal / splitVal) * 100)}% of allocation spent`}
                >
                  {Math.round((loggedVal / splitVal) * 100)}% pace
                </div>
              )}
            </div>
          </td>
        );
      })}

      <td className="px-4 py-3 text-center border-l border-slate-150">
        {task.isVirtual ? (
          <span className="text-slate-350 select-none font-mono text-[10px]">—</span>
        ) : (
          <button 
            onClick={() => onUpdate(task.id, { isRowApproved: !task.isRowApproved })}
            className={cn(
              "w-6 h-6 rounded border-2 flex items-center justify-center transition-all mx-auto shadow-sm cursor-pointer",
              task.isRowApproved 
               ? "bg-brand-orange border-brand-orange text-white" 
               : isChanged
                 ? "border-amber-400 hover:border-brand-orange animate-pulse bg-amber-500/5"
                 : "border-slate-250 hover:border-slate-400 bg-white"
            )}
            title={task.isRowApproved ? "Selected for staging review" : "Tick to queue task updates for sync"}
          >
            {task.isRowApproved ? (
              <CheckCircle2 size={13} strokeWidth={3} className="text-white" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        )}
      </td>
    </motion.tr>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const assigned = Number(item.assigned) || 0;
    const logged = Number(item.logged) || 0;
    const diff = logged - assigned;
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm text-[10.5px] font-mono min-w-[140px] leading-relaxed">
        <span className="block font-black text-slate-800 border-b border-slate-100 pb-1 mb-1">{item.rawDate}</span>
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between gap-4">
            <span className="text-brand-orange font-bold font-sans uppercase text-[8.5px] tracking-wide">Assigned:</span>
            <span className="font-mono font-black">{assigned.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-brand-brown font-bold font-sans uppercase text-[8.5px] tracking-wide">Logged:</span>
            <span className="font-mono font-black text-brand-brown">{logged.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-100 pt-0.5 mt-0.5 font-bold">
            <span className="text-slate-400 font-sans uppercase text-[8.5px] tracking-wide">Variance:</span>
            <span className={cn(
              "font-mono font-black",
              diff >= 0 ? "text-emerald-650" : "text-amber-500"
            )}>
              {diff >= 0 ? "+" : ""}{diff.toFixed(1)}h
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('extract');
  const [isFetching, setIsFetching] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Teammate[]>([]);
  const [selectedExtractPeople, setSelectedExtractPeople] = useState<Set<string>>(new Set());
  const [tasklistKeyword, setTasklistKeyword] = useState<string>('');
  
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [approvedChanges, setApprovedChanges] = useState<Set<string>>(new Set());

  // Post-Extraction States
  const [sortBy, setSortBy] = useState<keyof Task>('projectName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterUserIds, setFilterUserIds] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'tasklist' | 'project-tasklist'>('project-tasklist');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Track original tasks to identify changes
  const [originalTasks, setOriginalTasks] = useState<Task[]>([]);

  // Page 01 Configure Extraction Filters & strict calendar limits
  const [selectedDept, setSelectedDept] = useState<string>('All Teams / Departments');
  const [searchTeammate, setSearchTeammate] = useState<string>('');
  
  // Date selection states: Set of months, formatted as 'yyyy-MM'
  const [selectedExtractionMonths, setSelectedExtractionMonths] = useState<Set<string>>(new Set());
  const [focusMonthStr, setFocusMonthStr] = useState<string>('');

  // Staging Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Task Creation States
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createProjectId, setCreateProjectId] = useState('');
  const [createTasklistId, setCreateTasklistId] = useState('');
  const [createTasklists, setCreateTasklists] = useState<{ id: string; name: string }[]>([]);
  const [createAssigneeIds, setCreateAssigneeIds] = useState<string[]>([]);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createStartDate, setCreateStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [createEndDate, setCreateEndDate] = useState(format(addWeeks(new Date(), 1), 'yyyy-MM-dd'));
  const [createAllocatedHours, setCreateAllocatedHours] = useState(0);
  const [isLoadingTasklists, setIsLoadingTasklists] = useState(false);
  const [apiProjects, setApiProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Time entries and clicked scorecard tracking
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [selectedScoreCardUser, setSelectedScoreCardUser] = useState<string | null>(null);

  // Generate the 4 available months (Previous Month, Current Month, Next Month, Next Month + 2)
  const extractionMonthsOptions = useMemo(() => {
    const list = [];
    for (let i = -1; i <= 2; i++) {
      const d = new Date();
      d.setDate(1); // avoid month overflow logic issues
      d.setMonth(d.getMonth() + i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMMM yyyy');
      list.push({ key, label, date: d });
    }
    return list;
  }, []);

  useEffect(() => {
    // Select all 4 months by default
    const defaultMonths = new Set(extractionMonthsOptions.map(m => m.key));
    setSelectedExtractionMonths(defaultMonths);

    // Default focus view to Current Month
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    setFocusMonthStr(currentMonthKey);
  }, [extractionMonthsOptions]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await axios.get('/api/people');
        const people: Teammate[] = res.data.people.map((p: any) => {
          let department = 'Unassigned';
          if (p['department-name']) {
            department = p['department-name'];
          } else if (p.department?.name) {
            department = p.department.name;
          } else if (p['department'] && typeof p['department'] === 'object' && p['department'].name) {
            department = p['department'].name;
          } else if (p.company?.name && p.company.name !== 'In Marketing We Trust') {
            department = p.company.name;
          }
          return {
            id: String(p.id),
            name: `${p['first-name']} ${p['last-name']}`,
            role: p['title'] || 'Collaborator',
            department: department,
            avatar: p['avatar-url'] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
            maxCapacityPerWeek: 35
          };
        });
        setAvailablePeople(people);
      } catch (e) {
        console.error("Initial fetch failed", e);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Teamwork projects dynamically for creation
  useEffect(() => {
    if (isCreateTaskOpen) {
      setIsLoadingProjects(true);
      axios.get('/api/projects')
        .then(res => {
          const list = (res.data.projects || []).map((p: any) => ({ id: String(p.id), name: p.name }));
          setApiProjects(list);
        })
        .catch(err => {
          console.error("Failed to load projects from Teamwork:", err);
        })
        .finally(() => {
          setIsLoadingProjects(false);
        });
    }
  }, [isCreateTaskOpen]);

  const extractedProjects = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach(t => {
      if (t.projectId && t.projectName && t.projectId !== 'other-project') {
        map.set(t.projectId, t.projectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const displayProjectsList = useMemo(() => {
    if (apiProjects.length > 0) return apiProjects;
    return extractedProjects;
  }, [apiProjects, extractedProjects]);

  // Fetch Teamwork tasklists dynamically for the selected project
  useEffect(() => {
    if (!createProjectId) {
      setCreateTasklists([]);
      return;
    }
    setIsLoadingTasklists(true);
    axios.get(`/api/projects/${createProjectId}/tasklists`)
      .then(res => {
        const list = (res.data.tasklists || []).map((tl: any) => ({ id: String(tl.id), name: tl.name }));
        setCreateTasklists(list);
      })
      .catch(err => {
        console.error("Failed to load tasklists for project. Using fallback...", err);
        const map = new Map<string, string>();
        tasks.forEach(t => {
          if (t.projectId === createProjectId && t.tasklistId && t.tasklistName && t.tasklistId !== 'unknown-list') {
            map.set(t.tasklistId, t.tasklistName);
          }
        });
        setCreateTasklists(Array.from(map.entries()).map(([id, name]) => ({ id, name })));
      })
      .finally(() => {
        setIsLoadingTasklists(false);
      });
  }, [createProjectId, tasks]);

  const filteredTeammates = useMemo(() => {
    const term = searchTeammate.toLowerCase();
    return availablePeople.filter(p => {
      return !term || 
        p.name.toLowerCase().includes(term) || 
        p.role.toLowerCase().includes(term) || 
        (p.department && p.department.toLowerCase().includes(term));
    });
  }, [availablePeople, searchTeammate]);

  const extractionRange = useMemo(() => {
    const sorted = Array.from(selectedExtractionMonths).sort() as string[];
    if (sorted.length === 0) return null;
    
    const startM = sorted[0];
    const endM = sorted[sorted.length - 1];
    
    const startYear = parseInt(startM.split('-')[0]);
    const startMonthVal = parseInt(startM.split('-')[1]) - 1;
    
    const endYear = parseInt(endM.split('-')[0]);
    const endMonthVal = parseInt(endM.split('-')[1]) - 1;
    
    const firstDay = new Date(startYear, startMonthVal, 1);
    const lastDay = new Date(endYear, endMonthVal + 1, 0); // last day of month
    
    return {
      startDate: format(firstDay, 'yyyy-MM-dd'),
      endDate: format(lastDay, 'yyyy-MM-dd')
    };
  }, [selectedExtractionMonths]);

  const handleFetchData = async () => {
    if (selectedExtractPeople.size === 0 && !tasklistKeyword) {
      alert("Please select at least one teammate or enter an unassigned keyword.");
      return;
    }
    setIsFetching(true);
    try {
      const payload: any = {
        userIds: Array.from(selectedExtractPeople),
        unassignedTasklistKeyword: tasklistKeyword,
      };
      if (extractionRange) {
        payload.startDate = extractionRange.startDate;
        payload.endDate = extractionRange.endDate;
      }
      
      const response = await axios.post('/api/extract', payload);
      const { tasks: twTasks, timeEntries: twTimeEntries } = response.data;

      const formattedTasks: Task[] = twTasks.map((t: any) => {
        let deadline = t['due-date'];
        if (deadline && deadline.length === 8 && !deadline.includes('-')) {
          deadline = format(parse(deadline, 'yyyyMMdd', new Date()), 'yyyy-MM-dd');
        } else if (!deadline) {
          deadline = format(addWeeks(new Date(), 1), 'yyyy-MM-dd');
        }

        let startDate = t['start-date'];
        if (startDate && startDate.length === 8 && !startDate.includes('-')) {
          startDate = format(parse(startDate, 'yyyyMMdd', new Date()), 'yyyy-MM-dd');
        } else if (!startDate) {
          startDate = format(new Date(), 'yyyy-MM-dd');
        }

        const splits: Record<string, number> = {};
        // If there are multiple assignees, split hours equally by default
        const assignees = t['responsible-party-ids'] 
          ? t['responsible-party-ids'].split(',').map((x: any) => String(x).trim()) 
          : (t['responsible-party-id'] ? [String(t['responsible-party-id']).trim()] : []);
        const totalHours = (t['estimated-minutes'] / 60) || 0;
        
        if (assignees.length > 0) {
          assignees.forEach((id: string) => {
            splits[String(id)] = totalHours / assignees.length;
          });
        }

        return {
          id: String(t.id),
          projectId: t['project-id'] ? String(t['project-id']) : '',
          projectName: t['project-name'],
          tasklistId: t['todo-list-id'] ? String(t['todo-list-id']) : '',
          tasklistName: t['todo-list-name'],
          title: t.content,
          description: t.description || '',
          assigneeId: t['responsible-party-id'] ? String(t['responsible-party-id']) : '',
          assigneeIds: assignees,
          userHourSplits: splits,
          userLoggedSplits: t.userLoggedSplits || {},
          startDate: t.isVirtual ? "" : startDate,
          deadline: t.isVirtual ? "" : deadline,
          allocatedHours: t.isVirtual ? 0 : totalHours,
          loggedHours: (t.loggedMinutes / 60) || 0,
          monthlyLoggedHours: (t.loggedMinutes / 60) || 0, // In this context it's monthly
          isRowApproved: false,
          isVirtual: !!t.isVirtual
        };
      });

      const currentStaged = tasks.filter(t => t.id.startsWith('staged-'));
      setTasks([...formattedTasks, ...currentStaged]);
      setOriginalTasks(JSON.parse(JSON.stringify(formattedTasks)));
      setTimeEntries(twTimeEntries || []);
      setSelectedScoreCardUser(null);
      setTeammates(availablePeople);
      setCurrentStep('plan');
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to fetch data from Teamwork. Check connection/token.");
    } finally {
      setIsFetching(false);
    }
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const pushChanges = async () => {
    setIsPushing(true);
    const approvedTasks = tasks.filter(t => t.isRowApproved);
    
    try {
      for (const t of approvedTasks) {
        if (t.id.startsWith('staged-')) {
          // Calculate assignees and allocated hours for creation
          const activeAssignees = Object.entries(t.userHourSplits)
            .filter(([_, hrs]) => (hrs as number) > 0)
            .map(([uid]) => uid);

          const totalHrs = activeAssignees.length > 0 
            ? Object.values(t.userHourSplits).reduce((sum, h) => (sum as number) + (h as number), 0)
            : t.allocatedHours;

          const taskPayload: any = {
            content: t.title,
            description: t.description || '',
            'start-date': t.startDate ? t.startDate.replace(/-/g, '') : '',
            'due-date': t.deadline ? t.deadline.replace(/-/g, '') : '',
            'estimated-minutes': totalHrs * 60,
          };

          if (activeAssignees.length > 0) {
            taskPayload['responsible-party-ids'] = activeAssignees.join(',');
          } else if (t.assigneeId) {
            taskPayload['responsible-party-id'] = t.assigneeId;
          }

          // Call creation API on backend
          await axios.post('/api/tasks/create', {
            tasklistId: t.tasklistId,
            task: taskPayload
          });
        } else {
          const original = originalTasks.find(ot => ot.id === t.id);
          if (!original) continue;

          // Determine updates
          const updates: any = {};
          if (t.title !== original.title) updates.content = t.title;
          if (t.description !== original.description) updates.description = t.description;
          if (t.startDate !== original.startDate) updates['start-date'] = t.startDate.replace(/-/g, '');
          if (t.deadline !== original.deadline) updates['due-date'] = t.deadline.replace(/-/g, '');
          
          // Multi-assignee split logic
          // If userHourSplits changed, we assign to all users with > 0 hours
          const activeAssignees = Object.entries(t.userHourSplits)
            .filter(([_, hrs]) => (hrs as number) > 0)
            .map(([uid]) => uid);
          
          if (activeAssignees.length > 0) {
            updates['responsible-party-ids'] = activeAssignees.join(',');
          } else if (t.assigneeId !== original.assigneeId) {
            updates['responsible-party-id'] = t.assigneeId;
          }

          // Updated total estimate (sum of splits or manually adjusted)
          const totalHrs = activeAssignees.length > 0 
            ? Object.values(t.userHourSplits).reduce((sum, h) => (sum as number) + (h as number), 0)
            : t.allocatedHours;
          
          if (totalHrs !== original.allocatedHours) {
            updates['estimated-minutes'] = totalHrs * 60;
          }

          if (Object.keys(updates).length > 0) {
            await axios.post('/api/tasks/update', { taskId: t.id, updates });
          }
        }
      }

      alert(`Successfully pushed ${approvedTasks.length} approved modifications and new tasks to Teamwork!`);
      setIsReviewOpen(false); // Close review modal
      handleFetchData();
    } catch (error) {
      console.error("Push error:", error);
      alert("Failed to push updates. Please verify Teamwork credentials and permissions.");
    } finally {
      setIsPushing(false);
    }
  };

  const proposedChanges = useMemo(() => {
    const changes: ProposedChange[] = [];
    tasks.forEach(task => {
      const original = originalTasks.find(ot => ot.id === task.id);
      if (!original) return;

      const fields: (keyof Task)[] = ['assigneeId', 'deadline', 'allocatedHours', 'description'];
      fields.forEach(field => {
        if (task[field] !== original[field]) {
          changes.push({
            taskId: task.id,
            field,
            oldValue: original[field],
            newValue: task[field],
            approved: approvedChanges.has(`${task.id}-${field}`)
          });
        }
      });
    });
    return changes;
  }, [tasks, originalTasks, approvedChanges]);

  const newlyCreatedTasks = useMemo(() => {
    return tasks.filter(t => t.id.startsWith('staged-'));
  }, [tasks]);

  const modifiedTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.id.startsWith('staged-')) return false;
      const original = originalTasks.find(ot => ot.id === t.id);
      if (!original) return false;
      return (
        t.title !== original.title ||
        t.description !== original.description ||
        t.startDate !== original.startDate ||
        t.deadline !== original.deadline ||
        t.allocatedHours !== original.allocatedHours ||
        t.assigneeId !== original.assigneeId ||
        JSON.stringify(t.userHourSplits) !== JSON.stringify(original.userHourSplits)
      );
    });
  }, [tasks, originalTasks]);

  const totalStagedCount = useMemo(() => {
    return newlyCreatedTasks.length + modifiedTasks.length;
  }, [newlyCreatedTasks, modifiedTasks]);

  const toggleApproval = (taskId: string, field: string) => {
    const key = `${taskId}-${field}`;
    setApprovedChanges(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const currentMonthTasks = useMemo(() => {
    return tasks.map(task => {
      // 1. Calculate ratio of budget that falls in focusMonthStr
      let ratio = 1;
      if (!task.isVirtual && task.startDate && task.deadline && focusMonthStr) {
        try {
          const startD = new Date(task.startDate);
          const endD = new Date(task.deadline);
          if (!isNaN(startD.getTime()) && !isNaN(endD.getTime()) && startD <= endD) {
            const totalDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (totalDays > 0) {
              const [yr, mn] = focusMonthStr.split('-').map(Number);
              const monthStart = new Date(yr, mn - 1, 1);
              const monthEnd = new Date(yr, mn, 0);

              const overlapStart = startD > monthStart ? startD : monthStart;
              const overlapEnd = endD < monthEnd ? endD : monthEnd;

              if (overlapStart <= overlapEnd) {
                const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                ratio = overlapDays / totalDays;
              } else {
                ratio = 0;
              }
            }
          }
        } catch (e) {
          ratio = 1;
        }
      }

      // Calculated month budget hours (allocatedHours for task, and splits per person)
      const allocatedHours = task.isVirtual ? 0 : task.allocatedHours * ratio;
      const userHourSplits: Record<string, number> = {};
      Object.entries(task.userHourSplits).forEach(([uid, val]) => {
        userHourSplits[uid] = (val as number) * ratio;
      });

      // 2. Precise logged hours calculation specifically for focusMonthStr
      let loggedHours = 0;
      const userLoggedSplits: Record<string, number> = {};
      let focusedTimeEntries: any[] = [];

      if (task.isVirtual) {
        const projId = task.projectId || 'other-project';
        const listId = task.tasklistId || 'unknown-list';

        // Gather all physical task IDs so we know which keys are consumed
        const physicalTaskIds = new Set(tasks.filter(tk => !tk.isVirtual).map(tk => tk.id));

        const virtualEntries = timeEntries.filter(entry => {
          // Check focus month
          const entryM = entry.date ? entry.date.slice(0, 7) : '';
          if (entryM !== focusMonthStr) return false;

          // Check if unconsumed (either no taskId, or not in physical tasks)
          const isConsumed = entry.taskId && physicalTaskIds.has(entry.taskId);
          if (isConsumed) return false;

          // Check matching project and list
          const matchProj = entry.projectId === projId;
          const matchRec = entry.listId === listId;
          return matchProj && matchRec;
        });

        virtualEntries.forEach(entry => {
          loggedHours += entry.hours || 0;
          if (entry.personId) {
            userLoggedSplits[entry.personId] = (userLoggedSplits[entry.personId] || 0) + (entry.hours || 0);
          }
        });
        focusedTimeEntries = virtualEntries;

      } else {
        // Physical task
        // Find all time entries logged in focusMonthStr matching this taskId
        const taskEntries = timeEntries.filter(entry => {
          const entryM = entry.date ? entry.date.slice(0, 7) : '';
          return entry.taskId === task.id && entryM === focusMonthStr;
        });

        taskEntries.forEach(entry => {
          loggedHours += entry.hours || 0;
          if (entry.personId) {
            userLoggedSplits[entry.personId] = (userLoggedSplits[entry.personId] || 0) + (entry.hours || 0);
          }
        });
        focusedTimeEntries = taskEntries;
      }

      return {
        ...task,
        allocatedHours,
        userHourSplits,
        loggedHours,
        userLoggedSplits,
        focusedTimeEntries
      };
    });
  }, [tasks, timeEntries, focusMonthStr]);

  const userScoreCards = useMemo(() => {
    return (Array.from(selectedExtractPeople) as string[]).map(userId => {
      const tm = availablePeople.find(p => p.id === userId);
      
      const userTasks = currentMonthTasks.filter(t => {
        const belongsToUser = t.assigneeId === userId || 
          t.assigneeIds.includes(userId) || 
          (t.userHourSplits && t.userHourSplits[userId] && t.userHourSplits[userId] > 0) ||
          (t.userLoggedSplits && t.userLoggedSplits[userId] && t.userLoggedSplits[userId] > 0);
        
        if (!belongsToUser) return false;

        // Either virtual with logs, or has budget in month, or has logs in month, or scheduled in month
        if (t.isVirtual) return (t.userLoggedSplits?.[userId] || 0) > 0;
        
        const hasBudgetInMonth = t.userHourSplits?.[userId] && t.userHourSplits[userId] > 0;
        const hasLogsInMonth = t.userLoggedSplits?.[userId] && t.userLoggedSplits[userId] > 0;
        
        let scheduledInMonth = true;
        if (t.startDate && t.deadline && focusMonthStr) {
          const startM = t.startDate.slice(0, 7);
          const endM = t.deadline.slice(0, 7);
          scheduledInMonth = focusMonthStr >= startM && focusMonthStr <= endM;
        }

        return hasBudgetInMonth || hasLogsInMonth || scheduledInMonth;
      });

      const allocated = userTasks.reduce((sum, t) => sum + (t.userHourSplits[userId] || 0), 0);
      
      // Calculate logged directly from raw timeEntries for perfect match with daily chart
      const logged = timeEntries
        .filter(entry => entry.personId === userId && entry.date && entry.date.slice(0, 7) === focusMonthStr)
        .reduce((sum, entry) => sum + (entry.hours || 0), 0);

      return {
        id: userId,
        name: tm?.name || 'Unknown',
        role: tm?.role || 'Collaborator',
        avatar: tm?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        taskCount: userTasks.filter(t => !t.isVirtual).length + userTasks.filter(t => t.isVirtual && (t.userLoggedSplits?.[userId] || 0) > 0).length,
        allocated,
        logged,
        maxCapacity: tm ? tm.maxCapacityPerWeek * 4 : 140, // Assume ~4 weeks in a month
      };
    });
  }, [currentMonthTasks, timeEntries, selectedExtractPeople, availablePeople, focusMonthStr]);

  // Compute day-by-day assigned hours and logged hours for the selected scorecard teammate
  const dailyChartData = useMemo(() => {
    if (!selectedScoreCardUser || !focusMonthStr) return [];
    
    const parts = focusMonthStr.split('-');
    if (parts.length !== 2) return [];
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    
    const dataList = [];
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const dayStr = `${focusMonthStr}-${String(day).padStart(2, '0')}`;
      dataList.push({
        dayStr,
        dayLabel: String(day),
        assigned: 0,
        logged: 0,
        rawDate: dayStr
      });
    }

    // 1. Sum up logged hours by date
    timeEntries.forEach(entry => {
      if (entry.personId === selectedScoreCardUser && entry.date) {
        const target = dataList.find(d => d.rawDate === entry.date);
        if (target) {
          target.logged += entry.hours || 0;
        }
      }
    });

    // 2. Sum up assigned hours globally distributed across the duration of active tasks
    tasks.forEach(task => {
      if (task.isVirtual) return;
      
      const assignedHrs = task.userHourSplits?.[selectedScoreCardUser] || 0;
      if (assignedHrs <= 0) return;

      if (task.startDate && task.deadline) {
        try {
          const startD = new Date(task.startDate);
          const endD = new Date(task.deadline);
          
          if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
            const diffTime = Math.abs(endD.getTime() - startD.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const hoursPerDay = assignedHrs / Math.max(1, diffDays);

            dataList.forEach(d => {
              const currentD = new Date(d.rawDate);
              if (currentD >= startD && currentD <= endD) {
                d.assigned += hoursPerDay;
              }
            });
          }
        } catch (err) {
          console.error("Failed calculating daily splits for task:", task.id, err);
        }
      }
    });

    return dataList.map(d => ({
      ...d,
      assigned: parseFloat(d.assigned.toFixed(2)),
      logged: parseFloat(d.logged.toFixed(2))
    }));
  }, [selectedScoreCardUser, tasks, timeEntries, focusMonthStr]);

  const processedTasks = useMemo(() => {
    let filtered = currentMonthTasks;
    
    // 1. User Filter
    if (filterUserIds.size > 0) {
      filtered = filtered.filter(t => {
        if (filterUserIds.has(t.assigneeId)) return true;
        if (t.assigneeIds && t.assigneeIds.some(aid => filterUserIds.has(aid))) return true;
        return Array.from(filterUserIds).some(uid => {
          const splits = t.userLoggedSplits || {};
          return (splits[uid as string] || 0) > 0;
        });
      });
    }

    // 2. Focus Month Filter
    if (focusMonthStr) {
      filtered = filtered.filter(t => {
        if (!t.startDate || !t.deadline) return true;
        const startM = t.startDate.slice(0, 7);
        const endM = t.deadline.slice(0, 7);
        return focusMonthStr >= startM && focusMonthStr <= endM;
      });
    }

    // 3. Sort
    return [...filtered].sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      const modifier = sortOrder === 'asc' ? 1 : -1;
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * modifier;
      }
      return ((valA as number) - (valB as number)) * modifier;
    });
  }, [currentMonthTasks, filterUserIds, sortBy, sortOrder, focusMonthStr]);

  const processedTasksTotals = useMemo(() => {
    const totalAllocated = processedTasks.reduce((sum, t) => sum + (t.allocatedHours || 0), 0);
    const totalLogged = processedTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
    
    const personAssignedTotals: Record<string, number> = {};
    const personLoggedTotals: Record<string, number> = {};
    
    selectedExtractPeople.forEach((pid: string) => {
      personAssignedTotals[pid] = processedTasks.reduce((sum, t) => sum + (t.userHourSplits[pid] || 0), 0);
      personLoggedTotals[pid] = processedTasks.reduce((sum, t) => sum + (t.userLoggedSplits?.[pid] || 0), 0);
    });
    
    return {
      totalAllocated,
      totalLogged,
      personAssignedTotals,
      personLoggedTotals
    };
  }, [processedTasks, selectedExtractPeople]);

  const GroupHeader = ({ 
    name, 
    type, 
    tasks: groupTasks, 
    isExpanded, 
    onClick,
    level = 0
  }: { 
    name: string; 
    type: string; 
    tasks: Task[]; 
    isExpanded: boolean; 
    onClick: () => void;
    level?: number;
  }) => {
    // Aggregations
    const uniqueAssignees = new Set(groupTasks.flatMap(t => t.assigneeIds.length > 0 ? t.assigneeIds : [t.assigneeId]).filter(id => id)).size;
    const startDates = groupTasks.map(t => t.startDate).filter(d => d).sort();
    const endDates = groupTasks.map(t => t.deadline).filter(d => d).sort();
    const earliestStart = startDates.length > 0 ? startDates[0] : '-';
    const latestEnd = endDates.length > 0 ? endDates[endDates.length - 1] : '-';
    const totalAllocated = groupTasks.reduce((sum, t) => sum + t.allocatedHours, 0);
    const totalSpent = groupTasks.reduce((sum, t) => sum + t.loggedHours, 0);

    const splitTotals: Record<string, number> = {};
    const splitLoggedTotals: Record<string, number> = {};
    selectedExtractPeople.forEach((pid: string) => {
      splitTotals[pid] = groupTasks.reduce((sum: number, t: Task) => sum + (t.userHourSplits[pid] || 0), 0);
      splitLoggedTotals[pid] = groupTasks.reduce((sum: number, t: Task) => sum + (t.userLoggedSplits?.[pid] || 0), 0);
    });

    return (
      <tr 
        className={cn(
          "cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200 group/header",
          level === 0 ? "bg-slate-100/80" : "bg-slate-50/50"
        )}
        onClick={onClick}
      >
        <td className="px-4 py-2" style={{ paddingLeft: `${1 + level * 1.5}rem` }}>
          <div className="flex items-center gap-2">
            <span className={cn("transition-transform text-[8px] text-slate-500", isExpanded ? "rotate-90" : "")}>▸</span>
            <span className="text-[9px] font-black uppercase text-slate-400">{type}</span>
          </div>
        </td>
        <td className="px-4 py-2" colSpan={groupBy === 'project-tasklist' && level === 0 ? 2 : 1}>
           <span className={cn("text-[11px] font-black text-slate-800", level === 0 ? "uppercase tracking-tight" : "")}>{name}</span>
        </td>
        {!(groupBy === 'project-tasklist' && level === 0) && <td className="px-4 py-2"></td>}
        {/* Assignee Column (Col 4) */}
        <td className="px-4 py-2">
          <div className="flex flex-col items-start gap-0.5 justify-center">
            <span className="px-1.5 py-0.3 bg-slate-200/85 text-[8.5px] font-black rounded text-slate-600 uppercase tracking-widest leading-none">{groupTasks.length} Tasks</span>
            <span className="text-[8px] font-black text-slate-450 uppercase tracking-tight">{uniqueAssignees} assigned</span>
          </div>
        </td>
        {/* Start Column (Col 5) */}
        <td className="px-4 py-2">
           <span className="text-[10px] font-mono font-black text-slate-550">{earliestStart}</span>
        </td>
        {/* End Column (Col 6) */}
        <td className="px-4 py-2">
           <span className="text-[10px] font-mono font-black text-slate-550">{latestEnd}</span>
        </td>
        {/* Budget Column (Col 7) */}
        <td className="px-4 py-2 text-center bg-brand-orange/5 border-l border-slate-150">
           <span className="text-[10.5px] font-mono font-black text-brand-orange">{totalAllocated.toFixed(1)}h</span>
        </td>
        {/* Logged Column (Col 8) */}
        <td className="px-4 py-2 text-center bg-brand-brown/5 border-l border-slate-150">
           <span className="text-[10.5px] font-mono font-black text-brand-brown bg-[#faf5eb] border border-brand-brown/15 px-1.5 py-0.5 rounded shadow-xs">{totalSpent.toFixed(1)}h</span>
        </td>

        {Array.from<string>(selectedExtractPeople).map(pid => (
          <td key={pid} className="px-2 py-2 text-center border-l border-slate-200/50 font-mono bg-slate-50/10">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-black text-brand-orange">{splitTotals[pid] > 0 ? splitTotals[pid].toFixed(1) + 'h' : '0h'}</span>
              <span className="text-[8px] font-black text-brand-brown">{splitLoggedTotals[pid] > 0 ? splitLoggedTotals[pid].toFixed(1) + 'h' : '0h'}</span>
            </div>
          </td>
        ))}
        
        <td className="px-4 py-2"></td>
      </tr>
    );
  };

  const renderTasks = () => {
    const isTaskChanged = (taskId: string) => proposedChanges.some(c => c.taskId === taskId);

    if (groupBy === 'none') {
      return processedTasks.map(t => (
        <TaskRow 
          key={t.id} 
          task={t} 
          onUpdate={updateTask} 
          teammates={teammates} 
          extractUserIds={Array.from(selectedExtractPeople)}
          originalTask={originalTasks.find(ot => ot.id === t.id)}
        />
      ));
    }

    if (groupBy === 'project-tasklist') {
      const projectGroups = new Map<string, Map<string, Task[]>>();
      processedTasks.forEach(t => {
        const pKey = t.projectName || 'Uncategorized Project';
        const lKey = t.tasklistName || 'Uncategorized List';
        if (!projectGroups.has(pKey)) projectGroups.set(pKey, new Map());
        const listGroups = projectGroups.get(pKey)!;
        if (!listGroups.has(lKey)) listGroups.set(lKey, []);
        listGroups.get(lKey)!.push(t);
      });

      return Array.from(projectGroups.entries()).map(([projectName, listGroups]) => {
        const isProjectExpanded = expandedGroups.has(projectName);
        const projectTasks = Array.from(listGroups.values()).flat();
        
        return (
          <React.Fragment key={projectName}>
            <GroupHeader 
              name={projectName} 
              type="Project" 
              tasks={projectTasks} 
              isExpanded={isProjectExpanded} 
              onClick={() => {
                const next = new Set(expandedGroups);
                if (next.has(projectName)) next.delete(projectName);
                else next.add(projectName);
                setExpandedGroups(next);
              }}
              level={0}
            />
            {isProjectExpanded && Array.from(listGroups.entries()).map(([listName, tasks]) => {
              const listKey = `${projectName}-${listName}`;
              const isListExpanded = expandedGroups.has(listKey);
              return (
                <React.Fragment key={listKey}>
                  <GroupHeader 
                    name={listName} 
                    type="List" 
                    tasks={tasks} 
                    isExpanded={isListExpanded} 
                    onClick={() => {
                      const next = new Set(expandedGroups);
                      if (next.has(listKey)) next.delete(listKey);
                      else next.add(listKey);
                      setExpandedGroups(next);
                    }}
                    level={1}
                  />
                  {isListExpanded && tasks.map(t => (
                    <TaskRow 
                      key={t.id} 
                      task={t} 
                      onUpdate={updateTask} 
                      teammates={teammates} 
                      extractUserIds={Array.from(selectedExtractPeople)}
                      originalTask={originalTasks.find(ot => ot.id === t.id)}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      });
    }

    const groupField = groupBy === 'project' ? 'projectName' : 'tasklistName';
    const groups = new Map<string, Task[]>();
    
    processedTasks.forEach(t => {
      const key = t[groupField as keyof Task] as string || 'Uncategorized';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    });

    return Array.from(groups.entries()).map(([groupName, groupTasks]) => {
      const isExpanded = expandedGroups.has(groupName);
      return (
        <React.Fragment key={groupName}>
          <GroupHeader 
            name={groupName} 
            type={groupBy === 'project' ? 'Project' : 'List'} 
            tasks={groupTasks} 
            isExpanded={isExpanded} 
            onClick={() => {
              const next = new Set(expandedGroups);
              if (next.has(groupName)) next.delete(groupName);
              else next.add(groupName);
              setExpandedGroups(next);
            }}
          />
          {isExpanded && groupTasks.map(t => (
             <TaskRow 
              key={t.id} 
              task={t} 
              onUpdate={updateTask} 
              teammates={teammates} 
              extractUserIds={Array.from(selectedExtractPeople)}
              originalTask={originalTasks.find(ot => ot.id === t.id)}
            />
          ))}
        </React.Fragment>
      );
    });
  };

  // Capacity calculation
  const capacityData = useMemo(() => {
    const weeksCount = 16;
    const start = startOfWeek(new Date());
    
    return teammates.map(tm => {
      const weeklyData = Array.from({ length: weeksCount }).map((_, i) => {
        const weekStart = addWeeks(start, i);
        // Calculate load from splits
        const hoursInWeek = tasks
          .filter(t => isSameWeek(parseISO(t.deadline), weekStart))
          .reduce((sum, t) => sum + (t.userHourSplits[tm.id] || 0), 0);

        return {
          week: format(weekStart, 'MMM dd'),
          hours: hoursInWeek,
          capacity: tm.maxCapacityPerWeek,
          percent: Math.min(100, (hoursInWeek / tm.maxCapacityPerWeek) * 100),
          isOver: hoursInWeek > tm.maxCapacityPerWeek
        };
      });

      const totalHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);
      const totalCapacity = tm.maxCapacityPerWeek * weeksCount;

      return {
        ...tm,
        weeklyData,
        overallPercent: (totalHours / totalCapacity) * 100
      };
    });
  }, [tasks, teammates]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand-orange/20">
      {/* Header */}
      <header className="h-16 bg-white/50 backdrop-blur-md border-b border-slate-border flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="h-6 w-px bg-slate-border mx-2 hidden md:block" />
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest hidden md:block">Source: <span className="font-mono">teamwork-api-v2</span></span>
        </div>
        
        <nav className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-border/50">
          <NavButton 
            active={currentStep === 'extract'} 
            onClick={() => setCurrentStep('extract')}
            icon={<Download size={14} />}
            label="01 Extract"
            disabled={tasks.length === 0 && currentStep !== 'extract'}
          />
          <NavButton 
            active={currentStep === 'plan'} 
            onClick={() => setCurrentStep('plan')}
            icon={<LayoutDashboard size={14} />}
            label="02 Plan"
            disabled={tasks.length === 0}
          />
          <NavButton 
            active={currentStep === 'stage'} 
            onClick={() => setCurrentStep('stage')}
            icon={<Send size={14} />}
            label="03 Staging"
            disabled={tasks.length === 0}
            badge={totalStagedCount > 0 ? totalStagedCount : undefined}
          />
        </nav>

        <div className="flex items-center gap-3">
          {tasks.length > 0 && (
            <button 
              onClick={() => setIsCreateTaskOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 hover:shadow text-white text-[11px] font-black rounded flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-emerald-600"
            >
              <Plus size={14} />
              CREATE TASK
            </button>
          )}

          {tasks.filter(t => t.isRowApproved).length > 0 && (
            <button 
              onClick={() => setIsReviewOpen(true)}
              className="px-3.5 py-2 bg-brand-orange text-white text-[10px] font-black uppercase rounded flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-brand-orange hover:bg-brand-orange/90 shadow-sm"
            >
              <Send size={12} />
              Review & Sync ({tasks.filter(t => t.isRowApproved).length})
            </button>
          )}

          {totalStagedCount > 0 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex items-center gap-2 text-[10px] font-black text-brand-orange bg-brand-orange/5 px-3 py-1.5 rounded border border-brand-orange/10"
             >
               <RefreshCw size={12} className="animate-spin" />
               {totalStagedCount} STAGED
             </motion.div>
          )}
          <button 
            onClick={handleFetchData}
            disabled={isFetching}
            className="px-4 py-2 bg-slate-900 text-white text-[11px] font-black rounded shadow-sm hover:bg-slate-800 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isFetching ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            FETCH LATEST DATA
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
        <AnimatePresence mode="wait">
          {currentStep === 'extract' && (
            <motion.div 
              key="extract"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto w-full space-y-12 py-12"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-8 border border-slate-border mx-auto">
                  <Download className="text-slate-900" size={32} />
                </div>
                <h1 className="text-4xl font-black tracking-tight mb-3 text-slate-900 font-rounded uppercase">01 — Configure Extraction</h1>
                <p className="text-slate-400 max-w-sm mx-auto text-sm font-bold leading-relaxed uppercase tracking-wide">
                  Select teammates and filter criteria to fetch target workload data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                {/* People Selection */}
                <div className="bg-white rounded-xl border border-slate-border p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                      <Users size={14} /> Teammates to Extract
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 leading-tight">
                      Filter and select teammates to query historical logs and forecast plans.
                    </p>

                    {/* Filter controls inside Teammate card */}
                    <div className="space-y-3 mb-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                          <input 
                            type="text"
                            placeholder="Search name, title, team..."
                            value={searchTeammate}
                            onChange={(e) => setSearchTeammate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 max-h-[350px] overflow-auto pr-2 divide-y divide-slate-100">
                      {filteredTeammates.map(person => (
                        <label key={person.id} className="flex items-center gap-3 py-2.5 hover:bg-slate-50/50 rounded-lg cursor-pointer transition-colors px-2">
                          <input 
                            type="checkbox"
                            checked={selectedExtractPeople.has(person.id)}
                            onChange={() => {
                              const next = new Set(selectedExtractPeople);
                              if (next.has(person.id)) next.delete(person.id);
                              else next.add(person.id);
                              setSelectedExtractPeople(next);
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          />
                          <img src={person.avatar} className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 leading-tight">{person.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{person.department || 'No Team'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-black uppercase ml-auto">{person.role}</span>
                        </label>
                      ))}
                      {filteredTeammates.length === 0 && availablePeople.length > 0 && (
                        <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase">
                          No teammates match the search or team criteria.
                        </div>
                      )}
                      {availablePeople.length === 0 && (
                        <div className="text-center py-8">
                          <RefreshCw className="animate-spin mx-auto text-slate-200 mb-2" size={24} />
                          <p className="text-[10px] text-slate-400 uppercase font-black">Loading people list...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                    <button 
                      onClick={() => {
                        const next = new Set(selectedExtractPeople);
                        filteredTeammates.forEach(p => next.add(p.id));
                        setSelectedExtractPeople(next);
                      }}
                      className="text-[10px] font-black uppercase text-brand-orange hover:opacity-80 font-rounded"
                    >
                      ✓ Select Filtered ({filteredTeammates.length})
                    </button>
                    <button 
                      onClick={() => {
                        const next = new Set(selectedExtractPeople);
                        filteredTeammates.forEach(p => next.delete(p.id));
                        setSelectedExtractPeople(next);
                      }}
                      className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-500 font-rounded"
                    >
                      Deselect Filtered
                    </button>
                  </div>
                </div>

                {/* Filter Options */}
                <div className="space-y-8">
                  {/* Strict timeframe month selector */}
                  <div className="bg-white rounded-xl border border-slate-border p-6 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                      <Calendar size={14} /> Extraction Timeframe Range
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 leading-tight">
                      Pick calendar months for the active extraction target footprint. Full timeframe window applies.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {extractionMonthsOptions.map(m => {
                        const isCur = format(new Date(), 'yyyy-MM') === m.key;
                        const isChecked = selectedExtractionMonths.has(m.key);
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => {
                              const next = new Set(selectedExtractionMonths);
                              if (next.has(m.key)) {
                                if (next.size > 1) {
                                  next.delete(m.key);
                                } else {
                                  alert("Extraction must retain at least one target month footprint selection.");
                                }
                              } else {
                                next.add(m.key);
                              }
                              setSelectedExtractionMonths(next);
                            }}
                            className={cn(
                              "flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer",
                              isChecked 
                                ? "bg-slate-900 border-slate-900 text-white shadow" 
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                            )}
                          >
                            <span className="text-[11px] font-black uppercase leading-tight">{m.label}</span>
                            <span className={cn("text-[8px] mt-1 font-black tracking-wider uppercase px-1.5 py-0.5 rounded font-rounded", 
                              isChecked ? "bg-white/20 text-white" : isCur ? "bg-brand-orange/15 text-brand-orange font-bold border border-brand-orange/20" : "bg-slate-200 text-slate-500"
                            )}>
                              {isCur ? "CURRENT MONTH" : "FULL MONTH"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-border p-6 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Search size={14} /> Unassigned Task Filter
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 leading-tight">
                      Extract unassigned tasks from tasklists containing this keyword.
                    </p>
                    <input 
                      type="text"
                      placeholder="e.g. Backlog, Production..."
                      value={tasklistKeyword}
                      onChange={(e) => setTasklistKeyword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:ring-1 focus:ring-slate-400 animate-slide-in"
                    />
                  </div>

                  <button 
                    onClick={handleFetchData}
                    disabled={isFetching || (selectedExtractPeople.size === 0 && !tasklistKeyword)}
                    className="w-full group relative flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-6 rounded-xl font-black text-sm tracking-[0.2em] uppercase shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    {isFetching ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} />
                        EXTRACTING...
                      </>
                    ) : (
                      <>
                        RUN EXTRACTION
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 font-black uppercase">
                    Requires valid TEAMWORK_TOKEN in configuration
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'plan' && (
             <motion.div 
               key="plan"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col gap-6 animate-fade-in w-full"
             >
                <div className="flex flex-col gap-6 w-full">
                  
                  {/* Strict timeframe month selector & scorecards row parent */}
                  <div className="flex flex-col gap-3 flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      
                      {/* Active Workload Month Toggle/Selector */}
                      <div className="bg-white rounded-xl border border-slate-border p-4 shadow-sm md:col-span-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
                            <Calendar size={13} /> Active Month Context Window
                          </span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-3">
                            Focus Sandbox calculations and visible lists to a selected full month.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {extractionMonthsOptions.map(m => {
                            const isActive = focusMonthStr === m.key;
                            const isExtracted = selectedExtractionMonths.has(m.key);
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={() => {
                                  if (isExtracted) {
                                    setFocusMonthStr(m.key);
                                  } else {
                                    alert(`Month ${m.label} was not selected for extraction in Step 1. Please add it to config.`);
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all flex items-center gap-1 cursor-pointer",
                                  isActive 
                                    ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                                    : isExtracted
                                      ? "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                                )}
                                disabled={!isExtracted}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Informational Legend Block */}
                      <div className="bg-white rounded-xl border border-slate-border p-4 shadow-sm md:col-span-3 flex flex-col justify-between text-slate-600">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
                            <Info size={13} /> Visual Indicator Guide
                          </span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-3">
                            Color codes and states represent different timeline and budget statuses.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-brand-orange rounded border border-brand-orange/10" />
                            <span className="font-bold text-slate-700 uppercase tracking-tight text-[9.5px]">Orange: Hours Allocated / Forecasted</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-brand-brown rounded border border-brand-brown/10" />
                            <span className="font-bold text-slate-700 uppercase tracking-tight text-[9.5px]">Brown: Hours Logged / Spent</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <div className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[8px] font-black rounded border border-amber-200 uppercase">
                              Amber row highlight / Draft Badge
                            </div>
                            <span className="font-bold text-slate-500 uppercase tracking-tight">Indicates unsaved inline modifications</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Workload Score Cards Dashboard */}
                    <div className="bg-white rounded-xl border border-slate-border p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Users size={13} /> Resource Workloads ({extractionMonthsOptions.find(m => m.key === focusMonthStr)?.label || focusMonthStr})
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {userScoreCards.map(card => {
                          const ratio = card.maxCapacity > 0 ? (card.allocated / card.maxCapacity) * 100 : 0;
                          let statusColor = "text-emerald-700 bg-emerald-50 border-emerald-100/60";
                          let statusLabel = "OPTIMAL CAPACITY";
                          if (ratio > 110) {
                            statusColor = "text-red-700 bg-red-50 border-red-100/60 animate-pulse";
                            statusLabel = "OVERLOADED";
                          } else if (ratio < 40) {
                            statusColor = "text-amber-700 bg-amber-50 border-amber-100/60";
                            statusLabel = "UNDERLOADED";
                          }

                          const isSelected = selectedScoreCardUser === card.id;

                          return (
                            <div 
                              key={card.id} 
                              onClick={() => setSelectedScoreCardUser(isSelected ? null : card.id)}
                              className={cn(
                                "rounded-xl border p-3 flex flex-col justify-between shadow-xs transition-all cursor-pointer hover:-translate-y-0.5 select-none",
                                isSelected 
                                  ? "ring-2 ring-brand-orange border-brand-orange/60 bg-brand-orange/[0.03] shadow-md" 
                                  : "bg-slate-50/50 border-slate-150 hover:bg-slate-50 hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <img src={card.avatar} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" alt={card.name} />
                                <div className="overflow-hidden">
                                  <h4 className="text-[11px] font-black text-slate-800 truncate leading-tight">{card.name}</h4>
                                  <span className={cn("text-[7px] font-black uppercase px-1 py-0.2 rounded border font-rounded inline-block mt-0.5", statusColor)}>
                                    {statusLabel}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-1 pt-1.5 border-t border-slate-100 text-[10px]">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Items</span>
                                  <span className="font-bold text-slate-700">{card.taskCount} tasks</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Budgeted</span>
                                  <span className="font-mono font-black text-brand-orange">{card.allocated.toFixed(1)}h</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Logged</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-brand-brown">{card.logged.toFixed(1)}h</span>
                                    {card.allocated > 0 && (
                                      <span className={cn(
                                        "text-[7px] font-black px-1.5 py-0.5 rounded font-sans tracking-tight",
                                        (card.logged / card.allocated) > 1.1 
                                          ? "bg-red-50 text-red-700 border border-red-100"
                                          : (card.logged / card.allocated) < 0.7 
                                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      )}>
                                        {Math.round((card.logged / card.allocated) * 100)}% pace
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Capacity progress dial */}
                                <div className="pt-1">
                                  <div className="flex justify-between text-[7.5px] text-slate-400 font-black uppercase mb-0.5 leading-none">
                                    <span>Load</span>
                                    <span>{ratio.toFixed(0)}% of {card.maxCapacity}h</span>
                                  </div>
                                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        ratio > 110 ? "bg-red-500" : ratio < 40 ? "bg-amber-500" : "bg-emerald-500"
                                      )}
                                      style={{ width: `${Math.min(100, ratio)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {userScoreCards.length === 0 && (
                          <div className="col-span-full py-4 text-center text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            No extracted teammates active. Add them in Step 1 Selection set.
                          </div>
                        )}
                      </div>

                      {/* Day-by-Day Visualizer for Selected Teammate */}
                      <AnimatePresence>
                        {selectedScoreCardUser && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 pt-5 border-t border-slate-100 overflow-hidden"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2 tracking-wide font-rounded">
                                  <BarChart3 size={15} className="text-brand-orange" />
                                  01.B — Activity Forecast & Logged Hours: {availablePeople.find(p => p.id === selectedScoreCardUser)?.name}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                                  Plot of daily assigned demand (budget split evenly across task duration schedules) vs. actual logged minutes by date ({extractionMonthsOptions.find(m => m.key === focusMonthStr)?.label || focusMonthStr})
                                </p>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setSelectedScoreCardUser(null)}
                                className="text-[9px] font-black uppercase text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 self-start md:self-auto cursor-pointer transition-colors"
                              >
                                Hide Breakdown ×
                              </button>
                            </div>

                            <div className="bg-slate-50/50 rounded-xl border border-slate-150 p-4">
                              <div className="h-[220px] w-full text-[9px] font-mono">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="rgba(255, 90, 39, 0.25)" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="rgba(255, 90, 39, 0)" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                                    <XAxis 
                                      dataKey="dayLabel" 
                                      tickLine={false} 
                                      axisLine={false}
                                      tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                                    />
                                    <YAxis 
                                      tickLine={false} 
                                      axisLine={false}
                                      tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                                      unit="h"
                                    />
                                    <Tooltip 
                                      cursor={{ fill: 'rgba(130, 90, 66, 0.04)' }}
                                      content={<CustomTooltip />}
                                    />
                                    <Legend 
                                      verticalAlign="top" 
                                      height={32} 
                                      iconSize={7}
                                      iconType="circle"
                                      wrapperStyle={{ fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.025em', color: '#475569' }}
                                    />
                                    <Area 
                                      type="monotone" 
                                      name="Assigned demand"
                                      dataKey="assigned" 
                                      fill="url(#colorAssigned)" 
                                      stroke="#ff5a27" 
                                      strokeWidth={2}
                                      dot={false}
                                      activeDot={{ r: 4 }}
                                    />
                                    <Bar 
                                      name="Actual Logged"
                                      dataKey="logged" 
                                      fill="#825a42" 
                                      radius={[3, 3, 0, 0]}
                                      maxBarSize={14}
                                    />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Task Sandbox */}
                  <div className="w-full bg-white rounded-xl border border-slate-border flex flex-col shadow-sm">
                    <div className="p-4 border-b border-slate-border flex flex-wrap justify-between items-center bg-white/80 backdrop-blur-sm gap-4">
                      <div>
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 font-rounded">02 — Task Sandbox</h2>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-brand-orange/5 text-brand-orange text-[9px] font-black rounded border border-brand-orange/20 uppercase">{tasks.length} Active Tasks</span>
                          {filterUserIds.size > 0 && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black rounded border border-purple-100 uppercase">Filtered View</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-border rounded-lg p-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 px-2">Group By</span>
                          <select 
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as any)}
                            className="bg-white border-slate- border rounded px-2 py-1 text-[10px] font-black uppercase outline-none"
                          >
                            <option value="none">None</option>
                            <option value="project">Project</option>
                            <option value="tasklist">Task List</option>
                            <option value="project-tasklist">Project &gt; Task List</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-border rounded-lg p-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 px-2">Filter Users</span>
                          <div className="flex -space-x-2 overflow-hidden px-1">
                            {teammates.slice(0, 5).map(tm => (
                              <button 
                                key={tm.id}
                                onClick={() => {
                                  const next = new Set(filterUserIds);
                                  if (next.has(tm.id)) next.delete(tm.id);
                                  else next.add(tm.id);
                                  setFilterUserIds(next);
                                }}
                                className={cn(
                                  "inline-block h-6 w-6 rounded-full ring-2 ring-white cursor-pointer transition-all",
                                  filterUserIds.has(tm.id) ? "opacity-100 scale-110 z-10 brightness-110" : "opacity-40 hover:opacity-100"
                                )}
                                title={tm.name}
                              >
                                <img src={tm.avatar} alt={tm.name} />
                              </button>
                            ))}
                          </div>
                          {filterUserIds.size > 0 && (
                            <button 
                              onClick={() => setFilterUserIds(new Set())}
                              className="text-[9px] font-black text-slate-400 px-1 hover:text-red-500"
                            >
                              CLEAR
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1400px]">
                        <thead className="sticky top-0 bg-slate-50 z-30 shadow-sm font-sans">
                          <tr className="border-b border-slate-200">
                            <SortableHeader label="Project" field="projectName" currentSort={sortBy} order={sortOrder} onSort={(f) => { setSortBy(f); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} />
                            <SortableHeader label="TaskList" field="tasklistName" currentSort={sortBy} order={sortOrder} onSort={(f) => { setSortBy(f); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} />
                            <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500 w-[400px]">
                              Task
                            </th>
                            <SortableHeader label="Assignee" field="assigneeId" currentSort={sortBy} order={sortOrder} onSort={(f) => { setSortBy(f); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} />
                            <SortableHeader label="Start" field="startDate" currentSort={sortBy} order={sortOrder} onSort={(f) => { setSortBy(f); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} />
                            <SortableHeader label="End" field="deadline" currentSort={sortBy} order={sortOrder} onSort={(f) => { setSortBy(f); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} />
                            <th className="px-3 py-3 text-center border-l border-slate-200 bg-slate-50 min-w-[125px] max-w-[160px]">
                              <div className="flex flex-col items-center gap-1 justify-center">
                                <span className="text-[9px] font-black uppercase text-slate-505 tracking-wider">Project Progress</span>
                                <div className="text-[8px] font-black uppercase tracking-wide text-slate-400 mt-0.5 border-t border-slate-200/60 pt-1 w-full flex justify-between px-2">
                                  <span className="text-brand-orange">Budget</span>
                                  <span className="text-brand-brown">Logged</span>
                                </div>
                              </div>
                            </th>
                            
                            {/* Dynamic Teammate Headers */}
                            {Array.from(selectedExtractPeople).map(pid => {
                              const person = availablePeople.find(p => p.id === pid);
                              const firstName = person ? person.name.split(' ')[0] : 'User';
                              return (
                                <th key={pid} className="px-2 py-3 text-center border-l border-slate-200 bg-slate-50/50 min-w-[70px]">
                                  <div className="flex flex-col items-center gap-1.5 justify-center">
                                    <img src={person?.avatar} className="w-6 h-6 rounded-full bg-slate-200 ring-1 ring-brand-lavender" title={person?.name} />
                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight block max-w-[65px] truncate">{firstName}</span>
                                    <div className="text-[8px] font-black uppercase tracking-wide text-slate-400 mt-0.5 border-t border-slate-200/60 pt-1 w-full flex justify-between px-1">
                                      <span className="text-brand-orange">Asgn</span>
                                      <span className="text-brand-brown">Logd</span>
                                    </div>
                                  </div>
                                </th>
                              );
                            })}
                            <th className="px-4 py-3 text-center font-black text-[10px] uppercase text-slate-400">Tick</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {renderTasks()}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-brand-beige z-30 shadow-md border-t-2 border-brand-lavender font-sans">
                          <tr className="border-t border-slate-200 text-slate-900 font-extrabold text-[11px]">
                            <td colSpan={groupBy === 'project-tasklist' ? 6 : 6} className="px-4 py-4 uppercase text-slate-400 text-[9px] tracking-wider font-extrabold">
                              TOTAL HOURS ({processedTasks.length} tasks matching filters)
                            </td>
                            {/* Merged Budget/Logged Totals cell */}
                            <td className="px-3 py-3 text-center border-l border-slate-200/50 bg-brand-beige font-sans min-w-[125px]">
                              <div className="flex flex-col items-center justify-center gap-1 w-full">
                                <div className="flex justify-between w-full px-2 text-[10px] font-mono leading-none font-black font-extrabold pb-1">
                                  <span className="text-brand-orange" title="Total Budget">{processedTasksTotals.totalAllocated.toFixed(1)}h</span>
                                  <span className="text-brand-brown" title="Total Logged">{processedTasksTotals.totalLogged.toFixed(1)}h</span>
                                </div>
                                {/* Stacked Progress Bar in Footer */}
                                {processedTasksTotals.totalAllocated > 0 && (
                                  <div className="w-full bg-brand-orange/25 h-2 rounded-full overflow-hidden relative border border-brand-orange/30">
                                    <div 
                                      className="bg-brand-brown h-full rounded-full transition-all duration-300"
                                      style={{ width: `${Math.min(100, Math.max(0, (processedTasksTotals.totalLogged / processedTasksTotals.totalAllocated) * 100))}%` }}
                                    />
                                  </div>
                                )}
                                {processedTasksTotals.totalAllocated > 0 && (
                                  <span className={cn(
                                    "text-[7px] font-black tracking-tight leading-none uppercase px-1 py-0.2 rounded-sm mt-0.5",
                                    (processedTasksTotals.totalLogged / processedTasksTotals.totalAllocated) > 1.1 
                                      ? "bg-red-100 text-red-700"
                                      : (processedTasksTotals.totalLogged / processedTasksTotals.totalAllocated) < 0.7 
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-705"
                                  )}>
                                    {Math.round((processedTasksTotals.totalLogged / processedTasksTotals.totalAllocated) * 100)}% pace
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Dynamic Teammates Column Totals */}
                            {Array.from(selectedExtractPeople).map(pid => {
                              const assignedTotal = processedTasksTotals.personAssignedTotals[pid] || 0;
                              const loggedTotal = processedTasksTotals.personLoggedTotals[pid] || 0;
                              return (
                                <td key={pid} className="px-2 py-3 text-center border-l border-slate-200/50 font-mono bg-slate-50/10">
                                  <div className="flex flex-col items-center gap-0.5 justify-center">
                                    <span className="text-[10px] font-black text-brand-orange block" title="Total Assigned">
                                      {assignedTotal.toFixed(1)}h
                                    </span>
                                    <span className="text-[9px] font-black text-brand-brown block" title="Total Logged">
                                      {loggedTotal.toFixed(1)}h
                                    </span>
                                    {assignedTotal > 0 && (
                                      <span className={cn(
                                        "text-[7px] font-black px-1.5 py-0.2 rounded mt-1 block tracking-tight leading-none",
                                        (loggedTotal / assignedTotal) > 1.1 
                                          ? "bg-red-50 text-red-700 border border-red-100"
                                          : (loggedTotal / assignedTotal) < 0.7 
                                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      )}
                                      title="Total monthly pacing"
                                      >
                                        {Math.round((loggedTotal / assignedTotal) * 100)}% pace
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-4 py-3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
          )}

          {currentStep === 'stage' && (
             <motion.div 
                key="stage"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-8 pb-32"
             >
                <div className="text-center">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 font-rounded">04 — Staging Area</h2>
                  <p className="text-3xl font-black text-slate-900 mt-2">Ready for synchronization?</p>
                </div>

                {proposedChanges.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-border p-16 text-center shadow-sm">
                    <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                    <h3 className="text-xl font-black text-slate-900">Infrastructure is clean</h3>
                    <p className="text-slate-400 mt-2 text-xs font-bold uppercase tracking-wide">No local changes found to push to Teamwork.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-border shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-border">
                            <th className="px-6 py-4 font-black text-[11px] uppercase text-slate-400 tracking-widest">Approve</th>
                            <th className="px-6 py-4 font-black text-[11px] uppercase text-slate-400 tracking-widest">Task / Update</th>
                            <th className="px-6 py-4 font-black text-[11px] uppercase text-slate-400 tracking-widest">Previous</th>
                            <th className="px-6 py-4 font-black text-[11px] uppercase text-slate-400 tracking-widest">Proposed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {proposedChanges.map((change, i) => {
                            const task = tasks.find(t => t.id === change.taskId);
                            const teammateOld = change.field === 'assigneeId' ? teammates.find(t => t.id === change.oldValue)?.name : null;
                            const teammateNew = change.field === 'assigneeId' ? teammates.find(t => t.id === change.newValue)?.name : null;

                            return (
                              <tr key={i} className="hover:bg-slate-50 group">
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => toggleApproval(change.taskId, change.field)}
                                    className={cn(
                                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                      change.approved 
                                        ? "bg-slate-900 border-slate-900 text-white" 
                                        : "border-slate-200 group-hover:border-slate-400"
                                    )}
                                  >
                                    {change.approved && <CheckCircle2 size={12} strokeWidth={4} />}
                                  </button>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">{task?.title}</span>
                                    <span className="text-[9px] font-black uppercase text-brand-orange">{change.field}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono text-slate-400 line-through">
                                    {teammateOld || change.oldValue}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                    {teammateNew || change.newValue}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-1.5 bg-slate-100 rounded-2xl border border-slate-border">
                       <div className="bg-white p-10 rounded-xl border border-slate-border text-center">
                          <h4 className="text-xl font-black text-slate-900 mb-2 uppercase font-rounded italic">Final Orchestration</h4>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 max-w-md mx-auto">
                            Committing {proposedChanges.filter(c => c.approved).length} updates to production Teamwork environment.
                          </p>
                          <button 
                            onClick={pushChanges}
                            disabled={proposedChanges.filter(c => c.approved).length === 0 || isPushing}
                            className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-12 py-5 rounded-xl font-black text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-20 mx-auto"
                          >
                            {isPushing ? (
                              <>
                                <RefreshCw className="animate-spin" size={14} /> COMMITTING...
                              </>
                            ) : (
                              <>
                                PUSH TO TEAMWORK
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </button>
                       </div>
                    </div>
                  </div>
                )}
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Security Layer Review Overlay Modal */}
      <AnimatePresence>
        {isReviewOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-800"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded uppercase tracking-wider">
                    Approval Pipeline
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1 uppercase font-rounded">
                    Review Staged Changes (Ticked Tasks)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">
                    Compare current offline changes vs original Teamwork values. Only checked items are built.
                  </p>
                </div>
                <button 
                  onClick={() => setIsReviewOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-black p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {tasks.filter(t => t.isRowApproved).length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="mx-auto text-amber-500 mb-3 animate-bounce" size={36} />
                    <p className="text-xs font-black text-slate-700 uppercase font-rounded">No tasks checked for staging</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase max-w-xs mx-auto mt-2 leading-relaxed">
                      Please check the box in the "Tick" column at the end of modified rows in the Plan tab to queue them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.filter(t => t.isRowApproved).map(task => {
                      const original = originalTasks.find(ot => ot.id === task.id);
                      if (!original) return null;

                      const diffs = [];
                      if (task.title !== original.title) {
                        diffs.push({ name: 'Title', old: original.title, next: task.title });
                      }
                      if (task.description !== original.description) {
                        diffs.push({ name: 'Description', old: original.description || '(none)', next: task.description || '(none)' });
                      }
                      if (task.startDate !== original.startDate) {
                        diffs.push({ name: 'Start Date', old: original.startDate, next: task.startDate });
                      }
                      if (task.deadline !== original.deadline) {
                        diffs.push({ name: 'End Date', old: original.deadline, next: task.deadline });
                      }
                      if (task.allocatedHours !== original.allocatedHours) {
                        diffs.push({ name: 'Allocated Time', old: `${original.allocatedHours.toFixed(1)}h`, next: `${task.allocatedHours.toFixed(1)}h` });
                      }
                      if (task.assigneeId !== original.assigneeId) {
                        const oldName = teammates.find(tm => tm.id === original.assigneeId)?.name || 'Unassigned';
                        const newName = teammates.find(tm => tm.id === task.assigneeId)?.name || 'Unassigned';
                        diffs.push({ name: 'Primary Assignee', old: oldName, next: newName });
                      }

                      // Hour splits comparison
                      const splitKeys = new Set([...Object.keys(original.userHourSplits), ...Object.keys(task.userHourSplits)]);
                      const splitChanges: string[] = [];
                      splitKeys.forEach(uid => {
                        const oldVal = original.userHourSplits[uid] || 0;
                        const newVal = task.userHourSplits[uid] || 0;
                        if (oldVal !== newVal) {
                          const tmName = teammates.find(tm => tm.id === uid)?.name || `User ${uid}`;
                          splitChanges.push(`${tmName}: ${oldVal.toFixed(1)}h ➔ ${newVal.toFixed(1)}h`);
                        }
                      });
                      if (splitChanges.length > 0) {
                        diffs.push({ name: 'Hour Splits', old: 'Modified splits', next: splitChanges.join(' | ') });
                      }

                      return (
                        <div key={task.id} className="border border-slate-100 rounded-xl bg-slate-50/40 overflow-hidden shadow-xs animate-fade-in">
                          <div className="bg-slate-100/60 p-3 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-slate-400 font-rounded leading-none mb-1">
                                {task.projectName} &gt; {task.tasklistName}
                              </span>
                              <span className="text-xs font-bold text-slate-800 leading-none">{task.title}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded text-[8px] font-black uppercase">
                              Ticked For Sync
                            </span>
                          </div>

                          <div className="p-4 bg-white">
                            {diffs.length === 0 ? (
                              <div className="text-[10px] text-slate-400 font-bold uppercase py-2 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-500" /> Ticked but unmodified. This task configuration will remain intact.
                              </div>
                            ) : (
                              <table className="w-full text-left font-sans">
                                <thead>
                                  <tr className="border-b border-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="py-2 w-28">Field</th>
                                    <th className="py-2 px-4 text-slate-400">Before value</th>
                                    <th className="py-2 px-4 text-slate-800">Proposed value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {diffs.map((diff, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/30 text-xs text-slate-800">
                                      <td className="py-2.5 text-[10px] font-black uppercase text-slate-400 font-rounded font-semibold">
                                        {diff.name}
                                      </td>
                                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 line-through">
                                        {diff.old}
                                      </td>
                                      <td className="py-2.5 px-4 font-bold text-brand-orange">
                                        <span className="bg-brand-orange/5 text-brand-orange px-2.5 py-0.5 rounded text-[10px] border border-brand-orange/15 shadow-inner">
                                          {diff.next}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button 
                  onClick={() => setIsReviewOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase rounded shadow-sm transition-all cursor-pointer font-rounded"
                >
                  Close Review
                </button>
                <button 
                  onClick={pushChanges}
                  disabled={tasks.filter(t => t.isRowApproved).length === 0 || isPushing}
                  className="px-8 py-3 bg-brand-orange hover:opacity-95 disabled:opacity-20 text-white text-[10px] font-black uppercase rounded flex items-center gap-2 shadow-[0_0_20px_rgba(255,90,39,0.35)] transition-all font-rounded cursor-pointer"
                >
                  {isPushing ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} /> Syncing...
                    </>
                  ) : (
                    <>
                      PUSH {tasks.filter(t => t.isRowApproved).length} APPROVED TASKS TO TEAMWORK
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  disabled,
  badge
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded transition-all text-[10px] font-black uppercase tracking-tight",
        active 
          ? "bg-white text-slate-900 shadow-sm border border-slate-border" 
          : "text-slate-400 hover:text-slate-600 hover:bg-white/40",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[8px] px-1.5 py-0.5 rounded shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );
}


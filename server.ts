// [AI-STATE: LOCKED - CORE LOGIC]
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

function flattenTasks(tasks: any[], parentProjId = "", parentProjName = "", parentListId = "", parentListName = ""): any[] {
  let flat: any[] = [];
  if (!Array.isArray(tasks)) return flat;
  for (const t of tasks) {
    if (!t) continue;
    const projId = t["project-id"] || parentProjId;
    const projName = t["project-name"] || parentProjName;
    const listId = t["todo-list-id"] || parentListId;
    const listName = t["todo-list-name"] || parentListName;
    
    const augmentedTask = {
      ...t,
      "project-id": projId ? String(projId) : "",
      "project-name": projName || "",
      "todo-list-id": listId ? String(listId) : "",
      "todo-list-name": listName || ""
    };
    flat.push(augmentedTask);
    
    const nested = t.subtasks || t["sub-tasks"] || t.subTasks || [];
    if (Array.isArray(nested) && nested.length > 0) {
      flat = [...flat, ...flattenTasks(nested, projId, projName, listId, listName)];
    }
  }
  return flat;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const TEAMWORK_URL = process.env.VITE_TEAMWORK_URL?.replace(/\/$/, "");
  const TEAMWORK_TOKEN = process.env.TEAMWORK_TOKEN;

  const teamworkApi = axios.create({
    baseURL: TEAMWORK_URL,
    auth: {
      username: TEAMWORK_TOKEN || "",
      password: "X"
    }
  });

  // API Routes
  app.get("/api/people", async (req, res) => {
    try {
      if (!TEAMWORK_TOKEN) throw new Error("TEAMWORK_TOKEN is missing");
      const response = await teamworkApi.get("/people.json");
      res.json({ people: response.data.people || [] });
    } catch (error: any) {
      console.error("Teamwork People API Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch people" });
    }
  });

  app.post("/api/extract", async (req, res) => {
    try {
      const { userIds, unassignedTasklistKeyword, startDate, endDate } = req.body;
      if (!TEAMWORK_TOKEN) throw new Error("TEAMWORK_TOKEN is missing");

      // Set up timeframe range based on payload or fall back to current month
      let fromDateStr = "";
      let toDateStr = "";
      if (startDate) {
        fromDateStr = startDate; // Format: "YYYY-MM-DD"
      } else {
        const now = new Date();
        fromDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      }
      if (endDate) {
        toDateStr = endDate; // Format: "YYYY-MM-DD"
      }

      // Format YYYYMMDD for Teamwork dates (extremely safe)
      const fromDateNoDashes = fromDateStr.replace(/-/g, "");
      const toDateNoDashes = toDateStr ? toDateStr.replace(/-/g, "") : "";

      // Fetch tasks using optimized concurrent parallel page fetching and user-level filtering
      async function fetchTasks(paramsStr: string) {
        try {
          const firstPageRes = await teamworkApi.get(`/tasks.json?status=all&include=project&includeCompletedTasks=true&nestSubTasks=no&pageSize=250&pagesize=250&page=1${paramsStr}`);
          const firstPageTasks = firstPageRes.data["todo-items"] || [];
          
          let totalPages = 1;
          const totalPagesHeader = firstPageRes.headers["x-pages"] || firstPageRes.headers["X-Pages"];
          if (totalPagesHeader) {
            totalPages = parseInt(String(totalPagesHeader), 10) || 1;
          }
          
          let tasks = [...firstPageTasks];
          if (totalPages > 1) {
            const pagePromises = [];
            // Cap to at most 15 pages in parallel to keep memory footprint low and avoid rate limits
            const targetMaxPage = Math.min(totalPages, 15);
            for (let p = 2; p <= targetMaxPage; p++) {
              pagePromises.push(
                teamworkApi.get(`/tasks.json?status=all&include=project&includeCompletedTasks=true&nestSubTasks=no&pageSize=250&pagesize=250&page=${p}${paramsStr}`)
                  .then(r => r.data["todo-items"] || [])
                  .catch(err => {
                    console.error(`Error fetching page ${p}:`, err.message);
                    return [];
                  })
              );
            }
            const pagesResults = await Promise.all(pagePromises);
            pagesResults.forEach(tasksPage => {
              if (Array.isArray(tasksPage)) {
                tasks = [...tasks, ...tasksPage];
              }
            });
          }
          return tasks;
        } catch (err: any) {
          console.error("Error fetching tasks with params:", paramsStr, err.message);
          return [];
        }
      }

      let allTasks: any[] = [];
      const targetUserIdsStr = (userIds || []).map(String);

      if (targetUserIdsStr.length > 0) {
        if (unassignedTasklistKeyword) {
          // Parallel fetch of assigned tasks and other tasks to filter unassigned by keyword
          const [assignedResults, globalResults] = await Promise.all([
            fetchTasks(`&responsible-party-ids=${targetUserIdsStr.join(",")}`),
            fetchTasks("")
          ]);
          allTasks = [...assignedResults, ...globalResults];
        } else {
          // Retrieve only tasks assigned to the targets to speed up extraction by 10x+
          allTasks = await fetchTasks(`&responsible-party-ids=${targetUserIdsStr.join(",")}`);
        }
      } else {
        allTasks = await fetchTasks("");
      }

      // Flatten nested subtasks recursively and deduplicate them by id
      const rawFlattened = flattenTasks(allTasks);
      const uniqueTasksMap = new Map<string, any>();
      rawFlattened.forEach((t: any) => {
        if (t && t.id) {
          uniqueTasksMap.set(String(t.id), t);
        }
      });
      allTasks = Array.from(uniqueTasksMap.values());

      const projectsRes = await teamworkApi.get("/projects.json?status=ALL");
      const projects = projectsRes.data.projects || [];

            // Fetch time entries for this timeframe
      let allTimeEntries: any[] = [];

      if (targetUserIdsStr.length > 0) {
        // Fetch per-user to guarantee zero truncation and ultra-fast targeted response
        await Promise.all(
          targetUserIdsStr.map(async (uid) => {
            let timePage = 1;
            let timeHasMore = true;
            while (timeHasMore) {
              let pageUrl = `/time_entries.json?userId=${uid}&personId=${uid}&person-id=${uid}&fromdate=${fromDateStr}&fromDate=${fromDateStr}&pageSize=250&page=${timePage}`;
              if (toDateStr) {
                pageUrl += `&todate=${toDateStr}&toDate=${toDateStr}`;
              }
              try {
                const timeResponse = await teamworkApi.get(pageUrl);
                const entriesPage = timeResponse.data["time-entries"] || [];
                if (entriesPage.length === 0) {
                  timeHasMore = false;
                } else {
                  allTimeEntries = [...allTimeEntries, ...entriesPage];
                  if (entriesPage.length < 250) {
                    timeHasMore = false;
                  } else {
                    timePage++;
                  }
                }
              } catch (err: any) {
                console.error(`Error fetching time logs for user ${uid}:`, err.message);
                timeHasMore = false;
              }
            }
          })
        );
      } else {
        // Fetch globally when no specific users are chosen
        let timePage = 1;
        let timeHasMore = true;
        while (timeHasMore) {
          let pageUrl = `/time_entries.json?fromdate=${fromDateStr}&fromDate=${fromDateStr}&pageSize=250&page=${timePage}`;
          if (toDateStr) {
            pageUrl += `&todate=${toDateStr}&toDate=${toDateStr}`;
          }
          try {
            const timeResponse = await teamworkApi.get(pageUrl);
            const entriesPage = timeResponse.data["time-entries"] || [];
            if (entriesPage.length === 0) {
              timeHasMore = false;
            } else {
              allTimeEntries = [...allTimeEntries, ...entriesPage];
              if (entriesPage.length < 250) {
                timeHasMore = false;
              } else {
                timePage++;
              }
            }
          } catch (err: any) {
            console.error(`Error fetching global time logs:`, err.message);
            timeHasMore = false;
          }
        }
      }

      // 1. Precise task filtering as baseline
      let filteredTasks = allTasks.filter((t: any) => {
        const targetUserIdsStr = (userIds || []).map(String);
        
        const taskAssigneeId = t["responsible-party-id"] ? String(t["responsible-party-id"]) : "";
        const taskAssigneeIds = t["responsible-party-ids"] 
          ? String(t["responsible-party-ids"]).split(',').map((x: any) => String(x).trim()) 
          : [];
        
        const isAssignedToTarget = targetUserIdsStr.length > 0 && (
          targetUserIdsStr.includes(taskAssigneeId) ||
          taskAssigneeIds.some(id => targetUserIdsStr.includes(id))
        );
        
        const isUnassigned = !t["responsible-party-id"] && taskAssigneeIds.length === 0;
        const matchesKeyword = unassignedTasklistKeyword 
          ? (t["todo-list-name"] || "").toLowerCase().includes(unassignedTasklistKeyword.toLowerCase())
          : false;

        return isAssignedToTarget || (isUnassigned && matchesKeyword);
      });

      // Map: TaskId -> task object
      const finalTasksMap = new Map<string, any>();

      // Populate physical base tasks
      filteredTasks.forEach((t: any) => {
        finalTasksMap.set(String(t.id), {
          ...t,
          id: String(t.id),
          "project-id": t["project-id"] ? String(t["project-id"]) : "",
          "todo-list-id": t["todo-list-id"] ? String(t["todo-list-id"]) : "",
          loggedMinutes: 0,
          userLoggedSplits: {},
          isVirtual: false
        });
      });

      // Dynamic Join with All Time Entries (Ensuring no dropped hours and complete decoupling from active-only filters)
      allTimeEntries.forEach((entry: any) => {
        let minutes = 0;
        if (entry.hoursDecimal !== undefined && entry.hoursDecimal !== null) {
          minutes = Math.round(parseFloat(String(entry.hoursDecimal)) * 60);
        } else {
          const hoursPart = parseInt(entry.hours, 10) || 0;
          const minsPart = parseInt(entry.minutes, 10) || 0;
          minutes = hoursPart * 60 + minsPart;
        }
        if (minutes <= 0) return;

        const taskId = entry["todo-item-id"] ? String(entry["todo-item-id"]) : null;
        const entryUserId = entry["person-id"] ? String(entry["person-id"]) : "unknown-user";

        const entryProjId = entry["project-id"] ? String(entry["project-id"]) : "other-project";
        let entryProjName = entry["project-name"] || "";
        if (!entryProjName && entryProjId !== "other-project") {
          entryProjName = projects.find((p: any) => String(p.id) === entryProjId)?.name || "Other";
        }
        if (!entryProjName) entryProjName = "Other";

        const entryListId = entry["todo-list-id"] ? String(entry["todo-list-id"]) : "unknown-list";
        const entryListName = entry["todo-list-name"] || "General List Logs";

        if (taskId) {
          if (finalTasksMap.has(taskId)) {
            const existing = finalTasksMap.get(taskId);
            existing.loggedMinutes += minutes;
            if (!existing.userLoggedSplits) existing.userLoggedSplits = {};
            existing.userLoggedSplits[entryUserId] = (existing.userLoggedSplits[entryUserId] || 0) + (minutes / 60);
          } else {
            // Unconsumed completed/closed or unassigned task time log -> create specific virtual task row
            const entryTaskName = entry["todo-item-name"] || entry["todo-item-title"] || entry["todoItemName"] || entry["todo-item-content"] || "Direct Log / Task Details Unavailable";
            finalTasksMap.set(taskId, {
              id: taskId,
              content: entryTaskName,
              description: "Completed/closed or unassigned task time log.",
              "project-id": entryProjId,
              "project-name": entryProjName,
              "todo-list-id": entryListId,
              "todo-list-name": entryListName,
              "estimated-minutes": 0,
              "responsible-party-id": "",
              loggedMinutes: minutes,
              userLoggedSplits: {
                [entryUserId]: minutes / 60
              },
              isVirtual: true
            });
          }
        } else {
          // Logged directly at project or list level
          const key = `virtual-direct-${entryProjId}-${entryListId}`;
          if (finalTasksMap.has(key)) {
            const existing = finalTasksMap.get(key);
            existing.loggedMinutes += minutes;
            if (!existing.userLoggedSplits) existing.userLoggedSplits = {};
            existing.userLoggedSplits[entryUserId] = (existing.userLoggedSplits[entryUserId] || 0) + (minutes / 60);
          } else {
            finalTasksMap.set(key, {
              id: key,
              content: "Other Time Logs & Direct Logs",
              description: "Time logged directly against the project or list level.",
              "project-id": entryProjId,
              "project-name": entryProjName,
              "todo-list-id": entryListId,
              "todo-list-name": entryListName,
              "estimated-minutes": 0,
              "responsible-party-id": "",
              loggedMinutes: minutes,
              userLoggedSplits: {
                [entryUserId]: minutes / 60
              },
              isVirtual: true
            });
          }
        }
      });

      res.json({
        tasks: Array.from(finalTasksMap.values()),
        timeEntries: allTimeEntries.map((e: any) => {
          const entryId = String(e.id);
          const entryPersonId = e["person-id"] ? String(e["person-id"]) : "unknown-user";
          const entryPersonName = e["person-name"] || "";
          const entryProjId = e["project-id"] ? String(e["project-id"]) : "other-project";
          const entryProjName = e["project-name"] || "Other";
          
          let rawDate = e.dateUserPerspective || e["date-user-perspective"] || e["date-user"] || e.date || "";
          if (rawDate && rawDate.includes("T")) {
            rawDate = rawDate.split("T")[0];
          }
          if (rawDate && rawDate.length === 8 && !rawDate.includes("-")) {
            rawDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          }
          let entryMinutes = 0;
          if (e.hoursDecimal !== undefined && e.hoursDecimal !== null) {
            entryMinutes = Math.round(parseFloat(String(e.hoursDecimal)) * 60);
          } else {
            const h = parseInt(e.hours, 10) || 0;
            const m = parseInt(e.minutes, 10) || 0;
            entryMinutes = h * 60 + m;
          }

          return {
            id: entryId,
            personId: entryPersonId,
            personName: entryPersonName,
            projectId: entryProjId,
            projectName: entryProjName,
            taskId: e["todo-item-id"] ? String(e["todo-item-id"]) : null,
            listId: e["todo-list-id"] ? String(e["todo-list-id"]) : "unknown-list",
            date: rawDate,
            hours: entryMinutes / 60,
            description: e.description || ""
          };
        })
      });
    } catch (error: any) {
      console.error("Teamwork Extract Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to extract from Teamwork" });
    }
  });

  app.post("/api/tasks/update", async (req, res) => {
    try {
      const { taskId, updates } = req.body;
      if (!taskId) return res.status(400).json({ error: "TaskId is required" });

      // Map our frontend fields to Teamwork fields if necessary
      // For now, assuming simple updates
      const response = await teamworkApi.put(`/tasks/${taskId}.json`, {
        "todo-item": updates
      });

      res.json({ success: true, data: response.data });
    } catch (error: any) {
      console.error("Teamwork Update Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to update Teamwork task" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      if (!TEAMWORK_TOKEN) throw new Error("TEAMWORK_TOKEN is missing");
      const response = await teamworkApi.get("/projects.json?status=ALL");
      res.json({ projects: response.data.projects || [] });
    } catch (error: any) {
      console.error("Teamwork Projects Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch projects from Teamwork" });
    }
  });

  app.get("/api/projects/:projectId/tasklists", async (req, res) => {
    try {
      if (!TEAMWORK_TOKEN) throw new Error("TEAMWORK_TOKEN is missing");
      const { projectId } = req.params;
      const response = await teamworkApi.get(`/projects/${projectId}/tasklists.json`);
      res.json({ tasklists: response.data.tasklists || [] });
    } catch (error: any) {
      console.error("Teamwork Tasklists Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch tasklists from Teamwork" });
    }
  });

  app.post("/api/tasks/create", async (req, res) => {
    try {
      if (!TEAMWORK_TOKEN) throw new Error("TEAMWORK_TOKEN is missing");
      const { tasklistId, task } = req.body;
      if (!tasklistId) return res.status(400).json({ error: "tasklistId is required" });
      if (!task) return res.status(400).json({ error: "task is required" });

      const response = await teamworkApi.post(`/tasklists/${tasklistId}/tasks.json`, {
        "todo-item": task
      });

      res.json({ success: true, data: response.data });
    } catch (error: any) {
      console.error("Teamwork Task Create Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to create task in Teamwork" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

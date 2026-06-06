import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

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

      // Fetch all task pages
      let allTasks: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await teamworkApi.get(`/tasks.json?status=all&include=project&includeCompletedTasks=true&pageSize=250&page=${page}`);
        const tasksPage = res.data["todo-items"] || [];
        allTasks = [...allTasks, ...tasksPage];
        
        // Teamwork returns X-Pages header, but checking array length is a reliable stop signal for general use
        if (tasksPage.length < 250) {
          hasMore = false;
        } else {
          page++;
          // Safety break to prevent infinite loops if something goes wrong
          if (page > 20) hasMore = false; 
        }
      }

      const projectsRes = await teamworkApi.get("/projects.json?status=ALL");
      const projects = projectsRes.data.projects || [];

      // Fetch all time entry pages per-user to prevent truncated results from global pagination
      let allTimeEntries: any[] = [];
      const targetUserIdsStr = (userIds || []).map(String);

      if (targetUserIdsStr.length > 0) {
        for (const uid of targetUserIdsStr) {
          let userPage = 1;
          let userHasMore = true;
          while (userHasMore) {
            let pageUrl = `/time_entries.json?fromDate=${fromDateStr}&fromdate=${fromDateStr}&userId=${uid}&userid=${uid}&personId=${uid}&person-id=${uid}&pageSize=250&page=${userPage}`;
            if (toDateStr) {
              pageUrl += `&toDate=${toDateStr}&todate=${toDateStr}`;
            }
            const timeResponse = await teamworkApi.get(pageUrl);
            const entriesPage = timeResponse.data["time-entries"] || [];
            allTimeEntries = [...allTimeEntries, ...entriesPage];
            
            if (entriesPage.length < 250) {
              userHasMore = false;
            } else {
              userPage++;
              if (userPage > 15) userHasMore = false; // Safety guard range limit
            }
          }
        }
      } else {
        let timePage = 1;
        let timeHasMore = true;
        while (timeHasMore) {
          let pageUrl = `/time_entries.json?fromDate=${fromDateStr}&fromdate=${fromDateStr}&pageSize=250&page=${timePage}`;
          if (toDateStr) {
            pageUrl += `&toDate=${toDateStr}&todate=${toDateStr}`;
          }
          const timeResponse = await teamworkApi.get(pageUrl);
          const entriesPage = timeResponse.data["time-entries"] || [];
          allTimeEntries = [...allTimeEntries, ...entriesPage];
          
          if (entriesPage.length < 250) {
            timeHasMore = false;
          } else {
            timePage++;
            if (timePage > 20) timeHasMore = false; // Safety guard range limit
          }
        }
      }

      // Filter time logs to only include the people we selected
      if (targetUserIdsStr.length > 0) {
        allTimeEntries = allTimeEntries.filter((entry: any) => {
          const personId = entry["person-id"] ? String(entry["person-id"]) : "";
          return targetUserIdsStr.includes(personId);
        });
      }

      // 1. Precise task filtering
      let filteredTasks = allTasks.filter((t: any) => {
        const taskAssigneeId = t["responsible-party-id"] ? String(t["responsible-party-id"]) : "";
        const targetUserIdsStr = (userIds || []).map(String);
        const isAssignedToTarget = targetUserIdsStr.length > 0 && targetUserIdsStr.includes(taskAssigneeId);
        
        const isUnassigned = !t["responsible-party-id"];
        const matchesKeyword = unassignedTasklistKeyword 
          ? (t["todo-list-name"] || "").toLowerCase().includes(unassignedTasklistKeyword.toLowerCase())
          : false;

        return isAssignedToTarget || (isUnassigned && matchesKeyword);
      });

      // 2. Time aggregation with fallbacks
      // Map: Key (task|list|project) -> Minutes
      const taskTimeMap = new Map();
      const listTimeMap = new Map();
      const projectTimeMap = new Map();

      // Deeper aggregation to map physical user logging
      const taskUserLoggedMap = new Map<string, Record<string, number>>();
      const listUserLoggedMap = new Map<string, Record<string, number>>();
      const projectUserLoggedMap = new Map<string, Record<string, number>>();

      allTimeEntries.forEach((entry: any) => {
        const minutes = parseInt(entry.minutes) || (parseFloat(entry.hours) * 60) || 0;
        const taskId = entry["todo-item-id"] ? String(entry["todo-item-id"]) : null;
        const listId = entry["todo-list-id"] ? String(entry["todo-list-id"]) : null;
        const projectId = entry["project-id"] ? String(entry["project-id"]) : null;
        const userId = entry["person-id"] ? String(entry["person-id"]) : null;

        if (taskId) taskTimeMap.set(taskId, (taskTimeMap.get(taskId) || 0) + minutes);
        if (listId) listTimeMap.set(listId, (listTimeMap.get(listId) || 0) + minutes);
        if (projectId) projectTimeMap.set(projectId, (projectTimeMap.get(projectId) || 0) + minutes);

        if (userId) {
          if (taskId) {
            if (!taskUserLoggedMap.has(taskId)) taskUserLoggedMap.set(taskId, {});
            const record = taskUserLoggedMap.get(taskId)!;
            record[userId] = (record[userId] || 0) + minutes;
          }
          if (listId) {
            if (!listUserLoggedMap.has(listId)) listUserLoggedMap.set(listId, {});
            const record = listUserLoggedMap.get(listId)!;
            record[userId] = (record[userId] || 0) + minutes;
          }
          if (projectId) {
            if (!projectUserLoggedMap.has(projectId)) projectUserLoggedMap.set(projectId, {});
            const record = projectUserLoggedMap.get(projectId)!;
            record[userId] = (record[userId] || 0) + minutes;
          }
        }
      });

      // 3. Track filtered tasks ids
      const filteredTaskIds = new Set(filteredTasks.map(t => String(t.id)));

      // 4. Map unconsumed time entries to create virtual task rows
      const unconsumedGrouped = new Map<string, {
        projectId: string,
        projectName: string,
        listId: string,
        listName: string,
        totalMinutes: number,
        userMinutes: Record<string, number>
      }>();

      allTimeEntries.forEach((entry: any) => {
        const taskId = entry["todo-item-id"] ? String(entry["todo-item-id"]) : null;
        const isConsumed = taskId && filteredTaskIds.has(taskId);

        if (!isConsumed) {
          const minutes = parseInt(entry.minutes) || (parseFloat(entry.hours) * 60) || 0;
          if (minutes <= 0) return;

          const pId = entry["project-id"] ? String(entry["project-id"]) : "other-project";
          let pName = entry["project-name"] || "";
          if (pId === "other-project" || !pName) {
            pName = pId !== "other-project" 
              ? (projects.find((p: any) => String(p.id) === pId)?.name || "Other")
              : "Other";
          }
          const lId = entry["todo-list-id"] ? String(entry["todo-list-id"]) : "unknown-list";
          const lName = entry["todo-list-name"] || "General List Logs";
          const userId = entry["person-id"] ? String(entry["person-id"]) : "unknown-user";

          const key = `${pId}-${lId}`;
          if (!unconsumedGrouped.has(key)) {
            unconsumedGrouped.set(key, {
              projectId: pId,
              projectName: pName,
              listId: lId,
              listName: lName,
              totalMinutes: 0,
              userMinutes: {}
            });
          }

          const group = unconsumedGrouped.get(key)!;
          group.totalMinutes += minutes;
          group.userMinutes[userId] = (group.userMinutes[userId] || 0) + minutes;
        }
      });

      const virtualTasks: any[] = [];
      unconsumedGrouped.forEach((group, key) => {
        const userLoggedSplits: Record<string, number> = {};
        Object.entries(group.userMinutes).forEach(([uid, mins]) => {
          userLoggedSplits[String(uid)] = mins / 60;
        });

        virtualTasks.push({
          id: `virtual-${key}`,
          content: "Other Time Logs & Completed Tasks",
          description: "Aggregate of time logged directly against the project/list level or completed/unlisted tasks.",
          "project-id": group.projectId,
          "project-name": group.projectName,
          "todo-list-id": group.listId,
          "todo-list-name": group.listName,
          "estimated-minutes": 0,
          "responsible-party-id": "",
          loggedMinutes: group.totalMinutes,
          userLoggedSplits,
          isVirtual: true
        });
      });

      res.json({
        tasks: [
          ...filteredTasks.map((t: any) => {
            const tId = String(t.id);
            const tListId = t["todo-list-id"] ? String(t["todo-list-id"]) : "";
            const tProjectId = t["project-id"] ? String(t["project-id"]) : "";

            // Get only the time entries logged directly to this specific task (prevent double-counting)
            const loggedMinutes = taskTimeMap.get(tId) || 0;
            const userRecord = taskUserLoggedMap.get(tId) || {};

            // Convert user logged minutes to decimal hours
            const userLoggedSplits: Record<string, number> = {};
            Object.entries(userRecord).forEach(([uid, mins]) => {
              userLoggedSplits[String(uid)] = mins / 60;
            });

            return {
              ...t,
              id: tId,
              "project-id": tProjectId,
              "todo-list-id": tListId,
              loggedMinutes,
              userLoggedSplits
            };
          }),
          ...virtualTasks
        ],
        timeEntries: allTimeEntries.map((e: any) => {
          const entryId = String(e.id);
          const entryPersonId = e["person-id"] ? String(e["person-id"]) : "unknown-user";
          const entryPersonName = e["person-name"] || "";
          const entryProjId = e["project-id"] ? String(e["project-id"]) : "other-project";
          const entryProjName = e["project-name"] || "Other";
          
          let rawDate = e["date-user"] || e.date || "";
          if (rawDate && rawDate.includes("T")) {
            rawDate = rawDate.split("T")[0];
          }
          if (rawDate && rawDate.length === 8 && !rawDate.includes("-")) {
            rawDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          }
          const entryMinutes = parseInt(e.minutes) || (parseFloat(e.hours) * 60) || 0;

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

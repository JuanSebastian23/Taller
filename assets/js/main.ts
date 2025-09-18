// ===== DEFINICIÓN DE TIPOS E INTERFACES =====

/**
 * Declaración global de Bootstrap para TypeScript
 */
declare const bootstrap: any;

/**
 * Tipos de filtros disponibles para las tareas
 * - all: Mostrar todas las tareas
 * - active: Solo tareas pendientes
 * - done: Solo tareas completadas
 * - recent: Tareas creadas en las últimas 24 horas
 * - old: Tareas creadas hace más de una semana
 */
type Filter = "all" | "active" | "done" | "recent" | "old";

/**
 * Interfaz que define la estructura de una tarea
 * @interface Task
 */
interface Task {
  id: string;                    // Identificador único de la tarea
  title: string;                 // Título/descripción de la tarea
  done: boolean;                 // Estado de completado (true/false)
  createdAt: number;             // Timestamp de creación
  completedAt?: number;          // Timestamp de completado (opcional)
  priority?: "low" | "medium" | "high";  // Prioridad de la tarea (opcional)
  tags?: string[];               // Array de etiquetas asociadas (opcional)
}

/**
 * Interfaz que define una actividad en el historial
 * @interface Activity
 */
interface Activity {
  id: string;                    // Identificador único de la actividad
  type: "create" | "edit" | "complete" | "uncomplete" | "delete" | "clear_done" | "reset_all" | "export" | "import";  // Tipo de acción
  taskId?: string;               // ID de la tarea relacionada (opcional)
  taskTitle?: string;            // Título de la tarea (opcional)
  timestamp: number;             // Timestamp de la actividad
  details?: string;              // Detalles adicionales (opcional)
}

/**
 * Interfaz que define el estado global de la aplicación
 * @interface AppState
 */
/**
 * Interfaz que define un usuario del sistema
 */
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: number;
}

/**
 * Interfaz que define el estado de autenticación
 */
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token?: string;
}

interface AppState {
  tasks: Task[];                 // Array de todas las tareas
  filter: Filter;                // Filtro activo actual
  searchQuery: string;           // Consulta de búsqueda actual
  selectedTags: string[];        // Etiquetas seleccionadas para nueva tarea
  availableTags: string[];       // Todas las etiquetas disponibles
  activities: Activity[];        // Historial de actividades
  tagFilter: string;             // Filtro de etiqueta activo ("all" o nombre de etiqueta)
  auth: AuthState;               // Estado de autenticación
}

// ===== ESTADO GLOBAL DE LA APLICACIÓN =====

/**
 * Estado principal de la aplicación que contiene todos los datos
 * Se mantiene sincronizado con localStorage para persistencia
 */
const state: AppState = { 
  tasks: [],                                                    // Lista de tareas
  filter: "all",                                               // Filtro activo por defecto
  searchQuery: "",                                             // Búsqueda vacía por defecto
  selectedTags: [],                                            // Sin etiquetas seleccionadas
  availableTags: ["Trabajo", "Personal", "Estudio", "Urgente"], // Etiquetas predefinidas
  activities: [],                                              // Historial vacío
  tagFilter: "all",                                            // Mostrar todas las etiquetas por defecto
  auth: {                                                      // Estado de autenticación
    isLoggedIn: false,
    user: null,
    token: undefined
  }
};

/**
 * Generador de IDs únicos para tareas y actividades
 * @returns {string} ID único de 8 caracteres
 */
const uid = (): string => Math.random().toString(36).slice(2, 10);

// ===== SISTEMA DE PERSISTENCIA CON LOCALSTORAGE =====

// Claves para almacenar diferentes tipos de datos en localStorage
const STORAGE_KEY = "todo-app-tasks";           // Tareas
const TAGS_STORAGE_KEY = "todo-app-tags";       // Etiquetas disponibles
const ACTIVITIES_STORAGE_KEY = "todo-app-activities";  // Historial de actividades

/**
 * Guarda todos los datos de la aplicación en localStorage
 * Incluye tareas, etiquetas y actividades
 */
function saveTasks(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(state.availableTags));
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(state.activities));
  } catch {
    // Ignorar errores de cuota/permiso - la app sigue funcionando sin persistencia
  }
}

/**
 * Carga las tareas desde localStorage
 * @returns {Task[]} Array de tareas o array vacío si hay error
 */
function loadTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Task[]) : [];
  } catch {
    return [];  // Retornar array vacío en caso de error
  }
}

/**
 * Carga las etiquetas disponibles desde localStorage
 * @returns {string[]} Array de etiquetas o etiquetas por defecto
 */
function loadTags(): string[] {
  try {
    const data = localStorage.getItem(TAGS_STORAGE_KEY);
    return data ? (JSON.parse(data) as string[]) : ["Trabajo", "Personal", "Estudio", "Urgente"];
  } catch {
    return ["Trabajo", "Personal", "Estudio", "Urgente"];  // Etiquetas por defecto
  }
}

/**
 * Carga el historial de actividades desde localStorage
 * @returns {Activity[]} Array de actividades o array vacío si hay error
 */
function loadActivities(): Activity[] {
  try {
    const data = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    return data ? (JSON.parse(data) as Activity[]) : [];
  } catch {
    return [];  // Retornar array vacío en caso de error
  }
}

/**
 * Limpia completamente el localStorage de la aplicación
 * Se usa cuando se resetea toda la aplicación
 */
function clearAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TAGS_STORAGE_KEY);
    localStorage.removeItem(ACTIVITIES_STORAGE_KEY);
    localStorage.removeItem('auth_state');
  } catch {
    // Ignorar errores - no es crítico
  }
}

// ===== REFERENCIAS A ELEMENTOS DEL DOM =====

// Elementos principales de la aplicación
const $input = document.getElementById("task-input") as HTMLInputElement;              // Input para nueva tarea
const $addBtn = document.getElementById("add-btn") as HTMLButtonElement;              // Botón agregar tarea
const $list = document.getElementById("list") as HTMLElement;                         // Contenedor del grid de tareas
const $counter = document.getElementById("counter") as HTMLSpanElement;               // Contador de tareas
const $empty = document.getElementById("empty") as HTMLDivElement;                    // Mensaje de estado vacío
const $clearDone = document.getElementById("clear-done") as HTMLButtonElement;        // Botón limpiar completadas

// Elementos de filtros y búsqueda
const $filterButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('button[data-filter]')
);                                                                                    // Botones de filtros
const $searchInput = document.getElementById("search-input") as HTMLInputElement;     // Input de búsqueda
const $clearSearch = document.getElementById("clear-search") as HTMLButtonElement;    // Botón limpiar búsqueda

// Elementos del sistema de etiquetas
const $tagSelector = document.getElementById("tag-selector") as HTMLElement;          // Contenedor de etiquetas
const $newTagInput = document.getElementById("new-tag-input") as HTMLInputElement;    // Input nueva etiqueta
const $addTagBtn = document.getElementById("add-tag-btn") as HTMLButtonElement;       // Botón crear etiqueta
const $tagFilterDropdown = document.getElementById("tag-filter-dropdown") as HTMLElement; // Dropdown filtro etiquetas

// Elementos del historial de actividades
const $historyPanel = document.getElementById("history-panel") as HTMLElement;        // Panel del historial
const $historyList = document.getElementById("history-list") as HTMLElement;          // Lista de actividades
const $historyEmpty = document.getElementById("history-empty") as HTMLElement;        // Mensaje historial vacío
const $clearHistory = document.getElementById("clear-history") as HTMLButtonElement;  // Botón limpiar historial
const $toggleHistory = document.getElementById("toggle-history") as HTMLButtonElement; // Botón mostrar/ocultar historial

// Elementos de estadísticas
const $statsPanel = document.getElementById("stats-panel") as HTMLElement;            // Panel de estadísticas
const $toggleStats = document.getElementById("toggle-stats") as HTMLButtonElement;    // Botón mostrar/ocultar stats
const $refreshStats = document.getElementById("refresh-stats") as HTMLButtonElement;  // Botón actualizar stats

// Elementos de exportar/importar
const $exportJson = document.getElementById("export-json") as HTMLButtonElement;      // Botón exportar JSON
const $exportCsv = document.getElementById("export-csv") as HTMLButtonElement;        // Botón exportar CSV
const $importData = document.getElementById("import-data") as HTMLButtonElement;      // Botón importar datos
const $importFile = document.getElementById("import-file") as HTMLInputElement;       // Input archivo (oculto)

// Elementos de estadísticas rápidas (tarjetas superiores)
const $statActive = document.getElementById("stat-active") as HTMLElement | null;      // Contador tareas activas
const $statDone = document.getElementById("stat-done") as HTMLElement | null;          // Contador tareas completadas
const $statTotal = document.getElementById("stat-total") as HTMLElement | null;        // Contador total tareas
const $statActivities = document.getElementById("stat-activities") as HTMLElement | null; // Contador actividades

// ===== VARIABLES GLOBALES PARA GRÁFICAS =====

/**
 * Declaración de Chart.js para TypeScript
 */
declare const Chart: any;

/**
 * Objeto que almacena las instancias de Chart.js
 * Permite destruir y recrear gráficas cuando sea necesario
 */
let charts: { [key: string]: any } = {};

// ===== SISTEMA DE EXPORTAR/IMPORTAR DATOS =====

/**
 * Exporta todos los datos de la aplicación en formato JSON
 * Incluye tareas, etiquetas, actividades y metadatos
 */
function exportToJSON(): void {
  // Crear objeto con todos los datos de la aplicación
  const exportData = {
    tasks: state.tasks,                    // Todas las tareas
    availableTags: state.availableTags,    // Etiquetas disponibles
    activities: state.activities,          // Historial de actividades
    exportDate: new Date().toISOString(),  // Fecha de exportación
    version: "1.0"                         // Versión del formato
  };
  
  // Convertir a JSON con formato legible
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  // Crear enlace de descarga automática
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  // Registrar la actividad de exportación
  addActivity("export", undefined, undefined, "Datos exportados en formato JSON");
}

/**
 * Exporta solo las tareas en formato CSV compatible con Excel/Google Sheets
 * Incluye columnas: ID, Título, Estado, Fecha de creación, Fecha de completado, Etiquetas
 */
function exportToCSV(): void {
  // Definir encabezados de las columnas
  const headers = ['ID', 'Título', 'Estado', 'Creada', 'Completada', 'Etiquetas'];
  const rows = [headers.join(',')];
  
  // Procesar cada tarea y convertir a fila CSV
  state.tasks.forEach(task => {
    const row = [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`, // Escapar comillas dobles
      task.done ? 'Completada' : 'Activa',
      new Date(task.createdAt).toLocaleString(),
      task.completedAt ? new Date(task.completedAt).toLocaleString() : '',
      task.tags ? `"${task.tags.join('; ')}"` : ''  // Unir etiquetas con punto y coma
    ];
    rows.push(row.join(','));
  });
  
  // Crear contenido CSV
  const csvContent = rows.join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Crear enlace de descarga automática
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  // Registrar la actividad de exportación
  addActivity("export", undefined, undefined, "Datos exportados en formato CSV");
}

/**
 * Abre el selector de archivos para importar datos
 * Activa el input file oculto
 */
function importData(): void {
  $importFile.click();
}

/**
 * Maneja la selección y procesamiento de archivos de importación
 * @param {Event} event - Evento de cambio del input file
 */
function handleFileImport(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      
      // Determinar el tipo de archivo y procesar según corresponda
      if (file.name.endsWith('.json')) {
        importFromJSON(content);
      } else if (file.name.endsWith('.csv')) {
        importFromCSV(content);
      } else {
        alert('Formato de archivo no soportado. Use .json o .csv');
      }
    } catch (error) {
      alert('Error al procesar el archivo: ' + (error as Error).message);
    }
  };
  
  reader.readAsText(file);
  target.value = ''; // Limpiar input para permitir seleccionar el mismo archivo
}

/**
 * Importa datos desde un archivo JSON
 * Restaura completamente el estado de la aplicación
 * @param {string} content - Contenido del archivo JSON
 */
function importFromJSON(content: string): void {
  const data = JSON.parse(content);
  
  // Validar estructura básica del archivo
  if (!data.tasks || !Array.isArray(data.tasks)) {
    throw new Error('Formato JSON inválido: falta el array de tareas');
  }
  
  // Mostrar confirmación con detalles de la importación
  const ok = confirm(
    `¿Importar ${data.tasks.length} tareas?\n\n` +
    `Esto reemplazará todas las tareas actuales.\n` +
    `Etiquetas disponibles: ${data.availableTags?.length || 0}\n` +
    `Actividades: ${data.activities?.length || 0}`
  );
  
  if (!ok) return;
  
  // Importar tareas con conversión de fechas
  state.tasks = data.tasks.map((task: any) => ({
    ...task,
    // Asegurar que las fechas sean timestamps (números)
    createdAt: typeof task.createdAt === 'string' ? new Date(task.createdAt).getTime() : task.createdAt,
    completedAt: task.completedAt ? (typeof task.completedAt === 'string' ? new Date(task.completedAt).getTime() : task.completedAt) : undefined
  }));
  
  // Importar etiquetas si están disponibles
  if (data.availableTags) {
    state.availableTags = data.availableTags;
  }
  
  // Importar actividades con conversión de fechas
  if (data.activities) {
    state.activities = data.activities.map((activity: any) => ({
      ...activity,
      timestamp: typeof activity.timestamp === 'string' ? new Date(activity.timestamp).getTime() : activity.timestamp
    }));
  }
  
  // Guardar y renderizar
  saveTasks();
  render();
  
  // Registrar la actividad de importación
  addActivity("import", undefined, undefined, `${data.tasks.length} tareas importadas desde JSON`);
  
  // Mostrar confirmación de éxito
  alert(`Importación exitosa!\n\n- ${state.tasks.length} tareas\n- ${state.availableTags.length} etiquetas\n- ${state.activities.length} actividades`);
}

/**
 * Importa tareas desde un archivo CSV
 * Convierte datos tabulares a objetos Task
 * @param {string} content - Contenido del archivo CSV
 */
function importFromCSV(content: string): void {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Validar estructura básica del CSV
  if (headers.length < 3) {
    throw new Error('Formato CSV inválido: se requieren al menos 3 columnas');
  }
  
  const tasks: Task[] = [];
  
  // Procesar cada línea del CSV (saltando el header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Saltar líneas vacías
    
    // Parsear CSV simple (no maneja comillas anidadas complejas)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length < 3) continue; // Saltar líneas incompletas
    
    // Crear objeto Task desde los valores CSV
    const task: Task = {
      id: values[0] || uid(),                    // ID (generar si está vacío)
      title: values[1] || 'Tarea sin título',    // Título
      done: values[2]?.toLowerCase().includes('completada') || false, // Estado
      createdAt: values[3] ? new Date(values[3]).getTime() : Date.now(), // Fecha creación
      completedAt: values[4] ? new Date(values[4]).getTime() : undefined, // Fecha completado
      tags: values[5] ? values[5].split(';').map(t => t.trim()).filter(t => t) : [] // Etiquetas
    };
    
    tasks.push(task);
  }
  
  // Confirmar importación
  const ok = confirm(`¿Importar ${tasks.length} tareas desde CSV?\n\nEsto reemplazará todas las tareas actuales.`);
  
  if (!ok) return;
  
  // Actualizar estado y renderizar
  state.tasks = tasks;
  saveTasks();
  render();
  
  // Registrar la actividad de importación
  addActivity("import", undefined, undefined, `${tasks.length} tareas importadas desde CSV`);
  
  // Mostrar confirmación de éxito
  alert(`Importación exitosa!\n\n- ${tasks.length} tareas importadas`);
}

// ===== SISTEMA DE ESTADÍSTICAS Y GRÁFICAS =====

/**
 * Alterna la visibilidad del panel de estadísticas
 * Renderiza las gráficas cuando se muestra el panel
 */
function toggleStatsPanel(): void {
  const isVisible = $statsPanel.style.display !== "none";
  $statsPanel.style.display = isVisible ? "none" : "block";
  
  // Actualizar texto del botón
  $toggleStats.innerHTML = isVisible ? 
    '<i class="bi bi-eye me-1"></i>Mostrar' : 
    '<i class="bi bi-eye-slash me-1"></i>Ocultar';
  
  if (!isVisible) {
    // Renderizar gráficas cuando se muestra el panel
    // Usar setTimeout para asegurar que el DOM esté listo
    setTimeout(() => {
      renderAllCharts();
    }, 100);
  }
}

/**
 * Actualiza todas las gráficas con datos actuales
 */
function refreshStats(): void {
  renderAllCharts();
}

/**
 * Renderiza todas las gráficas del sistema
 * Se ejecuta cuando se abre el panel de estadísticas
 */
function renderAllCharts(): void {
  renderTasksStatusChart();        // Gráfica de estado de tareas
  renderDailyProductivityChart();  // Productividad diaria
  renderWeeklyActivityChart();     // Actividad semanal
  renderMonthlyTrendsChart();      // Tendencias mensuales
  renderTagsDistributionChart();   // Distribución por etiquetas
  renderTagsCompletionChart();     // Completado por etiquetas
}

/**
 * Renderiza la gráfica de estado de tareas (dona)
 * Muestra la proporción entre tareas activas y completadas
 */
function renderTasksStatusChart(): void {
  const ctx = document.getElementById('tasks-status-chart') as HTMLCanvasElement;
  if (!ctx) return;
  
  // Destruir gráfica existente para evitar conflictos
  if (charts.tasksStatus) {
    charts.tasksStatus.destroy();
  }
  
  // Calcular estadísticas
  const active = state.tasks.filter(t => !t.done).length;
  const completed = state.tasks.filter(t => t.done).length;
  
  // Crear nueva gráfica de dona
  charts.tasksStatus = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Activas', 'Completadas'],
      datasets: [{
        data: [active, completed],
        backgroundColor: ['#ffc107', '#198754'],  // Amarillo para activas, verde para completadas
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function renderDailyProductivityChart(): void {
  const ctx = document.getElementById('daily-productivity-chart') as HTMLCanvasElement;
  if (!ctx) return;
  
  if (charts.dailyProductivity) {
    charts.dailyProductivity.destroy();
  }
  
  // Obtener datos de los últimos 7 días
  const last7Days: string[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last7Days.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));
  }
  
  // Contar tareas completadas por día
  const completedByDay = last7Days.map((_, index) => {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - (6 - index));
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    return state.tasks.filter(t => 
      t.completedAt && 
      t.completedAt >= dayStart.getTime() && 
      t.completedAt <= dayEnd.getTime()
    ).length;
  });
  
  charts.dailyProductivity = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Tareas Completadas',
        data: completedByDay,
        backgroundColor: '#0d6efd',
        borderColor: '#0d6efd',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderWeeklyActivityChart(): void {
  const ctx = document.getElementById('weekly-activity-chart') as HTMLCanvasElement;
  if (!ctx) return;
  
  if (charts.weeklyActivity) {
    charts.weeklyActivity.destroy();
  }
  
  // Contar actividades por tipo en la última semana
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const weeklyActivities = state.activities.filter(a => a.timestamp > weekAgo);
  
  const activityCounts = {
    create: weeklyActivities.filter(a => a.type === 'create').length,
    complete: weeklyActivities.filter(a => a.type === 'complete').length,
    edit: weeklyActivities.filter(a => a.type === 'edit').length,
    delete: weeklyActivities.filter(a => a.type === 'delete').length
  };
  
  charts.weeklyActivity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Creadas', 'Completadas', 'Editadas', 'Eliminadas'],
      datasets: [{
        label: 'Actividades de la Semana',
        data: [activityCounts.create, activityCounts.complete, activityCounts.edit, activityCounts.delete],
        borderColor: '#198754',
        backgroundColor: 'rgba(25, 135, 84, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderMonthlyTrendsChart(): void {
  const ctx = document.getElementById('monthly-trends-chart') as HTMLCanvasElement;
  if (!ctx) return;
  
  if (charts.monthlyTrends) {
    charts.monthlyTrends.destroy();
  }
  
  // Obtener datos de las últimas 4 semanas
  const weeks: string[] = [];
  const today = new Date();
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weeks.push(`Semana ${4 - i}`);
  }
  
  const weeklyData = weeks.map((_, index) => {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - ((3 - index) * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return state.tasks.filter(t => 
      t.createdAt >= weekStart.getTime() && 
      t.createdAt <= weekEnd.getTime()
    ).length;
  });
  
  charts.monthlyTrends = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [{
        label: 'Tareas Creadas',
        data: weeklyData,
        borderColor: '#fd7e14',
        backgroundColor: 'rgba(253, 126, 20, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderTagsDistributionChart(): void {
  const ctx = document.getElementById('tags-distribution-chart') as HTMLCanvasElement;
  if (!ctx) return;
  
  if (charts.tagsDistribution) {
    charts.tagsDistribution.destroy();
  }
  
  // Contar tareas por etiqueta
  const tagCounts: { [key: string]: number } = {};
  
  state.tasks.forEach(task => {
    if (task.tags) {
      task.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  const labels = Object.keys(tagCounts);
  const data = Object.values(tagCounts);
  const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
  
  charts.tagsDistribution = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function renderTagsCompletionChart(): void {
  const ctx = document.getElementById('tags-completion-chart') as HTMLCanvasElement;
  if (!ctx) return;
  
  if (charts.tagsCompletion) {
    charts.tagsCompletion.destroy();
  }
  
  // Contar tareas completadas por etiqueta
  const tagCompletion: { [key: string]: { completed: number, total: number } } = {};
  
  state.tasks.forEach(task => {
    if (task.tags) {
      task.tags.forEach(tag => {
        if (!tagCompletion[tag]) {
          tagCompletion[tag] = { completed: 0, total: 0 };
        }
        tagCompletion[tag].total++;
        if (task.done) {
          tagCompletion[tag].completed++;
        }
      });
    }
  });
  
  const labels = Object.keys(tagCompletion);
  const completedData = labels.map(tag => tagCompletion[tag].completed);
  const totalData = labels.map(tag => tagCompletion[tag].total);
  
  charts.tagsCompletion = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Completadas',
        data: completedData,
        backgroundColor: '#198754'
      }, {
        label: 'Total',
        data: totalData,
        backgroundColor: '#6c757d'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// ===== SISTEMA DE HISTORIAL DE ACTIVIDADES =====

/**
 * Agrega una nueva actividad al historial
 * @param {Activity["type"]} type - Tipo de actividad
 * @param {string} [taskId] - ID de la tarea relacionada (opcional)
 * @param {string} [taskTitle] - Título de la tarea (opcional)
 * @param {string} [details] - Detalles adicionales (opcional)
 */
function addActivity(type: Activity["type"], taskId?: string, taskTitle?: string, details?: string): void {
  const activity: Activity = {
    id: uid(),
    type,
    taskId,
    taskTitle,
    timestamp: Date.now(),
    details
  };
  
  // Agregar al inicio del array (más reciente primero)
  state.activities.unshift(activity);
  
  // Mantener solo las últimas 100 actividades para evitar que localStorage se llene
  if (state.activities.length > 100) {
    state.activities = state.activities.slice(0, 100);
  }
  
  // Guardar y actualizar vista
  saveTasks();
  renderHistory();
}

function clearHistory(): void {
  const ok = confirm("¿Seguro que quieres limpiar todo el historial de actividades?");
  if (!ok) return;
  
  state.activities = [];
  saveTasks();
  renderHistory();
}

function toggleHistoryPanel(): void {
  if (!$historyPanel || !$toggleHistory) return;
  const isVisible = $historyPanel.style.display !== "none";
  $historyPanel.style.display = isVisible ? "none" : "block";
  $toggleHistory.innerHTML = isVisible ? 
    '<i class="bi bi-eye me-1"></i>Mostrar' : 
    '<i class="bi bi-eye-slash me-1"></i>Ocultar';
}

function renderHistory(): void {
  if (!$historyList || !$historyEmpty) return;
  $historyList.innerHTML = "";
  
  if (state.activities.length === 0) {
    $historyEmpty.classList.remove("d-none");
    return;
  }
  
  $historyEmpty.classList.add("d-none");
  
  for (const activity of state.activities) {
    const item = document.createElement("div");
    item.className = "list-group-item list-group-item-action border-0 py-2";
    
    const icon = getActivityIcon(activity.type);
    const text = getActivityText(activity);
    const time = new Date(activity.timestamp).toLocaleString();
    
    item.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="me-3">
          <i class="${icon} fs-5"></i>
        </div>
        <div class="flex-grow-1">
          <div class="fw-medium">${text}</div>
          <small class="text-secondary">${time}</small>
        </div>
      </div>
    `;
    
    $historyList.appendChild(item);
  }
}

function getActivityIcon(type: Activity["type"]): string {
  switch (type) {
    case "create": return "bi bi-plus-circle text-success";
    case "edit": return "bi bi-pencil-square text-primary";
    case "complete": return "bi bi-check-circle text-success";
    case "uncomplete": return "bi bi-arrow-counterclockwise text-warning";
    case "delete": return "bi bi-trash3 text-danger";
    case "clear_done": return "bi bi-broom text-info";
    case "reset_all": return "bi bi-x-circle text-danger";
    default: return "bi bi-circle text-secondary";
  }
}

function getActivityText(activity: Activity): string {
  switch (activity.type) {
    case "create": return `Tarea creada: "${activity.taskTitle}"`;
    case "edit": return `Tarea editada: "${activity.taskTitle}"`;
    case "complete": return `Tarea completada: "${activity.taskTitle}"`;
    case "uncomplete": return `Tarea reactivada: "${activity.taskTitle}"`;
    case "delete": return `Tarea eliminada: "${activity.taskTitle}"`;
    case "clear_done": return "Tareas completadas eliminadas";
    case "reset_all": return "Todas las tareas eliminadas";
    default: return "Actividad desconocida";
  }
}

// ===== OPERACIONES CRUD DE TAREAS =====

/**
 * Agrega una nueva tarea al sistema
 * @param {string} title - Título de la tarea
 */
function addTask(title: string): void {
  const trimmed = (title ?? "").trim();
  if (!trimmed) return; // No agregar tareas vacías
  
  // Crear nueva tarea con etiquetas seleccionadas
  const newTask: Task = { 
    id: uid(), 
    title: trimmed, 
    done: false, 
    createdAt: Date.now(),
    tags: [...state.selectedTags]  // Copiar etiquetas seleccionadas
  };
  
  // Agregar al inicio del array (más reciente primero)
  state.tasks.unshift(newTask);
  state.selectedTags = []; // Limpiar etiquetas seleccionadas
  
  // Registrar actividad en el historial
  addActivity("create", newTask.id, newTask.title);
  
  // Actualizar vista y limpiar input
  render();
  $input.value = "";
  $input.focus();
}

/**
 * Alterna el estado de completado de una tarea
 * @param {string} id - ID de la tarea a alternar
 */
function toggleTask(id: string): void {
  state.tasks = state.tasks.map(t => {
    if (t.id === id) {
      const newDone = !t.done;
      
      // Registrar actividad en el historial
      addActivity(newDone ? "complete" : "uncomplete", t.id, t.title);
      
      return { 
        ...t, 
        done: newDone,
        completedAt: newDone ? Date.now() : undefined  // Guardar fecha de completado
      };
    }
    return t;
  });
  render();
}

/**
 * Elimina una tarea del sistema
 * @param {string} id - ID de la tarea a eliminar
 */
function removeTask(id: string): void {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    // Registrar actividad antes de eliminar
    addActivity("delete", task.id, task.title);
  }
  // Filtrar la tarea del array
  state.tasks = state.tasks.filter(t => t.id !== id);
  render();
}

function clearDone(): void {
  const doneCount = state.tasks.filter(t => t.done).length;
  if (doneCount > 0) {
    addActivity("clear_done", undefined, undefined, `${doneCount} tareas eliminadas`);
  }
  state.tasks = state.tasks.filter(t => !t.done);
  render();
}

/**
 * Establece el filtro activo para las tareas
 * @param {Filter} f - Tipo de filtro a aplicar
 */
function setFilter(f: Filter): void {
  state.filter = f;
  render();
}

/**
 * Establece la consulta de búsqueda
 * @param {string} query - Texto de búsqueda
 */
function setSearchQuery(query: string): void {
  state.searchQuery = query.trim();
  render();
}

// ===== SISTEMA DE ETIQUETAS =====

/**
 * Agrega una nueva etiqueta al sistema
 * @param {string} tagName - Nombre de la nueva etiqueta
 */
function addNewTag(tagName: string): void {
  const trimmed = tagName.trim();
  if (!trimmed || state.availableTags.includes(trimmed)) return; // No agregar etiquetas vacías o duplicadas
  
  state.availableTags.push(trimmed);
  saveTasks();
  renderTagSelector();
  renderTagFilter();
}

/**
 * Alterna la selección de una etiqueta para nueva tarea
 * @param {string} tagName - Nombre de la etiqueta
 */
function toggleTagSelection(tagName: string): void {
  const index = state.selectedTags.indexOf(tagName);
  if (index > -1) {
    state.selectedTags.splice(index, 1);  // Remover si está seleccionada
  } else {
    state.selectedTags.push(tagName);     // Agregar si no está seleccionada
  }
  renderTagSelector();
}

/**
 * Establece el filtro por etiquetas
 * @param {string} tagName - Nombre de la etiqueta a filtrar ("all" para mostrar todas)
 */
function setTagFilter(tagName: string): void {
  state.tagFilter = tagName;
  render();
}

/**
 * Renderiza el selector de etiquetas para nueva tarea
 * Muestra todas las etiquetas disponibles como badges clicables
 */
function renderTagSelector(): void {
  $tagSelector.innerHTML = "";
  
  for (const tag of state.availableTags) {
    const isSelected = state.selectedTags.includes(tag);
    const tagElement = document.createElement("span");
    tagElement.className = `badge ${isSelected ? 'bg-primary' : 'bg-secondary'} cursor-pointer`;
    tagElement.textContent = tag;
    tagElement.style.cursor = "pointer";
    tagElement.addEventListener("click", () => toggleTagSelection(tag));
    $tagSelector.appendChild(tagElement);
  }
}

/**
 * Renderiza el dropdown de filtros por etiquetas con UX profesional
 * Actualiza la lista de etiquetas disponibles en el dropdown
 */
function renderTagFilter(): void {
  // Limpiar dropdown excepto los primeros elementos (header y separador)
  const existingItems = $tagFilterDropdown.querySelectorAll('li');
  for (let i = 2; i < existingItems.length; i++) {
    existingItems[i].remove();
  }
  
  // Agregar etiquetas disponibles al dropdown
  for (const tag of state.availableTags) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "dropdown-item";
    a.href = "#";
    a.dataset.tagFilter = tag;
    
    // Crear contenido con icono y contador de tareas
    const taskCount = state.tasks.filter(t => t.tags?.includes(tag)).length;
    const isCurrentFilter = state.tagFilter === tag;
    
    a.innerHTML = `
      <i class="bi bi-tag me-2"></i>
      <span class="flex-grow-1">${tag}</span>
      <span class="badge bg-secondary ms-2" style="font-size: 0.7rem;">${taskCount}</span>
    `;
    
    // Marcar como activo si es el filtro actual
    if (isCurrentFilter) {
      a.classList.add("active");
    }
    
    a.addEventListener("click", (e) => {
      e.preventDefault();
      setTagFilter(tag);
      
      // Actualizar estado visual inmediatamente
      $tagFilterDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.remove('active');
      });
      a.classList.add('active');
      
      // Cerrar dropdown después de selección
      const dropdownElement = $tagFilterDropdown.parentElement?.querySelector('.dropdown-toggle');
      if (dropdownElement && typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
        const dropdown = bootstrap.Dropdown.getInstance(dropdownElement);
        if (dropdown) {
          dropdown.hide();
        }
      }
    });
    
    li.appendChild(a);
    $tagFilterDropdown.appendChild(li);
  }
  
  // Actualizar estado del item "Todas las etiquetas"
  const allTagsItem = $tagFilterDropdown.querySelector('[data-tag-filter="all"]');
  if (allTagsItem) {
    allTagsItem.classList.toggle('active', state.tagFilter === 'all');
  }
}

/**
 * Muestra los detalles de una tarea en un alert
 * @param {string} id - ID de la tarea a visualizar
 */
function viewTask(id: string): void {
  const t = state.tasks.find(x => x.id === id);
  if (!t) {
    alert("No se encontró la tarea.");
    return;
  }
  const created = new Date(t.createdAt).toLocaleString();
  alert(
    `📄 Detalle de la tarea\n\n` +
    `ID: ${t.id}\n` +
    `Título: ${t.title}\n` +
    `Estado: ${t.done ? "Completada" : "Activa"}\n` +
    `Creada: ${created}`
  );
}

/**
 * Permite editar el título de una tarea
 * @param {string} id - ID de la tarea a editar
 */
function editTaskTitle(id: string): void {
  const t = state.tasks.find(x => x.id === id);
  if (!t) {
    alert("No se encontró la tarea.");
    return;
  }
  const nuevo = prompt("Nuevo título para la tarea:", t.title);
  if (nuevo === null) return; // Usuario canceló
  const trimmed = nuevo.trim();
  if (!trimmed) {
    alert("El título no puede estar vacío.");
    return;
  }
  
  // Registrar actividad en el historial
  addActivity("edit", t.id, trimmed, `De: "${t.title}" a: "${trimmed}"`);
  
  // Actualizar la tarea
  state.tasks = state.tasks.map(x => (x.id === id ? { ...x, title: trimmed } : x));
  render();
}

// ===== FUNCIONES DE RESET Y LIMPIEZA =====

/**
 * Resetea completamente la aplicación
 * Elimina todas las tareas, etiquetas y actividades
 */
function resetAll(): void {
  const ok = confirm("¿Seguro que quieres borrar TODAS las tareas? Esta acción no se puede deshacer.");
  if (!ok) return;
  
  const taskCount = state.tasks.length;
  if (taskCount > 0) {
    // Registrar actividad antes de resetear
    addActivity("reset_all", undefined, undefined, `${taskCount} tareas eliminadas`);
  }
  
  // Limpiar estado y almacenamiento
  state.tasks = [];
  clearAllStorage();
  render();
}

// ===== FUNCIONES AUXILIARES =====

/**
 * Filtra y ordena las tareas según los criterios activos
 * Aplica filtros de estado, búsqueda y etiquetas
 * @returns {Task[]} Array de tareas filtradas y ordenadas
 */
function visibleTasks(): Task[] {
  let filtered = state.tasks;
  
  // Aplicar filtro de estado
  switch (state.filter) {
    case "active": 
      filtered = state.tasks.filter(t => !t.done);
      break;
    case "done":   
      filtered = state.tasks.filter(t => t.done);
      break;
    case "recent":
      // Tareas creadas en las últimas 24 horas
      filtered = state.tasks.filter(t => {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return t.createdAt > oneDayAgo;
      });
      break;
    case "old":
      // Tareas creadas hace más de una semana
      filtered = state.tasks.filter(t => {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return t.createdAt < oneWeekAgo;
      });
      break;
    default:
      filtered = state.tasks;
  }
  
  // Aplicar búsqueda por título
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(query)
    );
  }
  
  // Aplicar filtro por etiquetas (nuevo sistema)
  if (state.tagFilter && state.tagFilter !== "all") {
    filtered = filtered.filter(t => 
      t.tags && t.tags.includes(state.tagFilter)
    );
  }
  
  // Aplicar filtro por etiquetas seleccionadas para nueva tarea
  if (state.selectedTags.length > 0) {
    filtered = filtered.filter(t => 
      t.tags && t.tags.some(tag => state.selectedTags.includes(tag))
    );
  }
  
  // Ordenar por fecha de creación (más recientes primero)
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

// Crea e inserta el botón "Resetear lista" junto a "Eliminar completadas"
function ensureResetButton(): void {
  const existing = document.getElementById("reset-all") as HTMLButtonElement | null;
  if (existing) return;

  // Intentar ubicarlo al lado del botón #clear-done
  const container = $clearDone?.parentElement ?? document.body;
  const btn = document.createElement("button");
  btn.id = "reset-all";
  btn.type = "button";
  btn.className = "btn btn-outline-warning btn-sm";
  btn.innerHTML = '<i class="bi bi-x-circle me-1"></i> Resetear lista';
  btn.addEventListener("click", resetAll);

  // Agregar pequeña separación
  const spacer = document.createElement("span");
  spacer.className = "d-inline-block";
  spacer.style.width = "6px";

  container.append(spacer, btn);
}

// ===== FUNCIÓN PRINCIPAL DE RENDERIZADO =====

/**
 * Función principal que renderiza toda la interfaz de usuario
 * Actualiza tareas, estadísticas, filtros y paneles
 */
function render(): void {
  const tasks = visibleTasks();

  // Mostrar/ocultar mensaje de estado vacío
  $empty.classList.toggle("d-none", tasks.length !== 0);

  // Limpiar grid de tareas
  $list.innerHTML = "";

  // Renderizar cada tarea como una tarjeta
  for (const t of tasks) {
    const col = document.createElement("div");
    col.className = "col";

    const card = document.createElement("div");
    card.className = "card h-100 shadow-sm";
    if (t.done) card.classList.add("border-success", "opacity-75");

    // Header de la tarjeta (checkbox + título)
    const header = document.createElement("div");
    header.className = "card-header bg-transparent d-flex align-items-center gap-2";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input";
    checkbox.checked = t.done;
    checkbox.title = "Marcar como completada / activa";
    checkbox.addEventListener("change", () => toggleTask(t.id));

    const title = document.createElement("div");
    title.className = "ms-1 fw-semibold task-title";
    title.textContent = t.title;
    if (t.done) title.classList.add("text-decoration-line-through");

    header.append(checkbox, title);

    // Agregar etiquetas si existen
    if (t.tags && t.tags.length > 0) {
      const tagsContainer = document.createElement("div");
      tagsContainer.className = "mt-2 d-flex flex-wrap gap-1";
      
      for (const tag of t.tags) {
        const tagElement = document.createElement("span");
        tagElement.className = "badge bg-info text-dark";
        tagElement.style.fontSize = "0.7rem";
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
      }
      
      header.appendChild(tagsContainer);
    }

    // Body de la tarjeta (metadatos)
    const body = document.createElement("div");
    body.className = "card-body py-2";
    const meta = document.createElement("div");
    meta.className = "text-secondary small";
    
    const createdText = "Creada: " + new Date(t.createdAt).toLocaleString();
    const completedText = t.completedAt ? 
      " • Completada: " + new Date(t.completedAt).toLocaleString() : "";
    
    meta.textContent = createdText + completedText;
    body.appendChild(meta);

    // Footer de la tarjeta (botones de acción)
    const footer = document.createElement("div");
    footer.className = "card-footer bg-transparent d-flex justify-content-end gap-2";

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn btn-sm btn-outline-secondary";
    viewBtn.innerHTML = '<i class="bi bi-eye me-1"></i>Ver';
    viewBtn.addEventListener("click", () => viewTask(t.id));

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-outline-primary";
    editBtn.innerHTML = '<i class="bi bi-pencil-square me-1"></i>Editar';
    editBtn.addEventListener("click", () => editTaskTitle(t.id));

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-sm btn-outline-danger";
    removeBtn.innerHTML = '<i class="bi bi-trash3 me-1"></i>Eliminar';
    removeBtn.addEventListener("click", () => removeTask(t.id));

    footer.append(viewBtn, editBtn, removeBtn);

    card.append(header, body, footer);
    col.appendChild(card);
    $list.appendChild(col);
  }

  // Actualizar contadores y estadísticas
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  const active = total - done;

  $counter.textContent = `${total} tareas • ${done} completadas`;
  if ($statActive) $statActive.textContent = String(active);
  if ($statDone)   $statDone.textContent = String(done);
  if ($statTotal)  $statTotal.textContent = String(total);
  if ($statActivities) $statActivities.textContent = String(state.activities.length);

  // Actualizar estado de filtros activos
  for (const b of $filterButtons) {
    b.classList.toggle("active", b.dataset.filter === state.filter);
  }

  // Actualizar campo de búsqueda
  $searchInput.value = state.searchQuery;
  $clearSearch.style.display = state.searchQuery ? "block" : "none";

  // Actualizar selectores de etiquetas
  renderTagSelector();
  renderTagFilter();

  // Actualizar historial de actividades
  renderHistory();

  // Asegurar que el botón de reset esté presente
  ensureResetButton();

  // Guardar estado en localStorage
  saveTasks();
}

// ===== SISTEMA DE AUTENTICACIÓN =====

/**
 * Simula el login de un usuario
 */
function loginUser(email: string, password: string): boolean {
  // Simulación básica de autenticación
  if (email && password.length >= 6) {
    const user: User = {
      id: uid(),
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email: email,
      createdAt: Date.now()
    };
    
    state.auth = {
      isLoggedIn: true,
      user: user,
      token: 'demo_token_' + uid()
    };
    
    // Guardar en localStorage
    localStorage.setItem('auth_state', JSON.stringify(state.auth));
    
    // Actualizar UI
    updateAuthUI();
    
    // Registrar actividad
    addActivity("create", undefined, undefined, `Usuario ${user.name} inició sesión`);
    
    return true;
  }
  return false;
}

/**
 * Registra un nuevo usuario
 */
function registerUser(name: string, email: string, password: string): boolean {
  // Validaciones básicas
  if (!name || !email || password.length < 8) {
    return false;
  }
  
  const user: User = {
    id: uid(),
    name: name,
    email: email,
    createdAt: Date.now()
  };
  
  state.auth = {
    isLoggedIn: true,
    user: user,
    token: 'demo_token_' + uid()
  };
  
  // Guardar en localStorage
  localStorage.setItem('auth_state', JSON.stringify(state.auth));
  
  // Actualizar UI
  updateAuthUI();
  
  // Registrar actividad
  addActivity("create", undefined, undefined, `Nuevo usuario ${user.name} registrado`);
  
  return true;
}

/**
 * Cierra la sesión del usuario
 */
function logoutUser(): void {
  const userName = state.auth.user?.name;
  
  state.auth = {
    isLoggedIn: false,
    user: null,
    token: undefined
  };
  
  // Limpiar localStorage
  localStorage.removeItem('auth_state');
  
  // Actualizar UI
  updateAuthUI();
  
  // Registrar actividad
  if (userName) {
    addActivity("delete", undefined, undefined, `Usuario ${userName} cerró sesión`);
  }
}

/**
 * Carga el estado de autenticación desde localStorage
 */
function loadAuthState(): void {
  const saved = localStorage.getItem('auth_state');
  if (saved) {
    try {
      state.auth = JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading auth state:', e);
      state.auth = { isLoggedIn: false, user: null };
    }
  }
  updateAuthUI();
}

/**
 * Actualiza la interfaz según el estado de autenticación
 */
function updateAuthUI(): void {
  const guestSection = document.getElementById('auth-guest');
  const userSection = document.getElementById('auth-user');
  const userName = document.getElementById('user-name');
  
  if (!guestSection || !userSection || !userName) return;
  
  if (state.auth.isLoggedIn && state.auth.user) {
    guestSection.classList.add('d-none');
    userSection.classList.remove('d-none');
    userName.textContent = state.auth.user.name;
  } else {
    guestSection.classList.remove('d-none');
    userSection.classList.add('d-none');
  }
}

// ===== SISTEMA DE NAVEGACIÓN =====
// Simplificado: solo sistema de autenticación, sin navegación entre secciones

/**
 * Muestra notificaciones toast
 */
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  // Crear elemento toast
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  // Crear contenedor si no existe
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  container.appendChild(toast);
  
  // Mostrar toast
  const bsToast = new (window as any).bootstrap.Toast(toast);
  bsToast.show();
  
  // Remover del DOM después de ocultarse
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// ===== SISTEMA DE DROPDOWN PORTAL =====

/**
 * Configura un dropdown para usar "portal" approach
 * Mueve el dropdown al body para evitar stacking context issues
 */
function setupDropdownPortal(button: HTMLElement, dropdownMenu: HTMLElement): void {
  let isPortalActive = false;
  let originalParent: HTMLElement | null = null;
  let originalNextSibling: HTMLElement | null = null;

  // Función para calcular posición
  function calculatePosition(): { top: number; left: number } {
    const buttonRect = button.getBoundingClientRect();
    const menuWidth = 200; // min-width del dropdown
    const viewportWidth = window.innerWidth;
    
    let left = buttonRect.right - menuWidth; // Alinear a la derecha del botón
    let top = buttonRect.bottom + 8; // 8px de margen

    // Ajustar si se sale de la pantalla
    if (left < 10) {
      left = buttonRect.left;
    }
    if (left + menuWidth > viewportWidth - 10) {
      left = viewportWidth - menuWidth - 10;
    }

    return { top, left };
  }

  // Función para mover al portal
  function moveToPortal(): void {
    if (isPortalActive) return;
    
    // Guardar posición original
    originalParent = dropdownMenu.parentElement;
    originalNextSibling = dropdownMenu.nextElementSibling as HTMLElement;
    
    // Mover al body
    document.body.appendChild(dropdownMenu);
    
    // Aplicar posición
    const { top, left } = calculatePosition();
    dropdownMenu.style.cssText = `
      position: fixed !important;
      top: ${top}px !important;
      left: ${left}px !important;
      z-index: 2147483647 !important;
      margin: 0 !important;
      transform: none !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;
    
    isPortalActive = true;
  }

  // Función para devolver a posición original
  function removeFromPortal(): void {
    if (!isPortalActive || !originalParent) return;
    
    // Restaurar posición original
    if (originalNextSibling) {
      originalParent.insertBefore(dropdownMenu, originalNextSibling);
    } else {
      originalParent.appendChild(dropdownMenu);
    }
    
    // Limpiar estilos inline
    dropdownMenu.style.cssText = '';
    
    isPortalActive = false;
  }

  // Event listeners
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isVisible = dropdownMenu.style.display === 'block' && isPortalActive;
    
    if (isVisible) {
      removeFromPortal();
    } else {
      // Cerrar otros dropdowns primero
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== dropdownMenu) {
          (menu as HTMLElement).style.display = 'none';
        }
      });
      
      moveToPortal();
    }
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (isPortalActive && !dropdownMenu.contains(e.target as Node) && !button.contains(e.target as Node)) {
      removeFromPortal();
    }
  });

  // Reposicionar en resize/scroll
  function updatePosition(): void {
    if (isPortalActive) {
      const { top, left } = calculatePosition();
      dropdownMenu.style.top = `${top}px`;
      dropdownMenu.style.left = `${left}px`;
    }
  }

  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);
}

// ===== CONFIGURACIÓN DE EVENTOS E INICIALIZACIÓN =====
function initializeApp(): void {
  // Eventos principales de la aplicación
  $addBtn.addEventListener("click", () => addTask($input.value));
  $input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") addTask($input.value);
  });
  $clearDone.addEventListener("click", clearDone);

  // Eventos de búsqueda
  $searchInput.addEventListener("input", (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearchQuery(target.value);
  });
  $clearSearch.addEventListener("click", () => {
    setSearchQuery("");
    $searchInput.focus();
  });

  // Eventos de filtros
  for (const b of $filterButtons) {
    b.addEventListener("click", () => setFilter((b.dataset.filter as Filter) ?? "all"));
  }

  // Eventos del sistema de etiquetas
  $addTagBtn.addEventListener("click", () => {
    const tagName = $newTagInput.value;
    if (tagName.trim()) {
      addNewTag(tagName);
      $newTagInput.value = "";
    }
  });

  $newTagInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      const tagName = $newTagInput.value;
      if (tagName.trim()) {
        addNewTag(tagName);
        $newTagInput.value = "";
      }
    }
  });

  // Evento para filtro "Todas las etiquetas"
  const allTagsItem = $tagFilterDropdown.querySelector('[data-tag-filter="all"]');
  if (allTagsItem) {
    allTagsItem.addEventListener("click", (e) => {
      e.preventDefault();
      setTagFilter("all");
    });
  }

  // Configurar dropdown con Portal approach para PC
  const dropdownToggle = document.getElementById('filter-by-tag');
  if (dropdownToggle) {
    setupDropdownPortal(dropdownToggle, $tagFilterDropdown);
  }

  // Eventos del historial de actividades
  $clearHistory?.addEventListener("click", clearHistory);
  $toggleHistory?.addEventListener("click", toggleHistoryPanel);

  // Eventos de estadísticas y gráficas
  $toggleStats.addEventListener("click", toggleStatsPanel);
  $refreshStats.addEventListener("click", refreshStats);

  // Eventos de exportar/importar datos
  $exportJson.addEventListener("click", exportToJSON);
  $exportCsv.addEventListener("click", exportToCSV);
  $importData.addEventListener("click", importData);
  $importFile.addEventListener("change", handleFileImport);

  // Atajo de teclado: Ctrl+Shift+R para resetear toda la aplicación
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === "r")) {
      e.preventDefault();
      resetAll();
    }
  });

  // ===== INICIALIZACIÓN DE LA APLICACIÓN =====
  // Limpiar datos existentes para empezar desde cero
  clearAllStorage();
  
  // Cargar datos desde localStorage (ahora vacío)
  state.tasks = loadTasks();
  state.availableTags = loadTags();
  state.activities = loadActivities();
  loadAuthState();

  // ===== EVENTOS DE NAVEGACIÓN =====
  // No hay navegación principal, solo autenticación

  // ===== EVENTOS DE AUTENTICACIÓN =====
  // Toggle password visibility
  const toggleLoginPassword = document.getElementById('toggleLoginPassword');
  const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
  
  if (toggleLoginPassword) {
    toggleLoginPassword.addEventListener('click', () => {
      const input = document.getElementById('loginPassword') as HTMLInputElement;
      const icon = toggleLoginPassword.querySelector('i');
      if (input && icon) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'bi bi-eye-slash';
        } else {
          input.type = 'password';
          icon.className = 'bi bi-eye';
        }
      }
    });
  }

  if (toggleRegisterPassword) {
    toggleRegisterPassword.addEventListener('click', () => {
      const input = document.getElementById('registerPassword') as HTMLInputElement;
      const icon = toggleRegisterPassword.querySelector('i');
      if (input && icon) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'bi bi-eye-slash';
        } else {
          input.type = 'password';
          icon.className = 'bi bi-eye';
        }
      }
    });
  }

  // Login form
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
      const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
      
      if (emailInput && passwordInput) {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
          showToast('Por favor, completa todos los campos', 'error');
          return;
        }
        
        if (loginUser(email, password)) {
          showToast('¡Bienvenido! Has iniciado sesión correctamente', 'success');
          // Cerrar modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
          if (modal) modal.hide();
          // Limpiar formulario
          emailInput.value = '';
          passwordInput.value = '';
        } else {
          showToast('Credenciales inválidas. Verifica tu email y contraseña', 'error');
        }
      }
    });
  }

  // Register form
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('registerName') as HTMLInputElement;
      const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
      const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
      const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement;
      const termsInput = document.getElementById('acceptTerms') as HTMLInputElement;
      
      if (nameInput && emailInput && passwordInput && confirmInput && termsInput) {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirm = confirmInput.value;
        
        // Validaciones
        if (!name || !email || !password || !confirm) {
          showToast('Por favor, completa todos los campos', 'error');
          return;
        }
        
        if (password !== confirm) {
          showToast('Las contraseñas no coinciden', 'error');
          return;
        }
        
        if (password.length < 8) {
          showToast('La contraseña debe tener al menos 8 caracteres', 'error');
          return;
        }
        
        if (!termsInput.checked) {
          showToast('Debes aceptar los términos y condiciones', 'error');
          return;
        }
        
        if (registerUser(name, email, password)) {
          showToast('¡Cuenta creada exitosamente! Bienvenido', 'success');
          // Cerrar modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
          if (modal) modal.hide();
          // Limpiar formulario
          nameInput.value = '';
          emailInput.value = '';
          passwordInput.value = '';
          confirmInput.value = '';
          termsInput.checked = false;
        } else {
          showToast('Error al crear la cuenta. Verifica los datos', 'error');
        }
      }
    });
  }

  // User dropdown actions
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) {
    const dropdown = userDropdown.nextElementSibling;
    if (dropdown) {
      dropdown.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action') || target.closest('a')?.getAttribute('data-action');
        
        if (action) {
          e.preventDefault();
          handleUserAction(action);
        }
      });
    }
  }

  function handleUserAction(action: string): void {
    switch (action) {
      case 'profile':
        showToast('Perfil de usuario - Próximamente', 'info');
        break;
      case 'settings':
        showToast('Configuración - Próximamente', 'info');
        break;
      case 'help':
        showToast('Centro de ayuda - Próximamente', 'info');
        break;
      case 'logout':
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
          logoutUser();
          showToast('Sesión cerrada correctamente', 'success');
        }
        break;
    }
  }

  // ===== EVENTOS DEL FOOTER =====
  // Footer simplificado para proyecto universitario
  // No requiere eventos adicionales


  // Renderizar la interfaz inicial
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

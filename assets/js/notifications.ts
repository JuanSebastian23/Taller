// ===== SISTEMA DE NOTIFICACIONES INTERNAS EN CAMPANITA =====
// Gestión completa de notificaciones que se muestran en el dropdown de la campanita
// Incluye recordatorios de tareas, notificaciones del sistema y alertas personalizadas

// Declarar dependencias globales
declare const showToast: any;
declare const showWarning: any;
declare const showError: any;

/**
 * Tipos de notificaciones disponibles
 */
type NotificationType = 'reminder' | 'task_completed' | 'system' | 'warning' | 'info';

/**
 * Interfaz para una notificación
 */
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  taskId?: string;  // ID de la tarea relacionada (opcional)
  actions?: NotificationAction[];  // Acciones disponibles
}

/**
 * Interfaz para acciones de notificación
 */
interface NotificationAction {
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
}

/**
 * Interfaz para recordatorios activos
 */
interface ActiveReminder {
  taskId: string;
  taskTitle: string;
  datetime: number;
  timeoutId: number;
}

/**
 * Manager principal para el sistema de notificaciones internas
 */
class InternalNotificationManager {
  private notifications: Notification[] = [];
  private activeReminders: Map<string, ActiveReminder> = new Map();
  private readonly STORAGE_KEY = 'taskmaster_notifications';
  private readonly MAX_NOTIFICATIONS = 50; // Máximo de notificaciones guardadas

  /**
   * Inicializa el sistema de notificaciones
   */
  initialize(): void {
    console.log('Inicializando sistema de notificaciones internas...');
    
    // Cargar notificaciones guardadas
    this.loadNotifications();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Actualizar UI inicial
    this.updateNotificationUI();
    
    console.log('Sistema de notificaciones internas inicializado ✨');
  }

  /**
   * Configura los event listeners
   */
  private setupEventListeners(): void {
    // Botón de limpiar todas las notificaciones
    const clearAllBtn = document.getElementById('clear-all-notifications');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllNotifications();
      });
    }

    // Click en el dropdown para marcar como leídas
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    if (notificationsDropdown) {
      notificationsDropdown.addEventListener('click', () => {
        // Marcar todas como leídas después de un pequeño delay
        setTimeout(() => {
          this.markAllAsRead();
        }, 500);
      });
    }
  }

  /**
   * Programa un recordatorio para una tarea
   */
  scheduleReminder(taskId: string, taskTitle: string, datetime: number): boolean {
    const now = Date.now();
    const delay = datetime - now;

    // Verificar que el recordatorio sea en el futuro
    if (delay <= 0) {
      showError(
        'Fecha inválida',
        'El recordatorio debe ser programado para una fecha futura'
      );
      return false;
    }

    // Cancelar recordatorio existente si lo hay
    this.cancelReminder(taskId);

    // Programar el recordatorio
    const timeoutId = window.setTimeout(() => {
      this.createReminderNotification(taskId, taskTitle);
      this.activeReminders.delete(taskId);
    }, delay);

    // Guardar en recordatorios activos
    this.activeReminders.set(taskId, {
      taskId,
      taskTitle,
      datetime,
      timeoutId
    });

    console.log(`Recordatorio programado para: ${new Date(datetime).toLocaleString()}`);
    showToast(
      `Recordatorio programado para ${new Date(datetime).toLocaleString()}`,
      'success'
    );

    return true;
  }

  /**
   * Cancela un recordatorio activo
   */
  cancelReminder(taskId: string): void {
    const reminder = this.activeReminders.get(taskId);
    if (reminder) {
      clearTimeout(reminder.timeoutId);
      this.activeReminders.delete(taskId);
      console.log(`Recordatorio cancelado para tarea: ${taskId}`);
    }
  }

  /**
   * Crea una notificación de recordatorio
   */
  private createReminderNotification(taskId: string, taskTitle: string): void {
    const notification: Notification = {
      id: this.generateId(),
      type: 'reminder',
      title: '🔔 Recordatorio de Tarea',
      message: `Es hora de: ${taskTitle}`,
      timestamp: Date.now(),
      read: false,
      taskId: taskId,
      actions: [
        {
          label: 'Ver tarea',
          action: 'view_task',
          style: 'primary'
        },
        {
          label: 'Posponer 10 min',
          action: 'snooze',
          style: 'secondary'
        }
      ]
    };

    this.addNotification(notification);

    // Hacer sonar la campanita
    this.animateBell();
  }

  /**
   * Agrega una nueva notificación
   */
  addNotification(notification: Notification): void {
    // Agregar al inicio del array
    this.notifications.unshift(notification);

    // Limitar el número de notificaciones
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }

    // Guardar y actualizar UI
    this.saveNotifications();
    this.updateNotificationUI();
  }

  /**
   * Crea una notificación del sistema
   */
  createSystemNotification(title: string, message: string, type: NotificationType = 'system'): void {
    const notification: Notification = {
      id: this.generateId(),
      type: type,
      title: title,
      message: message,
      timestamp: Date.now(),
      read: false
    };

    this.addNotification(notification);
  }

  /**
   * Crea una notificación de tarea completada
   */
  createTaskCompletedNotification(taskTitle: string): void {
    const notification: Notification = {
      id: this.generateId(),
      type: 'task_completed',
      title: '✅ Tarea Completada',
      message: `¡Felicidades! Has completado: ${taskTitle}`,
      timestamp: Date.now(),
      read: false
    };

    this.addNotification(notification);
  }

  /**
   * Actualiza la UI de notificaciones
   */
  private updateNotificationUI(): void {
    const notificationsList = document.getElementById('notifications-list');
    const notificationsBadge = document.getElementById('notifications-badge');
    const noNotificationsElement = document.getElementById('no-notifications');

    if (!notificationsList || !notificationsBadge) return;

    // Contar notificaciones no leídas
    const unreadCount = this.notifications.filter(n => !n.read).length;

    // Actualizar badge
    if (unreadCount > 0) {
      notificationsBadge.textContent = unreadCount.toString();
      notificationsBadge.classList.remove('d-none');
    } else {
      notificationsBadge.classList.add('d-none');
    }

    // Limpiar lista
    notificationsList.innerHTML = '';

    // Mostrar mensaje vacío si no hay notificaciones
    if (this.notifications.length === 0) {
      if (noNotificationsElement) {
        notificationsList.appendChild(noNotificationsElement);
      }
      return;
    }

    // Renderizar notificaciones
    this.notifications.forEach(notification => {
      const notificationElement = this.createNotificationElement(notification);
      notificationsList.appendChild(notificationElement);
    });
  }

  /**
   * Crea el elemento HTML de una notificación
   */
  private createNotificationElement(notification: Notification): HTMLElement {
    const div = document.createElement('div');
    div.className = `dropdown-item notification-item ${notification.read ? 'read' : 'unread'}`;
    div.setAttribute('data-notification-id', notification.id);

    const timeAgo = this.getTimeAgo(notification.timestamp);
    const typeIcon = this.getTypeIcon(notification.type);
    const typeColor = this.getTypeColor(notification.type);

    div.innerHTML = `
      <div class="d-flex align-items-start" style="width: 100%; overflow: hidden;">
        <div class="me-2 flex-shrink-0">
          <i class="bi ${typeIcon} ${typeColor}"></i>
        </div>
        <div class="flex-grow-1" style="min-width: 0; overflow: hidden;">
          <div class="fw-semibold small" style="word-break: break-word;">${this.truncateText(notification.title, 40)}</div>
          <div class="text-muted small mb-1" style="word-break: break-word;">${this.truncateText(notification.message, 60)}</div>
          <div class="text-muted small">${timeAgo}</div>
          ${this.createActionsHTML(notification)}
        </div>
        ${!notification.read ? '<div class="notification-dot bg-primary rounded-circle flex-shrink-0"></div>' : ''}
      </div>
    `;

    // Agregar event listeners para las acciones
    this.attachActionListeners(div, notification);

    return div;
  }

  /**
   * Crea el HTML de las acciones de una notificación
   */
  private createActionsHTML(notification: Notification): string {
    if (!notification.actions || notification.actions.length === 0) {
      return '';
    }

    const actionsHTML = notification.actions.map(action => 
      `<button class="btn btn-${action.style || 'secondary'} btn-sm me-1 mb-1" data-action="${action.action}" style="font-size: 0.65rem; padding: 0.2rem 0.4rem;">
        ${this.truncateText(action.label, 15)}
      </button>`
    ).join('');

    return `<div class="mt-2" style="display: flex; flex-wrap: wrap; gap: 0.25rem;">${actionsHTML}</div>`;
  }

  /**
   * Agrega event listeners a las acciones de una notificación
   */
  private attachActionListeners(element: HTMLElement, notification: Notification): void {
    const actionButtons = element.querySelectorAll('button[data-action]');
    
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (button as HTMLElement).getAttribute('data-action');
        this.handleNotificationAction(notification, action!);
      });
    });
  }

  /**
   * Maneja las acciones de notificaciones
   */
  private handleNotificationAction(notification: Notification, action: string): void {
    switch (action) {
      case 'view_task':
        if (notification.taskId) {
          this.focusTask(notification.taskId);
          this.removeNotification(notification.id);
        }
        break;

      case 'snooze':
        if (notification.taskId) {
          this.snoozeReminder(notification.taskId, notification.message.replace('Es hora de: ', ''), 10);
          this.removeNotification(notification.id);
        }
        break;

      default:
        console.log('Acción no reconocida:', action);
    }
  }

  /**
   * Enfoca una tarea específica
   */
  private focusTask(taskId: string): void {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Agregar efecto visual temporal
      taskElement.classList.add('task-highlighted');
      setTimeout(() => {
        taskElement.classList.remove('task-highlighted');
      }, 3000);
    }
  }

  /**
   * Pospone un recordatorio
   */
  snoozeReminder(taskId: string, taskTitle: string, minutes: number = 10): boolean {
    const snoozeTime = Date.now() + (minutes * 60 * 1000);
    showToast(`Recordatorio pospuesto ${minutes} minutos`, 'info');
    return this.scheduleReminder(taskId, taskTitle, snoozeTime);
  }

  /**
   * Remueve una notificación específica
   */
  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.updateNotificationUI();
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.updateNotificationUI();
  }

  /**
   * Limpia todas las notificaciones
   */
  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
    this.updateNotificationUI();
    showToast('Todas las notificaciones han sido eliminadas', 'info');
  }

  /**
   * Anima la campanita cuando hay una nueva notificación
   */
  private animateBell(): void {
    const bellIcon = document.querySelector('#notificationsDropdown i');
    if (bellIcon) {
      bellIcon.classList.add('notification-bell-shake');
      setTimeout(() => {
        bellIcon.classList.remove('notification-bell-shake');
      }, 1000);
    }
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return 'notif_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Obtiene el icono según el tipo de notificación
   */
  private getTypeIcon(type: NotificationType): string {
    const icons = {
      'reminder': 'bi-alarm',
      'task_completed': 'bi-check-circle',
      'system': 'bi-info-circle',
      'warning': 'bi-exclamation-triangle',
      'info': 'bi-info-circle'
    };
    return icons[type] || 'bi-bell';
  }

  /**
   * Obtiene el color según el tipo de notificación
   */
  private getTypeColor(type: NotificationType): string {
    const colors = {
      'reminder': 'text-warning',
      'task_completed': 'text-success',
      'system': 'text-info',
      'warning': 'text-danger',
      'info': 'text-info'
    };
    return colors[type] || 'text-secondary';
  }

  /**
   * Calcula el tiempo transcurrido desde una fecha
   */
  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  }

  /**
   * Trunca el texto a una longitud específica con elipsis
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Guarda las notificaciones en localStorage
   */
  private saveNotifications(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error al guardar notificaciones:', error);
    }
  }

  /**
   * Carga las notificaciones desde localStorage
   */
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      this.notifications = [];
    }
  }

  /**
   * Obtiene las notificaciones actuales
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Obtiene el número de notificaciones no leídas
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Obtiene recordatorios activos
   */
  getActiveReminders(): Array<{taskId: string, taskTitle: string, datetime: number}> {
    return Array.from(this.activeReminders.values()).map(reminder => ({
      taskId: reminder.taskId,
      taskTitle: reminder.taskTitle,
      datetime: reminder.datetime
    }));
  }

  /**
   * Verifica si una tarea tiene recordatorio activo
   */
  hasActiveReminder(taskId: string): boolean {
    return this.activeReminders.has(taskId);
  }

  /**
   * Limpia todos los recordatorios activos
   */
  clearAllReminders(): void {
    for (const reminder of this.activeReminders.values()) {
      clearTimeout(reminder.timeoutId);
    }
    this.activeReminders.clear();
    console.log('Todos los recordatorios han sido cancelados');
  }

  /**
   * Función de limpieza al cerrar la aplicación
   */
  cleanup(): void {
    this.clearAllReminders();
  }
}

// ===== INSTANCIA GLOBAL =====

const internalNotificationManager = new InternalNotificationManager();

// ===== FUNCIONES GLOBALES =====

/**
 * Funciones globales para fácil acceso desde cualquier parte de la aplicación
 */
(window as any).notificationManager = internalNotificationManager;

(window as any).scheduleTaskReminder = (taskId: string, taskTitle: string, datetime: number) => {
  return internalNotificationManager.scheduleReminder(taskId, taskTitle, datetime);
};

(window as any).cancelTaskReminder = (taskId: string) => {
  internalNotificationManager.cancelReminder(taskId);
};

(window as any).createSystemNotification = (title: string, message: string, type?: NotificationType) => {
  internalNotificationManager.createSystemNotification(title, message, type);
};

(window as any).createTaskCompletedNotification = (taskTitle: string) => {
  internalNotificationManager.createTaskCompletedNotification(taskTitle);
};

(window as any).getActiveReminders = () => {
  return internalNotificationManager.getActiveReminders();
};

// ===== INICIALIZACIÓN AUTOMÁTICA =====

/**
 * Inicializar el sistema cuando el DOM esté listo
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    internalNotificationManager.initialize();
  });
} else {
  internalNotificationManager.initialize();
}

// ===== CLEANUP AL CERRAR LA PÁGINA =====

window.addEventListener('beforeunload', () => {
  internalNotificationManager.cleanup();
});

console.log('Sistema de notificaciones internas cargado ✨');
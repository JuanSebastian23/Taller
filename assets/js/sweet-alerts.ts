// ===== SISTEMA DE ALERTAS Y NOTIFICACIONES CON SWEETALERT2 =====
// Utilitarios para mostrar alertas modernas y atractivas
// Reemplaza todas las alertas nativas de JavaScript

// Declarar SweetAlert2 como variable global
declare var Swal: any;

/**
 * Configuraciones de temas para SweetAlert2
 */
interface SweetAlertTheme {
  background: string;
  color: string;
  confirmButtonColor: string;
  cancelButtonColor: string;
  denyButtonColor: string;
}

/**
 * Tipos de notificaciones disponibles
 */
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'question';

/**
 * Clase principal para manejo de alertas con SweetAlert2
 */
class SweetAlertManager {
  private themes: Record<string, SweetAlertTheme> = {
    light: {
      background: '#ffffff',
      color: '#212529',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      denyButtonColor: '#dc3545'
    },
    dark: {
      background: '#212529',
      color: '#ffffff',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      denyButtonColor: '#dc3545'
    }
  };

  /**
   * Obtiene el tema actual basado en el atributo data-bs-theme
   */
  private getCurrentTheme(): SweetAlertTheme {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    return this.themes[currentTheme] || this.themes.light;
  }

  /**
   * Configuración base para SweetAlert2
   */
  private getBaseConfig(): any {
    const theme = this.getCurrentTheme();
    return {
      background: theme.background,
      color: theme.color,
      confirmButtonColor: theme.confirmButtonColor,
      cancelButtonColor: theme.cancelButtonColor,
      denyButtonColor: theme.denyButtonColor,
      showClass: {
        popup: 'animate__animated animate__fadeInDown animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp animate__faster'
      }
    };
  }

  /**
   * Muestra una notificación toast simple
   */
  showToast(message: string, type: NotificationType = 'info', duration: number = 3000): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: duration,
      timerProgressBar: true,
      didOpen: (toast: any) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
      ...this.getBaseConfig()
    });

    Toast.fire({
      icon: type,
      title: message
    });
  }

  /**
   * Muestra una alerta de éxito
   */
  showSuccess(title: string, message?: string): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonText: 'Entendido',
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra una alerta de error
   */
  showError(title: string, message?: string): Promise<any> {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: 'Entendido',
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra una alerta de advertencia
   */
  showWarning(title: string, message?: string): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonText: 'Entendido',
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra una alerta informativa
   */
  showInfo(title: string, message?: string): Promise<any> {
    return Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      confirmButtonText: 'Entendido',
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra una confirmación simple (Sí/No)
   */
  showConfirm(
    title: string, 
    message?: string, 
    confirmText: string = 'Sí', 
    cancelText: string = 'No'
  ): Promise<any> {
    return Swal.fire({
      icon: 'question',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra una confirmación de eliminación
   */
  showDeleteConfirm(
    title: string = '¿Eliminar elemento?', 
    message: string = 'Esta acción no se puede deshacer'
  ): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      reverseButtons: true,
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra una confirmación peligrosa (con doble confirmación)
   */
  showDangerousConfirm(
    title: string,
    message: string,
    warningText: string = 'Esta acción es irreversible'
  ): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      html: `
        <p>${message}</p>
        <div class="alert alert-danger mt-3" style="font-size: 0.9rem;">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>⚠️ ADVERTENCIA:</strong> ${warningText}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      reverseButtons: true,
      focusCancel: true,
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra un input simple
   */
  showInput(
    title: string,
    placeholder: string = '',
    defaultValue: string = '',
    inputType: string = 'text'
  ): Promise<any> {
    return Swal.fire({
      title: title,
      input: inputType as any,
      inputPlaceholder: placeholder,
      inputValue: defaultValue,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Este campo es requerido';
        }
      },
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra un selector con opciones
   */
  showSelect(
    title: string,
    options: Record<string, string>,
    defaultValue?: string
  ): Promise<any> {
    return Swal.fire({
      title: title,
      input: 'select',
      inputOptions: options,
      inputValue: defaultValue,
      showCancelButton: true,
      confirmButtonText: 'Seleccionar',
      cancelButtonText: 'Cancelar',
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra un loading con mensaje personalizable
   */
  showLoading(title: string = 'Cargando...', message?: string): void {
    Swal.fire({
      title: title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...this.getBaseConfig()
    });
  }

  /**
   * Cierra cualquier alerta activa
   */
  close(): void {
    Swal.close();
  }

  /**
   * Muestra estadísticas del usuario con formato personalizado
   */
  showUserStats(stats: any): Promise<any> {
    const productivity = stats.productivityScore || 0;
    const productivityColor = productivity >= 80 ? 'success' : productivity >= 50 ? 'warning' : 'danger';
    
    return Swal.fire({
      title: '📊 Tus Estadísticas',
      html: `
        <div class="row g-3 text-start">
          <div class="col-6">
            <div class="card border-primary">
              <div class="card-body text-center p-3">
                <i class="bi bi-check-circle text-primary fs-2"></i>
                <div class="h4 mt-2 mb-0">${stats.completedTasks || 0}</div>
                <small class="text-muted">Completadas</small>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-warning">
              <div class="card-body text-center p-3">
                <i class="bi bi-clock text-warning fs-2"></i>
                <div class="h4 mt-2 mb-0">${stats.activeTasks || 0}</div>
                <small class="text-muted">Activas</small>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-${productivityColor}">
              <div class="card-body text-center p-3">
                <i class="bi bi-trophy text-${productivityColor} fs-2"></i>
                <div class="h4 mt-2 mb-0">${productivity}%</div>
                <small class="text-muted">Productividad</small>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border-info">
              <div class="card-body text-center p-3">
                <i class="bi bi-fire text-info fs-2"></i>
                <div class="h4 mt-2 mb-0">${stats.streakDays || 0}</div>
                <small class="text-muted">Días seguidos</small>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-3 text-center">
          <small class="text-muted">
            Esta semana: ${stats.tasksCreatedThisWeek || 0} creadas, 
            ${stats.tasksCompletedThisWeek || 0} completadas
          </small>
        </div>
      `,
      width: '500px',
      confirmButtonText: 'Cerrar',
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra información detallada de una tarea
   */
  showTaskDetails(task: any): Promise<any> {
    const statusIcon = task.done ? 'bi-check-circle-fill text-success' : 'bi-clock text-warning';
    const statusText = task.done ? 'Completada' : 'Activa';
    const createdDate = new Date(task.createdAt).toLocaleString('es-ES');
    const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleString('es-ES') : 'No completada';
    
    const tagsHtml = task.tags && task.tags.length > 0 
      ? task.tags.map((tag: string) => `<span class="badge bg-info me-1">${tag}</span>`).join('')
      : '<span class="text-muted">Sin etiquetas</span>';

    // Información del recordatorio
    let reminderHtml = '<span class="text-muted">Sin recordatorio</span>';
    if (task.reminder) {
      const reminderDate = new Date(task.reminder.datetime);
      const now = new Date();
      const isPastDue = reminderDate < now && !task.done;
      
      const reminderClass = isPastDue ? 'text-danger' : 'text-info';
      const reminderIcon = isPastDue ? 'bi-alarm-fill' : 'bi-alarm';
      const statusText = isPastDue ? ' (Vencido)' : task.reminder.notified ? ' (Notificado)' : ' (Programado)';
      
      reminderHtml = `
        <div class="${reminderClass}">
          <i class="bi ${reminderIcon} me-2"></i>
          ${reminderDate.toLocaleString('es-ES')}${statusText}
        </div>
      `;
    }

    return Swal.fire({
      title: '📄 Detalles de la Tarea',
      html: `
        <div class="text-start">
          <div class="mb-3">
            <strong>Título:</strong>
            <div class="mt-1">${task.title}</div>
          </div>
          
          <div class="mb-3">
            <strong>Estado:</strong>
            <div class="mt-1">
              <i class="bi ${statusIcon} me-2"></i>${statusText}
            </div>
          </div>
          
          <div class="mb-3">
            <strong>ID:</strong>
            <div class="mt-1">
              <code class="text-muted">${task.id}</code>
            </div>
          </div>
          
          <div class="mb-3">
            <strong>Creada:</strong>
            <div class="mt-1">${createdDate}</div>
          </div>
          
          <div class="mb-3">
            <strong>Completada:</strong>
            <div class="mt-1">${completedDate}</div>
          </div>
          
          <div class="mb-3">
            <strong>Recordatorio:</strong>
            <div class="mt-1">${reminderHtml}</div>
          </div>
          
          <div class="mb-3">
            <strong>Etiquetas:</strong>
            <div class="mt-2">${tagsHtml}</div>
          </div>
        </div>
      `,
      width: '500px',
      confirmButtonText: 'Cerrar',
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra el bienvenida para nuevos usuarios
   */
  showWelcome(userName: string): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: `¡Bienvenido, ${userName}! 🎉`,
      html: `
        <div class="text-center">
          <p class="mb-3">Tu cuenta ha sido creada exitosamente.</p>
          <div class="alert alert-info">
            <i class="bi bi-lightbulb me-2"></i>
            <strong>Tip:</strong> Puedes personalizar tu perfil haciendo clic en el ícono de engranaje
          </div>
          <p class="text-muted small mb-0">¡Empieza a crear tus primeras tareas!</p>
        </div>
      `,
      confirmButtonText: '¡Empezar!',
      allowOutsideClick: false,
      ...this.getBaseConfig()
    });
  }

  /**
   * Muestra un modal de ayuda rápida
   */
  showQuickHelp(): Promise<any> {
    return Swal.fire({
      title: '💡 Ayuda Rápida',
      html: `
        <div class="text-start">
          <h6><i class="bi bi-plus-circle me-2"></i>Crear Tareas</h6>
          <p class="small mb-3">Escribe en el campo superior y presiona "Agregar" o Enter.</p>
          
          <h6><i class="bi bi-tags me-2"></i>Etiquetas</h6>
          <p class="small mb-3">Selecciona etiquetas antes de crear una tarea para organizarlas mejor.</p>
          
          <h6><i class="bi bi-search me-2"></i>Buscar</h6>
          <p class="small mb-3">Usa el campo de búsqueda para encontrar tareas específicas.</p>
          
          <h6><i class="bi bi-funnel me-2"></i>Filtros</h6>
          <p class="small mb-3">Filtra por estado (todas, activas, completadas) o por etiquetas.</p>
          
          <h6><i class="bi bi-person-circle me-2"></i>Perfil</h6>
          <p class="small mb-0">Accede a tu perfil desde el menú superior para ver estadísticas y preferencias.</p>
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Entendido',
      ...this.getBaseConfig()
    });
  }
}

// ===== INSTANCIA GLOBAL =====

const sweetAlert = new SweetAlertManager();

// ===== FUNCIONES GLOBALES DE CONVENIENCIA =====

/**
 * Funciones globales para fácil acceso desde cualquier parte de la aplicación
 */
(window as any).sweetAlert = sweetAlert;

// Funciones de conveniencia
(window as any).showToast = (message: string, type: NotificationType = 'info', duration: number = 3000) => {
  sweetAlert.showToast(message, type, duration);
};

(window as any).showSuccess = (title: string, message?: string) => {
  return sweetAlert.showSuccess(title, message);
};

(window as any).showError = (title: string, message?: string) => {
  return sweetAlert.showError(title, message);
};

(window as any).showWarning = (title: string, message?: string) => {
  return sweetAlert.showWarning(title, message);
};

(window as any).showInfo = (title: string, message?: string) => {
  return sweetAlert.showInfo(title, message);
};

(window as any).showConfirm = (title: string, message?: string, confirmText?: string, cancelText?: string) => {
  return sweetAlert.showConfirm(title, message, confirmText, cancelText);
};

(window as any).showDeleteConfirm = (title?: string, message?: string) => {
  return sweetAlert.showDeleteConfirm(title, message);
};

(window as any).showInput = (title: string, placeholder?: string, defaultValue?: string, inputType?: string) => {
  return sweetAlert.showInput(title, placeholder, defaultValue, inputType);
};

(window as any).showLoading = (title?: string, message?: string) => {
  sweetAlert.showLoading(title, message);
};

(window as any).closeAlert = () => {
  sweetAlert.close();
};

// ===== INICIALIZACIÓN =====

console.log('SweetAlert2 Manager inicializado ✨');

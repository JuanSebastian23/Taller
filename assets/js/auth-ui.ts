// ===== INTEGRACIÓN DEL SISTEMA DE AUTENTICACIÓN CON LA UI =====
// Manejo de eventos y actualización de la interfaz de usuario
// Integra el sistema de autenticación con los modales y formularios existentes

// Nota: Las funciones authService, displayValidationErrors, clearValidationErrors, initializeAuth
// están disponibles globalmente desde auth.ts que se carga primero

// Declarar tipos para funciones globales (evitando redeclaración)
declare var authService: any;
declare var initializeAuth: any;
declare var displayValidationErrors: any;
declare var clearValidationErrors: any;
declare var bootstrap: any;
declare var sweetAlert: any;
declare var showToast: any;
declare var showSuccess: any;
declare var showError: any;
declare var showConfirm: any;

// ===== TIPOS ESPECÍFICOS PARA LA UI =====

/**
 * Estados de los formularios de autenticación
 */
type FormState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Configuración de notificaciones
 */
interface NotificationConfig {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// ===== CLASE PRINCIPAL PARA MANEJO DE UI =====

/**
 * Clase que maneja toda la interacción entre el sistema de autenticación
 * y la interfaz de usuario
 */
class AuthUIManager {
  private loginForm: HTMLFormElement | null = null;
  private registerForm: HTMLFormElement | null = null;
  private loginModal: any = null;
  private registerModal: any = null;
  private currentFormState: FormState = 'idle';

  /**
   * Inicializa el manager de UI
   */
  initialize(): void {
    this.setupElements();
    this.setupEventListeners();
    this.updateAuthUI();
    
    // Inicializar el sistema de autenticación
    initializeAuth();
    
    console.log('Sistema de autenticación UI inicializado');
  }

  /**
   * Configura las referencias a elementos del DOM
   */
  private setupElements(): void {
    this.loginForm = document.getElementById('loginForm') as HTMLFormElement;
    this.registerForm = document.getElementById('registerForm') as HTMLFormElement;

    // Inicializar modales de Bootstrap si están disponibles
    if (typeof (window as any).bootstrap !== 'undefined') {
      const loginModalEl = document.getElementById('loginModal');
      const registerModalEl = document.getElementById('registerModal');

      if (loginModalEl) {
        this.loginModal = new (window as any).bootstrap.Modal(loginModalEl);
      }
      if (registerModalEl) {
        this.registerModal = new (window as any).bootstrap.Modal(registerModalEl);
      }
    }
  }

  /**
   * Configura todos los event listeners
   */
  private setupEventListeners(): void {
    this.setupLoginForm();
    this.setupRegisterForm();
    this.setupPasswordToggles();
    this.setupUserDropdown();
    this.setupModalEvents();
  }

  /**
   * Configura el formulario de login
   */
  private setupLoginForm(): void {
    const loginBtn = document.getElementById('loginBtn');
    
    if (loginBtn && this.loginForm) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogin();
      });

      // Permitir envío con Enter
      this.loginForm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleLogin();
        }
      });
    }
  }

  /**
   * Configura el formulario de registro
   */
  private setupRegisterForm(): void {
    const registerBtn = document.getElementById('registerBtn');
    
    if (registerBtn && this.registerForm) {
      registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleRegister();
      });

      // Permitir envío con Enter
      this.registerForm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleRegister();
        }
      });

      // Validación en tiempo real de contraseñas
      this.setupPasswordValidation();
    }
  }

  /**
   * Configura la validación en tiempo real de contraseñas
   */
  private setupPasswordValidation(): void {
    const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
    const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement;
    
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.updatePasswordStrength(passwordInput.value);
      });
    }

    if (confirmInput && passwordInput) {
      confirmInput.addEventListener('input', () => {
        this.validatePasswordMatch(passwordInput.value, confirmInput.value);
      });
    }
  }

  /**
   * Actualiza el indicador visual de fortaleza de contraseña
   */
  private updatePasswordStrength(password: string): void {
    const strength = authService.getPasswordStrength(password);
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (strengthIndicator) {
      const strengthConfig = {
        'weak': { text: 'Débil', class: 'text-danger', width: '25%' },
        'medium': { text: 'Media', class: 'text-warning', width: '50%' },
        'strong': { text: 'Fuerte', class: 'text-info', width: '75%' },
        'very-strong': { text: 'Muy Fuerte', class: 'text-success', width: '100%' }
      };

      const config = strengthConfig[strength];
      strengthIndicator.innerHTML = `
        <div class="mt-2">
          <div class="d-flex justify-content-between small">
            <span>Fortaleza de contraseña:</span>
            <span class="${config.class}">${config.text}</span>
          </div>
          <div class="progress mt-1" style="height: 4px;">
            <div class="progress-bar ${config.class.replace('text-', 'bg-')}" 
                 style="width: ${config.width}"></div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Valida que las contraseñas coincidan
   */
  private validatePasswordMatch(password: string, confirmPassword: string): void {
    const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement;
    
    if (confirmInput && confirmPassword) {
      if (password !== confirmPassword) {
        confirmInput.setCustomValidity('Las contraseñas no coinciden');
        confirmInput.classList.add('is-invalid');
      } else {
        confirmInput.setCustomValidity('');
        confirmInput.classList.remove('is-invalid');
      }
    }
  }

  /**
   * Configura los toggles para mostrar/ocultar contraseñas
   */
  private setupPasswordToggles(): void {
    const toggles = [
      { toggleId: 'toggleLoginPassword', inputId: 'loginPassword' },
      { toggleId: 'toggleRegisterPassword', inputId: 'registerPassword' }
    ];

    toggles.forEach(({ toggleId, inputId }) => {
      const toggle = document.getElementById(toggleId);
      const input = document.getElementById(inputId) as HTMLInputElement;
      
      if (toggle && input) {
        toggle.addEventListener('click', () => {
          const icon = toggle.querySelector('i');
          if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.className = 'bi bi-eye-slash';
          } else {
            input.type = 'password';
            if (icon) icon.className = 'bi bi-eye';
          }
        });
      }
    });
  }

  /**
   * Configura el dropdown del usuario autenticado
   */
  private setupUserDropdown(): void {
    const userDropdown = document.getElementById('userDropdown');
    
    if (userDropdown) {
      const dropdownMenu = userDropdown.parentElement?.querySelector('.dropdown-menu');
      
      if (dropdownMenu) {
        dropdownMenu.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          const action = target.getAttribute('data-action') || 
                        target.closest('a')?.getAttribute('data-action');
          
          if (action) {
            e.preventDefault();
            this.handleUserAction(action);
          }
        });
      }
    }
  }

  /**
   * Configura eventos de los modales
   */
  private setupModalEvents(): void {
    // Limpiar formularios cuando se abren los modales
    const loginModalEl = document.getElementById('loginModal');
    const registerModalEl = document.getElementById('registerModal');

    if (loginModalEl) {
      loginModalEl.addEventListener('shown.bs.modal', () => {
        this.clearLoginForm();
        const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
        if (emailInput) emailInput.focus();
      });
    }

    if (registerModalEl) {
      registerModalEl.addEventListener('shown.bs.modal', () => {
        this.clearRegisterForm();
        const nameInput = document.getElementById('registerName') as HTMLInputElement;
        if (nameInput) nameInput.focus();
      });
    }
  }

  /**
   * Maneja el proceso de login
   */
  private async handleLogin(): Promise<void> {
    if (this.currentFormState === 'loading') return;

    const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
    const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
    const rememberInput = document.getElementById('rememberMe') as HTMLInputElement;

    if (!emailInput || !passwordInput) {
      this.showNotification({ message: 'Error en el formulario', type: 'error' });
      return;
    }

    // Limpiar errores previos
    if (this.loginForm) {
      clearValidationErrors(this.loginForm);
    }

    const credentials = {
      email: emailInput.value.trim(),
      password: passwordInput.value,
      rememberMe: rememberInput?.checked || false
    };

    this.setFormState('loading');
    this.updateLoginButton(true);

    try {
      const result = await authService.login(credentials);

      if (result.success) {
        this.setFormState('success');
        showToast(result.message, 'success', 3000);
        
        // Cerrar modal y actualizar UI
        if (this.loginModal) {
          this.loginModal.hide();
        }
        this.updateAuthUI();
        this.clearLoginForm();

      } else {
        this.setFormState('error');
        
        if (result.errors && this.loginForm) {
          displayValidationErrors(result.errors, this.loginForm);
        }
        
        showError('Error de inicio de sesión', result.message);
      }

    } catch (error) {
      this.setFormState('error');
      console.error('Error en login:', error);
      showError('Error inesperado', 'Por favor inténtalo nuevamente.');
    } finally {
      this.updateLoginButton(false);
    }
  }

  /**
   * Maneja el proceso de registro
   */
  private async handleRegister(): Promise<void> {
    if (this.currentFormState === 'loading') return;

    const nameInput = document.getElementById('registerName') as HTMLInputElement;
    const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
    const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
    const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement;
    const termsInput = document.getElementById('acceptTerms') as HTMLInputElement;

    if (!nameInput || !emailInput || !passwordInput || !confirmInput || !termsInput) {
      this.showNotification({ message: 'Error en el formulario', type: 'error' });
      return;
    }

    // Limpiar errores previos
    if (this.registerForm) {
      clearValidationErrors(this.registerForm);
    }

    const registerData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      confirmPassword: confirmInput.value,
      acceptTerms: termsInput.checked
    };

    this.setFormState('loading');
    this.updateRegisterButton(true);

    try {
      const result = await authService.register(registerData);

      if (result.success) {
        this.setFormState('success');
        
        // Mostrar bienvenida especial para nuevos usuarios
        sweetAlert.showWelcome(registerData.name).then(() => {
          // Cerrar modal después de la bienvenida
          if (this.registerModal) {
            this.registerModal.hide();
          }
        });
        
        // Crear notificación de bienvenida en la campanita
        setTimeout(() => {
          (window as any).createSystemNotification?.(
            'Bienvenido a TaskMaster Pro',
            `¡Hola ${registerData.name}! Tu cuenta ha sido creada exitosamente. Empieza creando tu primera tarea.`,
            'info'
          );
        }, 3000);
        
        this.updateAuthUI();
        this.clearRegisterForm();

      } else {
        this.setFormState('error');
        
        if (result.errors && this.registerForm) {
          displayValidationErrors(result.errors, this.registerForm);
        }
        
        showError('Error de registro', result.message);
      }

    } catch (error) {
      this.setFormState('error');
      console.error('Error en registro:', error);
      showError('Error inesperado', 'Por favor inténtalo nuevamente.');
    } finally {
      this.updateRegisterButton(false);
    }
  }

  /**
   * Maneja las acciones del dropdown del usuario
   */
  private handleUserAction(action: string): void {
    switch (action) {
      case 'profile':
        // El perfil ahora se maneja con el modal en profile-ui.ts
        // No necesitamos hacer nada aquí ya que el modal se abre automáticamente
        break;
        
      case 'logout':
        this.handleLogout();
        break;
        
      default:
        // Para cualquier acción no reconocida, no hacer nada
        console.log('Acción no reconocida:', action);
        break;
    }
  }

  /**
   * Maneja el proceso de logout
   */
  private handleLogout(): void {
    showConfirm(
      '¿Cerrar sesión?',
      '¿Estás seguro de que quieres cerrar sesión?',
      'Sí, cerrar sesión',
      'Cancelar'
    ).then((confirmed: any) => {
      if (confirmed.isConfirmed) {
        const result = authService.logout();
        
        if (result.success) {
          showToast(result.message, 'success');
          this.updateAuthUI();
        } else {
          showError('Error', result.message);
        }
      }
    });
  }

  /**
   * Actualiza la interfaz según el estado de autenticación
   */
  private updateAuthUI(): void {
    const guestSection = document.getElementById('auth-guest');
    const userSection = document.getElementById('auth-user');
    const userName = document.getElementById('user-name');
    
    if (!guestSection || !userSection || !userName) return;
    
    const currentUser = authService.getCurrentUser();
    
    if (currentUser) {
      guestSection.classList.add('d-none');
      userSection.classList.remove('d-none');
      userName.textContent = currentUser.name;
    } else {
      guestSection.classList.remove('d-none');
      userSection.classList.add('d-none');
    }
  }

  /**
   * Actualiza el estado del botón de login
   */
  private updateLoginButton(loading: boolean): void {
    const loginBtn = document.getElementById('loginBtn');
    
    if (loginBtn) {
      if (loading) {
        loginBtn.innerHTML = `
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
          Iniciando sesión...
        `;
        loginBtn.setAttribute('disabled', 'true');
      } else {
        loginBtn.innerHTML = `
          <i class="bi bi-box-arrow-in-right me-1"></i>Iniciar Sesión
        `;
        loginBtn.removeAttribute('disabled');
      }
    }
  }

  /**
   * Actualiza el estado del botón de registro
   */
  private updateRegisterButton(loading: boolean): void {
    const registerBtn = document.getElementById('registerBtn');
    
    if (registerBtn) {
      if (loading) {
        registerBtn.innerHTML = `
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
          Creando cuenta...
        `;
        registerBtn.setAttribute('disabled', 'true');
      } else {
        registerBtn.innerHTML = `
          <i class="bi bi-person-plus me-1"></i>Crear Cuenta
        `;
        registerBtn.removeAttribute('disabled');
      }
    }
  }

  /**
   * Limpia el formulario de login
   */
  private clearLoginForm(): void {
    if (this.loginForm) {
      this.loginForm.reset();
      clearValidationErrors(this.loginForm);
    }
  }

  /**
   * Limpia el formulario de registro
   */
  private clearRegisterForm(): void {
    if (this.registerForm) {
      this.registerForm.reset();
      clearValidationErrors(this.registerForm);
      
      // Limpiar indicador de fortaleza de contraseña
      const strengthIndicator = document.getElementById('passwordStrength');
      if (strengthIndicator) {
        strengthIndicator.innerHTML = '';
      }
    }
  }

  /**
   * Establece el estado del formulario
   */
  private setFormState(state: FormState): void {
    this.currentFormState = state;
  }

  // Funciones de notificación removidas - ahora se usa SweetAlert2

  /**
   * Obtiene estadísticas del sistema de autenticación
   */
  getAuthStats(): void {
    const stats = authService.getAuthStats();
    console.log('Estadísticas de autenticación:', stats);
    
    showToast(`Sistema: ${stats.totalUsers} usuarios registrados, ${stats.activeUsers} activos`, 'info', 3000);
  }

  /**
   * Función de utilidad para desarrollo - limpia todos los datos
   */
  clearAllAuthData(): void {
    sweetAlert.showDangerousConfirm(
      'Eliminar todos los datos',
      'Esto eliminará TODOS los usuarios y datos de autenticación.',
      'Esta acción NO SE PUEDE DESHACER'
    ).then((result: any) => {
      if (result.isConfirmed) {
        authService.clearAllData();
        this.updateAuthUI();
        showToast('Todos los datos de autenticación han sido eliminados', 'warning', 3000);
      }
    });
  }
}

// ===== INSTANCIA GLOBAL Y INICIALIZACIÓN =====

/**
 * Instancia global del manager de UI
 */
const authUIManager = new AuthUIManager();

/**
 * Función principal de inicialización que debe llamarse cuando el DOM esté listo
 */
function initializeAuthUI(): void {
  authUIManager.initialize();
}

/**
 * Auto-inicialización cuando el DOM esté listo
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuthUI);
} else {
  initializeAuthUI();
}

// ===== FUNCIONES GLOBALES PARA DESARROLLO/DEBUG =====

// Exportar funciones útiles para debugging en consola
(window as any).authDebug = {
  getStats: () => authUIManager.getAuthStats(),
  clearAllData: () => authUIManager.clearAllAuthData(),
  getCurrentUser: () => authService.getCurrentUser(),
  isAuthenticated: () => authService.isAuthenticated()
};

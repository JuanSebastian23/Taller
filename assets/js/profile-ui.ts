// ===== INTERFAZ DE USUARIO PARA PERFIL DE USUARIO =====
// Manejo completo de la UI del perfil de usuario con todas las funcionalidades

// Declarar variables globales disponibles
declare const userProfileService: any;
declare const authService: any;
declare const bootstrap: any;
declare const sweetAlert: any;
declare const showToast: any;
declare const showSuccess: any;
declare const showError: any;
declare const showWarning: any;
declare const showConfirm: any;
declare const showDeleteConfirm: any;

/**
 * Manager principal para la interfaz del perfil de usuario
 */
class ProfileUIManager {
  private profileModal: any = null;
  private currentProfile: any = null;
  private isLoading: boolean = false;

  /**
   * Inicializa el manager del perfil
   */
  initialize(): void {
    this.setupElements();
    this.setupEventListeners();
    console.log('Profile UI Manager inicializado');
  }

  /**
   * Configura elementos del DOM
   */
  private setupElements(): void {
    const profileModalEl = document.getElementById('profileModal');
    if (profileModalEl && typeof bootstrap !== 'undefined') {
      this.profileModal = new bootstrap.Modal(profileModalEl);
    }
  }

  /**
   * Configura todos los event listeners
   */
  private setupEventListeners(): void {
    this.setupModalEvents();
    this.setupFormEvents();
    this.setupAvatarEvents();
    this.setupPreferencesEvents();
  }

  /**
   * Configura eventos del modal
   */
  private setupModalEvents(): void {
    const profileModalEl = document.getElementById('profileModal');
    
    if (profileModalEl) {
      profileModalEl.addEventListener('shown.bs.modal', () => {
        this.loadProfileData();
      });

      profileModalEl.addEventListener('hidden.bs.modal', () => {
        this.clearFormErrors();
      });
    }
  }

  /**
   * Configura eventos de formularios
   */
  private setupFormEvents(): void {
    const saveBtn = document.getElementById('saveProfileBtn');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.handleSaveProfile();
      });
    }

    // Validación en tiempo real del nombre
    const nameInput = document.getElementById('profileName') as HTMLInputElement;
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        this.validateNameField(nameInput.value);
      });
    }

    // Validación del teléfono
    const phoneInput = document.getElementById('profilePhone') as HTMLInputElement;
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        this.validatePhoneField(phoneInput.value);
      });
    }

    // Validación del sitio web
    const websiteInput = document.getElementById('profileWebsite') as HTMLInputElement;
    if (websiteInput) {
      websiteInput.addEventListener('input', () => {
        this.validateWebsiteField(websiteInput.value);
      });
    }
  }

  /**
   * Configura eventos del avatar
   */
  private setupAvatarEvents(): void {
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarUpload = document.getElementById('avatarUpload') as HTMLInputElement;

    if (changeAvatarBtn && avatarUpload) {
      changeAvatarBtn.addEventListener('click', () => {
        avatarUpload.click();
      });

      avatarUpload.addEventListener('change', (e) => {
        this.handleAvatarUpload(e);
      });
    }
  }

  /**
   * Configura eventos de preferencias
   */
  private setupPreferencesEvents(): void {
    // Cambio de tema
    const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        this.handleThemeChange(themeSelect.value as any);
      });
    }

    // Exportar perfil
    const exportBtn = document.getElementById('exportProfileBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportProfile();
      });
    }

    // Limpiar datos
    const clearBtn = document.getElementById('clearProfileDataBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearProfileData();
      });
    }
  }

  /**
   * Carga los datos del perfil en el modal
   */
  private async loadProfileData(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingState(true);

    try {
      this.currentProfile = userProfileService.getCurrentUserProfile();
      
      if (!this.currentProfile) {
        showError('Error al cargar el perfil', 'No se encontraron datos del usuario');
        return;
      }

      this.populateProfileForm();
      this.populateStatistics();
      this.populatePreferences();
      this.updateAvatar();

    } catch (error) {
      console.error('Error al cargar perfil:', error);
      showError('Error al cargar perfil', 'No se pudieron cargar los datos del perfil');
    } finally {
      this.isLoading = false;
      this.showLoadingState(false);
    }
  }

  /**
   * Rellena el formulario con datos del perfil
   */
  private populateProfileForm(): void {
    if (!this.currentProfile) return;

    const fields = [
      { id: 'profileName', value: this.currentProfile.name },
      { id: 'profileEmail', value: this.currentProfile.email },
      { id: 'profilePhone', value: this.currentProfile.phone || '' },
      { id: 'profileLocation', value: this.currentProfile.location || '' },
      { id: 'profileWebsite', value: this.currentProfile.website || '' },
      { id: 'profileBirthDate', value: this.currentProfile.birthDate || '' },
      { id: 'profileBio', value: this.currentProfile.bio || '' }
    ];

    fields.forEach(field => {
      const element = document.getElementById(field.id) as HTMLInputElement | HTMLTextAreaElement;
      if (element) {
        element.value = field.value;
      }
    });
  }

  /**
   * Rellena las estadísticas
   */
  private populateStatistics(): void {
    if (!this.currentProfile) return;

    const stats = userProfileService.getDetailedStatistics();
    if (!stats) return;

    const statElements = [
      { id: 'stat-completed', value: stats.completedTasks },
      { id: 'stat-active', value: stats.activeTasks },
      { id: 'stat-productivity', value: stats.productivityScore },
      { id: 'stat-streak', value: stats.streakDays },
      { id: 'week-created', value: stats.tasksCreatedThisWeek },
      { id: 'week-completed', value: stats.tasksCompletedThisWeek },
      { id: 'login-count', value: stats.loginCount }
    ];

    statElements.forEach(stat => {
      const element = document.getElementById(stat.id);
      if (element) {
        element.textContent = stat.value.toString();
      }
    });

    // Fechas especiales
    const memberSince = document.getElementById('member-since');
    if (memberSince) {
      memberSince.textContent = new Date(this.currentProfile.createdAt).toLocaleDateString('es-ES');
    }

    const lastLogin = document.getElementById('last-login');
    if (lastLogin && this.currentProfile.lastLoginAt) {
      lastLogin.textContent = new Date(this.currentProfile.lastLoginAt).toLocaleDateString('es-ES');
    }
  }

  /**
   * Rellena las preferencias
   */
  private populatePreferences(): void {
    if (!this.currentProfile || !this.currentProfile.preferences) return;

    const prefs = this.currentProfile.preferences;

    // Switches de preferencias
    const notificationsSwitch = document.getElementById('notificationsSwitch') as HTMLInputElement;
    if (notificationsSwitch) {
      notificationsSwitch.checked = prefs.notifications !== false;
    }

    const rememberSwitch = document.getElementById('rememberSessionSwitch') as HTMLInputElement;
    if (rememberSwitch) {
      rememberSwitch.checked = prefs.rememberSession === true;
    }
  }

  /**
   * Actualiza el avatar
   */
  private updateAvatar(): void {
    if (!this.currentProfile) return;

    const avatarElement = document.getElementById('userAvatar');
    if (!avatarElement) return;

    if (this.currentProfile.avatar && this.currentProfile.avatar.startsWith('data:')) {
      // Avatar personalizado
      avatarElement.innerHTML = `<img src="${this.currentProfile.avatar}" alt="Avatar" class="w-100 h-100 rounded-circle" style="object-fit: cover;">`;
    } else {
      // Avatar con iniciales
      const initials = this.generateInitials(this.currentProfile.name);
      const colors = this.generateAvatarColors(this.currentProfile.name);
      
      avatarElement.style.backgroundColor = colors.bg;
      avatarElement.style.color = colors.text;
      avatarElement.textContent = initials;
    }
  }

  /**
   * Maneja el guardado del perfil
   */
  private async handleSaveProfile(): Promise<void> {
    if (this.isLoading) return;

    this.clearFormErrors();
    this.setButtonLoading('saveProfileBtn', true);

    try {
      const formData = this.collectFormData();
      const preferencesData = this.collectPreferencesData();

      // Actualizar perfil
      const profileResult = await userProfileService.updateProfile(formData);
      
      if (!profileResult.success) {
        if (profileResult.errors) {
          this.displayFormErrors(profileResult.errors);
        }
        showError('Error al actualizar perfil', profileResult.message);
        return;
      }

      // Actualizar preferencias
      const prefsResult = await userProfileService.updatePreferences(preferencesData);
      
      if (!prefsResult.success) {
        showError('Error al actualizar preferencias', prefsResult.message);
        return;
      }

      // Éxito
      showSuccess('¡Perfil actualizado!', 'Tus cambios han sido guardados correctamente.');
      
      // Actualizar nombre en la UI principal si cambió
      if (formData.name) {
        this.updateMainUIUserName(formData.name);
      }

      // Cerrar modal después de un momento
      setTimeout(() => {
        if (this.profileModal) {
          this.profileModal.hide();
        }
      }, 1500);

    } catch (error) {
      console.error('Error al guardar perfil:', error);
      showError('Error inesperado', 'No se pudo guardar el perfil. Inténtalo nuevamente.');
    } finally {
      this.setButtonLoading('saveProfileBtn', false);
    }
  }

  /**
   * Maneja la subida de avatar
   */
  private handleAvatarUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showError('Archivo inválido', 'Por favor selecciona una imagen válida (JPG, PNG, etc.)');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('Archivo muy grande', 'La imagen debe ser menor a 2MB. Por favor elige una imagen más pequeña.');
      return;
    }

    // Crear FileReader para convertir a base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      
      try {
        const avatarResult = await userProfileService.updateAvatar(result, 'upload');
        
        if (avatarResult.success) {
          showToast('Avatar actualizado correctamente', 'success');
          this.updateAvatar();
        } else {
          showError('Error al actualizar avatar', avatarResult.message);
        }
      } catch (error) {
        console.error('Error al actualizar avatar:', error);
        showError('Error inesperado', 'No se pudo actualizar el avatar');
      }
    };

    reader.readAsDataURL(file);
    input.value = ''; // Limpiar input
  }

  // Función de cambio de tema removida - ya no se gestiona desde preferencias

  /**
   * Exporta el perfil del usuario
   */
  private exportProfile(): void {
    try {
      const profile = userProfileService.getCurrentUserProfile();
      if (!profile) {
        showError('Error de exportación', 'No hay datos de perfil para exportar');
        return;
      }

      const exportData = {
        profile: profile,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `perfil-${profile.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      showSuccess('Perfil exportado', 'Tu perfil ha sido descargado exitosamente');

    } catch (error) {
      console.error('Error al exportar perfil:', error);
      showError('Error de exportación', 'No se pudo exportar el perfil');
    }
  }

  /**
   * Limpia todos los datos del perfil
   */
  private clearProfileData(): void {
    sweetAlert.showDangerousConfirm(
      'Eliminar datos del perfil',
      'Esto eliminará TODOS los datos de tu perfil.',
      'Se mantendrán solo los datos básicos de la cuenta'
    ).then((result: any) => {
      if (result.isConfirmed) {
        userProfileService.clearAllProfileData();
        showWarning('Datos eliminados', 'Los datos del perfil han sido eliminados');
        
        // Recargar datos
        setTimeout(() => {
          this.loadProfileData();
        }, 1000);
      }
    });
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Recolecta datos del formulario
   */
  private collectFormData(): any {
    return {
      name: (document.getElementById('profileName') as HTMLInputElement)?.value.trim(),
      phone: (document.getElementById('profilePhone') as HTMLInputElement)?.value.trim(),
      location: (document.getElementById('profileLocation') as HTMLInputElement)?.value.trim(),
      website: (document.getElementById('profileWebsite') as HTMLInputElement)?.value.trim(),
      birthDate: (document.getElementById('profileBirthDate') as HTMLInputElement)?.value,
      bio: (document.getElementById('profileBio') as HTMLTextAreaElement)?.value.trim()
    };
  }

  /**
   * Recolecta datos de preferencias
   */
  private collectPreferencesData(): any {
    return {
      notifications: (document.getElementById('notificationsSwitch') as HTMLInputElement)?.checked,
      rememberSession: (document.getElementById('rememberSessionSwitch') as HTMLInputElement)?.checked
    };
  }

  /**
   * Genera iniciales del nombre
   */
  private generateInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2) || 'U';
  }

  /**
   * Genera colores para el avatar
   */
  private generateAvatarColors(name: string): { bg: string; text: string } {
    const colors = [
      { bg: '#e74c3c', text: '#ffffff' },
      { bg: '#3498db', text: '#ffffff' },
      { bg: '#2ecc71', text: '#ffffff' },
      { bg: '#f39c12', text: '#ffffff' },
      { bg: '#9b59b6', text: '#ffffff' },
      { bg: '#1abc9c', text: '#ffffff' },
      { bg: '#e67e22', text: '#ffffff' }
    ];
    
    const index = name.length % colors.length;
    return colors[index];
  }

  /**
   * Valida el campo nombre
   */
  private validateNameField(name: string): boolean {
    const nameInput = document.getElementById('profileName') as HTMLInputElement;
    
    if (!name.trim()) {
      this.setFieldError(nameInput, 'El nombre es requerido');
      return false;
    }
    
    if (name.trim().length < 2) {
      this.setFieldError(nameInput, 'El nombre debe tener al menos 2 caracteres');
      return false;
    }
    
    this.clearFieldError(nameInput);
    return true;
  }

  /**
   * Valida el campo teléfono
   */
  private validatePhoneField(phone: string): boolean {
    const phoneInput = document.getElementById('profilePhone') as HTMLInputElement;
    
    if (phone && !/^[\d\s\+\-\(\)]+$/.test(phone)) {
      this.setFieldError(phoneInput, 'Formato de teléfono inválido');
      return false;
    }
    
    this.clearFieldError(phoneInput);
    return true;
  }

  /**
   * Valida el campo sitio web
   */
  private validateWebsiteField(website: string): boolean {
    const websiteInput = document.getElementById('profileWebsite') as HTMLInputElement;
    
    if (website.trim()) {
      try {
        new URL(website);
        this.clearFieldError(websiteInput);
        return true;
      } catch {
        this.setFieldError(websiteInput, 'URL inválida');
        return false;
      }
    }
    
    this.clearFieldError(websiteInput);
    return true;
  }

  /**
   * Establece error en un campo
   */
  private setFieldError(field: HTMLInputElement, message: string): void {
    field.classList.add('is-invalid');
    
    // Remover error anterior
    const existingError = field.parentNode?.querySelector('.invalid-feedback');
    if (existingError) {
      existingError.remove();
    }
    
    // Agregar nuevo error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    field.parentNode?.appendChild(errorDiv);
  }

  /**
   * Limpia error de un campo
   */
  private clearFieldError(field: HTMLInputElement): void {
    field.classList.remove('is-invalid');
    const errorDiv = field.parentNode?.querySelector('.invalid-feedback');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  /**
   * Muestra errores del formulario
   */
  private displayFormErrors(errors: any[]): void {
    errors.forEach(error => {
      const field = document.getElementById(`profile${error.field.charAt(0).toUpperCase() + error.field.slice(1)}`) as HTMLInputElement;
      if (field) {
        this.setFieldError(field, error.message);
      }
    });
  }

  /**
   * Limpia todos los errores del formulario
   */
  private clearFormErrors(): void {
    const invalidFields = document.querySelectorAll('#profileModal .is-invalid');
    invalidFields.forEach(field => {
      this.clearFieldError(field as HTMLInputElement);
    });
  }

  /**
   * Muestra/oculta estado de carga
   */
  private showLoadingState(loading: boolean): void {
    const modal = document.getElementById('profileModal');
    if (!modal) return;

    if (loading) {
      modal.classList.add('loading');
      // Agregar overlay de carga si no existe
      if (!modal.querySelector('.loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        overlay.style.zIndex = '1050';
        overlay.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
        modal.appendChild(overlay);
      }
    } else {
      modal.classList.remove('loading');
      const overlay = modal.querySelector('.loading-overlay');
      if (overlay) {
        overlay.remove();
      }
    }
  }

  /**
   * Establece estado de carga en botón
   */
  private setButtonLoading(buttonId: string, loading: boolean): void {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
      button.setAttribute('disabled', 'true');
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    } else {
      button.removeAttribute('disabled');
      button.innerHTML = '<i class="bi bi-check-lg me-1"></i>Guardar Cambios';
    }
  }

  /**
   * Actualiza el nombre de usuario en la UI principal
   */
  private updateMainUIUserName(name: string): void {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = name;
    }
  }

  // Funciones de notificación removidas - ahora se usa SweetAlert2
}

// ===== INSTANCIA GLOBAL =====

const profileUIManager = new ProfileUIManager();

// ===== INICIALIZACIÓN =====

function initializeProfileUI(): void {
  profileUIManager.initialize();
}

// Auto-inicialización
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProfileUI);
} else {
  initializeProfileUI();
}

// ===== EXPOSICIÓN GLOBAL =====

(window as any).profileUIManager = profileUIManager;

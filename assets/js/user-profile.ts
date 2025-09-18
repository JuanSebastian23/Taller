// ===== SISTEMA DE PERFIL DE USUARIO =====
// Gestión completa del perfil de usuario con almacenamiento persistente
// Incluye edición de datos, preferencias y estadísticas personales

// ===== INTERFACES ESPECÍFICAS DEL PERFIL =====

/**
 * Datos extendidos del perfil de usuario
 */
interface UserProfile {
  readonly id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  birthDate?: string;
  readonly role: UserRole;
  readonly createdAt: number;
  readonly lastLoginAt?: number;
  readonly isActive: boolean;
  preferences: UserPreferences;
  statistics: UserStatistics;
}

/**
 * Estadísticas del usuario
 */
interface UserStatistics {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  loginCount: number;
  lastActivityAt: number;
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  productivityScore: number;
  streakDays: number;
}

/**
 * Configuración de avatar
 */
interface AvatarConfig {
  type: 'initials' | 'gravatar' | 'upload' | 'generated';
  value: string;
  color: string;
  backgroundColor: string;
}

/**
 * Datos para actualización de perfil
 */
interface ProfileUpdateData {
  name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  birthDate?: string;
}

/**
 * Resultado de operaciones del perfil
 */
interface ProfileResult {
  success: boolean;
  message: string;
  errors?: ValidationError[];
}

// ===== CLASE PRINCIPAL DEL PERFIL =====

/**
 * Servicio para gestión del perfil de usuario
 */
class UserProfileService {
  private readonly PROFILE_STORAGE_KEY = 'taskmaster_user_profiles';
  private readonly AVATAR_STORAGE_KEY = 'taskmaster_user_avatars';

  /**
   * Obtiene el perfil completo del usuario actual
   */
  getCurrentUserProfile(): UserProfile | null {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return null;

    try {
      const profiles = this.getAllProfiles();
      const profile = profiles[currentUser.id];
      
      if (profile) {
        return this.enrichProfileWithStatistics(profile);
      }

      // Crear perfil inicial si no existe
      return this.createInitialProfile(currentUser);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return null;
    }
  }

  /**
   * Crea un perfil inicial para un usuario nuevo
   */
  private createInitialProfile(user: User): UserProfile {
    const profile: UserProfile = {
      ...user,
      bio: '',
      phone: '',
      location: '',
      website: '',
      birthDate: '',
      avatar: this.generateInitialAvatar(user.name),
      preferences: {
        theme: 'auto',
        language: 'es',
        notifications: true,
        rememberSession: false
      },
      statistics: {
        totalTasks: 0,
        completedTasks: 0,
        activeTasks: 0,
        loginCount: 1,
        lastActivityAt: Date.now(),
        tasksCreatedThisWeek: 0,
        tasksCompletedThisWeek: 0,
        productivityScore: 0,
        streakDays: 0
      }
    };

    this.saveProfile(profile);
    return profile;
  }

  /**
   * Actualiza los datos del perfil
   */
  async updateProfile(updateData: ProfileUpdateData): Promise<ProfileResult> {
    try {
      const currentProfile = this.getCurrentUserProfile();
      if (!currentProfile) {
        return {
          success: false,
          message: 'No se encontró el perfil del usuario'
        };
      }

      // Validar datos de entrada
      const validationErrors = this.validateProfileData(updateData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Datos de perfil inválidos',
          errors: validationErrors
        };
      }

      // Actualizar perfil
      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...updateData,
        name: updateData.name ? this.sanitizeString(updateData.name) : currentProfile.name,
        bio: updateData.bio ? this.sanitizeString(updateData.bio) : currentProfile.bio,
        phone: updateData.phone ? this.sanitizeString(updateData.phone) : currentProfile.phone,
        location: updateData.location ? this.sanitizeString(updateData.location) : currentProfile.location,
        website: updateData.website ? this.sanitizeString(updateData.website) : currentProfile.website
      };

      this.saveProfile(updatedProfile);

      return {
        success: true,
        message: 'Perfil actualizado correctamente'
      };

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return {
        success: false,
        message: 'Error interno al actualizar el perfil'
      };
    }
  }

  /**
   * Actualiza las preferencias del usuario
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<ProfileResult> {
    try {
      const currentProfile = this.getCurrentUserProfile();
      if (!currentProfile) {
        return {
          success: false,
          message: 'No se encontró el perfil del usuario'
        };
      }

      const updatedProfile: UserProfile = {
        ...currentProfile,
        preferences: {
          ...currentProfile.preferences,
          ...preferences
        }
      };

      this.saveProfile(updatedProfile);

      // Las preferencias se actualizaron correctamente

      return {
        success: true,
        message: 'Preferencias actualizadas correctamente'
      };

    } catch (error) {
      console.error('Error al actualizar preferencias:', error);
      return {
        success: false,
        message: 'Error interno al actualizar las preferencias'
      };
    }
  }

  /**
   * Actualiza las estadísticas del usuario
   */
  updateStatistics(newStats: Partial<UserStatistics>): void {
    try {
      const currentProfile = this.getCurrentUserProfile();
      if (!currentProfile) return;

      const updatedProfile: UserProfile = {
        ...currentProfile,
        statistics: {
          ...currentProfile.statistics,
          ...newStats,
          lastActivityAt: Date.now()
        }
      };

      this.saveProfile(updatedProfile);
    } catch (error) {
      console.error('Error al actualizar estadísticas:', error);
    }
  }

  /**
   * Actualiza el avatar del usuario
   */
  async updateAvatar(avatarData: string, type: AvatarConfig['type'] = 'upload'): Promise<ProfileResult> {
    try {
      const currentProfile = this.getCurrentUserProfile();
      if (!currentProfile) {
        return {
          success: false,
          message: 'No se encontró el perfil del usuario'
        };
      }

      // Validar tamaño si es upload (simulado)
      if (type === 'upload' && avatarData.length > 100000) {
        return {
          success: false,
          message: 'El avatar es demasiado grande. Máximo 100KB.'
        };
      }

      const avatarConfig: AvatarConfig = {
        type,
        value: avatarData,
        color: this.generateAvatarColor(currentProfile.name),
        backgroundColor: this.generateBackgroundColor(currentProfile.name)
      };

      const updatedProfile: UserProfile = {
        ...currentProfile,
        avatar: avatarData
      };

      this.saveProfile(updatedProfile);
      this.saveAvatarConfig(currentProfile.id, avatarConfig);

      return {
        success: true,
        message: 'Avatar actualizado correctamente'
      };

    } catch (error) {
      console.error('Error al actualizar avatar:', error);
      return {
        success: false,
        message: 'Error interno al actualizar el avatar'
      };
    }
  }

  /**
   * Obtiene las estadísticas detalladas del usuario
   */
  getDetailedStatistics(): UserStatistics | null {
    const profile = this.getCurrentUserProfile();
    if (!profile) return null;

    // Calcular estadísticas en tiempo real basadas en las tareas
    const tasks = this.getTasksFromMainApp();
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const realtimeStats: UserStatistics = {
      ...profile.statistics,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.done).length,
      activeTasks: tasks.filter(t => !t.done).length,
      tasksCreatedThisWeek: tasks.filter(t => t.createdAt > oneWeekAgo).length,
      tasksCompletedThisWeek: tasks.filter(t => t.completedAt && t.completedAt > oneWeekAgo).length,
      productivityScore: this.calculateProductivityScore(tasks),
      streakDays: this.calculateStreakDays(tasks)
    };

    // Actualizar estadísticas en el perfil
    this.updateStatistics(realtimeStats);

    return realtimeStats;
  }

  /**
   * Elimina todos los datos del perfil (para desarrollo)
   */
  clearAllProfileData(): void {
    localStorage.removeItem(this.PROFILE_STORAGE_KEY);
    localStorage.removeItem(this.AVATAR_STORAGE_KEY);
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Obtiene todos los perfiles almacenados
   */
  private getAllProfiles(): Record<string, UserProfile> {
    try {
      const data = localStorage.getItem(this.PROFILE_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Guarda un perfil en localStorage
   */
  private saveProfile(profile: UserProfile): void {
    try {
      const profiles = this.getAllProfiles();
      profiles[profile.id] = profile;
      localStorage.setItem(this.PROFILE_STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error('Error al guardar perfil:', error);
    }
  }

  /**
   * Guarda configuración de avatar
   */
  private saveAvatarConfig(userId: string, config: AvatarConfig): void {
    try {
      const avatars = JSON.parse(localStorage.getItem(this.AVATAR_STORAGE_KEY) || '{}');
      avatars[userId] = config;
      localStorage.setItem(this.AVATAR_STORAGE_KEY, JSON.stringify(avatars));
    } catch (error) {
      console.error('Error al guardar avatar:', error);
    }
  }

  /**
   * Enriquece el perfil con estadísticas actualizadas
   */
  private enrichProfileWithStatistics(profile: UserProfile): UserProfile {
    const tasks = this.getTasksFromMainApp();
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    return {
      ...profile,
      statistics: {
        ...profile.statistics,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.done).length,
        activeTasks: tasks.filter(t => !t.done).length,
        tasksCreatedThisWeek: tasks.filter(t => t.createdAt > oneWeekAgo).length,
        tasksCompletedThisWeek: tasks.filter(t => t.completedAt && t.completedAt > oneWeekAgo).length,
        lastActivityAt: now
      }
    };
  }

  /**
   * Genera avatar inicial basado en las iniciales
   */
  private generateInitialAvatar(name: string): string {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
    
    return initials || 'U';
  }

  /**
   * Genera color para avatar basado en el nombre
   */
  private generateAvatarColor(name: string): string {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
    const index = name.length % colors.length;
    return colors[index];
  }

  /**
   * Genera color de fondo para avatar
   */
  private generateBackgroundColor(name: string): string {
    const backgrounds = ['#fcebea', '#ebf3fd', '#eafaf1', '#fef5e7', '#f4ecf7', '#e8f8f5', '#fdf2e9'];
    const index = name.length % backgrounds.length;
    return backgrounds[index];
  }

  /**
   * Valida datos del perfil
   */
  private validateProfileData(data: ProfileUpdateData): ValidationError[] {
    const errors: ValidationError[] = [];

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        errors.push({
          field: 'name',
          message: 'El nombre es requerido',
          code: 'REQUIRED'
        });
      } else if (data.name.trim().length < 2) {
        errors.push({
          field: 'name',
          message: 'El nombre debe tener al menos 2 caracteres',
          code: 'MIN_LENGTH'
        });
      }
    }

    if (data.phone && !/^[\d\s\+\-\(\)]+$/.test(data.phone)) {
      errors.push({
        field: 'phone',
        message: 'Formato de teléfono inválido',
        code: 'INVALID_FORMAT'
      });
    }

    if (data.website && data.website.trim()) {
      try {
        new URL(data.website);
      } catch {
        errors.push({
          field: 'website',
          message: 'URL del sitio web inválida',
          code: 'INVALID_URL'
        });
      }
    }

    if (data.birthDate && data.birthDate.trim()) {
      const date = new Date(data.birthDate);
      if (isNaN(date.getTime()) || date > new Date()) {
        errors.push({
          field: 'birthDate',
          message: 'Fecha de nacimiento inválida',
          code: 'INVALID_DATE'
        });
      }
    }

    return errors;
  }

  /**
   * Sanitiza strings de entrada
   */
  private sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Aplica tema a la interfaz
   */
  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const html = document.documentElement;
    
    switch (theme) {
      case 'light':
        html.setAttribute('data-bs-theme', 'light');
        break;
      case 'dark':
        html.setAttribute('data-bs-theme', 'dark');
        break;
      case 'auto':
        // Detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
        break;
    }
  }

  /**
   * Obtiene tareas de la aplicación principal
   */
  private getTasksFromMainApp(): any[] {
    try {
      // Acceder al estado global de la aplicación principal
      const tasksData = localStorage.getItem('todo-app-tasks');
      return tasksData ? JSON.parse(tasksData) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Calcula puntuación de productividad
   */
  private calculateProductivityScore(tasks: any[]): number {
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(t => t.done).length;
    const totalTasks = tasks.length;
    const completionRate = (completedTasks / totalTasks) * 100;

    // Factores adicionales
    const recentActivity = tasks.filter(t => 
      t.createdAt > Date.now() - (7 * 24 * 60 * 60 * 1000)
    ).length;

    const recentCompletion = tasks.filter(t => 
      t.completedAt && t.completedAt > Date.now() - (7 * 24 * 60 * 60 * 1000)
    ).length;

    // Cálculo de puntuación (0-100)
    const score = Math.min(100, Math.round(
      (completionRate * 0.6) + 
      (Math.min(recentActivity * 5, 30)) + 
      (Math.min(recentCompletion * 10, 10))
    ));

    return score;
  }

  /**
   * Calcula días de racha consecutiva
   */
  private calculateStreakDays(tasks: any[]): number {
    if (tasks.length === 0) return 0;

    const completedTasks = tasks
      .filter(t => t.completedAt)
      .sort((a, b) => b.completedAt - a.completedAt);

    if (completedTasks.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const task of completedTasks) {
      const taskDate = new Date(task.completedAt);
      taskDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - taskDate.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }
}

// ===== INSTANCIA GLOBAL =====

const userProfileService = new UserProfileService();

// ===== EXPOSICIÓN GLOBAL =====

(window as any).userProfileService = userProfileService;

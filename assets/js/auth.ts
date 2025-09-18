// ===== SISTEMA DE AUTENTICACIÓN AVANZADO =====
// Implementación de autenticación sin base de datos usando TypeScript
// Aplica principios SOLID, arquitectura limpia y buenas prácticas

// ===== TIPOS E INTERFACES =====

/**
 * Tipos de roles disponibles en el sistema
 */
type UserRole = 'admin' | 'user' | 'guest';

/**
 * Niveles de seguridad para las contraseñas
 */
type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

/**
 * Estados posibles de una sesión de usuario
 */
type SessionStatus = 'active' | 'expired' | 'invalid' | 'terminated';

/**
 * Interfaz que define la estructura de un usuario del sistema
 */
interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly createdAt: number;
  readonly lastLoginAt?: number;
  readonly isActive: boolean;
  readonly preferences?: UserPreferences;
}

/**
 * Preferencias personalizables del usuario
 */
interface UserPreferences {
  readonly notifications: boolean;
  readonly rememberSession: boolean;
}

/**
 * Información de autenticación del usuario
 */
interface AuthCredentials {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

/**
 * Datos necesarios para el registro de usuario
 */
interface RegisterData {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly acceptTerms: boolean;
}

/**
 * Resultado de una operación de autenticación
 */
interface AuthResult {
  readonly success: boolean;
  readonly user?: User;
  readonly token?: string;
  readonly message: string;
  readonly errors?: ValidationError[];
}

/**
 * Estructura de errores de validación
 */
interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Estado de una sesión de usuario
 */
interface UserSession {
  readonly token: string;
  readonly user: User;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly status: SessionStatus;
  readonly deviceInfo?: string;
}

/**
 * Configuración del sistema de autenticación
 */
interface AuthConfig {
  readonly sessionDuration: number;
  readonly maxLoginAttempts: number;
  readonly passwordMinLength: number;
  readonly passwordRequireSpecialChars: boolean;
  readonly passwordRequireNumbers: boolean;
  readonly passwordRequireUppercase: boolean;
  readonly tokenPrefix: string;
}

// ===== CONFIGURACIÓN DEL SISTEMA =====

/**
 * Configuración por defecto del sistema de autenticación
 */
const DEFAULT_AUTH_CONFIG: AuthConfig = {
  sessionDuration: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  passwordRequireSpecialChars: true,
  passwordRequireNumbers: true,
  passwordRequireUppercase: true,
  tokenPrefix: 'auth_token_'
};

/**
 * Claves para almacenamiento en localStorage
 */
const STORAGE_KEYS = {
  USERS: 'taskmaster_users',
  CURRENT_SESSION: 'taskmaster_session',
  LOGIN_ATTEMPTS: 'taskmaster_login_attempts',
  USER_PREFERENCES: 'taskmaster_preferences'
} as const;

// ===== UTILIDADES Y HELPERS =====

/**
 * Generador de IDs únicos
 * @returns ID único de 12 caracteres
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
};

/**
 * Generador de tokens de sesión seguros
 * @returns Token único de 32 caracteres
 */
const generateToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = DEFAULT_AUTH_CONFIG.tokenPrefix;
  
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
};

/**
 * Función de hash simple para contraseñas (simulación)
 * En un entorno real, se usaría bcrypt o similar
 * @param password - Contraseña a hashear
 * @returns Hash de la contraseña
 */
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit
  }
  return `hashed_${Math.abs(hash).toString(36)}_${password.length}`;
};

/**
 * Función para verificar contraseñas hasheadas
 * @param password - Contraseña en texto plano
 * @param hashedPassword - Hash almacenado
 * @returns true si coinciden
 */
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

/**
 * Sanitización de cadenas de texto
 * @param input - Texto a sanitizar
 * @returns Texto sanitizado
 */
const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Verificación de formato de email
 * @param email - Email a validar
 * @returns true si el formato es válido
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ===== SISTEMA DE VALIDACIÓN =====

/**
 * Clase para validación de datos de entrada
 */
class AuthValidator {
  private config: AuthConfig;

  constructor(config: AuthConfig = DEFAULT_AUTH_CONFIG) {
    this.config = config;
  }

  /**
   * Valida credenciales de login
   */
  validateLoginCredentials(credentials: AuthCredentials): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validar email
    if (!credentials.email) {
      errors.push({
        field: 'email',
        message: 'El email es requerido',
        code: 'REQUIRED'
      });
    } else if (!isValidEmail(credentials.email)) {
      errors.push({
        field: 'email',
        message: 'El formato del email no es válido',
        code: 'INVALID_FORMAT'
      });
    }

    // Validar contraseña
    if (!credentials.password) {
      errors.push({
        field: 'password',
        message: 'La contraseña es requerida',
        code: 'REQUIRED'
      });
    }

    return errors;
  }

  /**
   * Valida datos de registro
   */
  validateRegistrationData(data: RegisterData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validar nombre
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

    // Validar email
    if (!data.email) {
      errors.push({
        field: 'email',
        message: 'El email es requerido',
        code: 'REQUIRED'
      });
    } else if (!isValidEmail(data.email)) {
      errors.push({
        field: 'email',
        message: 'El formato del email no es válido',
        code: 'INVALID_FORMAT'
      });
    }

    // Validar contraseña
    const passwordErrors = this.validatePassword(data.password);
    errors.push(...passwordErrors);

    // Validar confirmación de contraseña
    if (data.password !== data.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        message: 'Las contraseñas no coinciden',
        code: 'PASSWORDS_MISMATCH'
      });
    }

    // Validar términos y condiciones
    if (!data.acceptTerms) {
      errors.push({
        field: 'acceptTerms',
        message: 'Debes aceptar los términos y condiciones',
        code: 'TERMS_NOT_ACCEPTED'
      });
    }

    return errors;
  }

  /**
   * Valida la fortaleza de una contraseña
   */
  validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!password) {
      errors.push({
        field: 'password',
        message: 'La contraseña es requerida',
        code: 'REQUIRED'
      });
      return errors;
    }

    if (password.length < this.config.passwordMinLength) {
      errors.push({
        field: 'password',
        message: `La contraseña debe tener al menos ${this.config.passwordMinLength} caracteres`,
        code: 'MIN_LENGTH'
      });
    }

    if (this.config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'La contraseña debe contener al menos una letra mayúscula',
        code: 'REQUIRE_UPPERCASE'
      });
    }

    if (this.config.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push({
        field: 'password',
        message: 'La contraseña debe contener al menos un número',
        code: 'REQUIRE_NUMBER'
      });
    }

    if (this.config.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'La contraseña debe contener al menos un carácter especial',
        code: 'REQUIRE_SPECIAL'
      });
    }

    return errors;
  }

  /**
   * Calcula la fortaleza de una contraseña
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    switch (true) {
      case score >= 6: return 'very-strong';
      case score >= 4: return 'strong';
      case score >= 3: return 'medium';
      default: return 'weak';
    }
  }
}

// ===== SISTEMA DE ALMACENAMIENTO =====

/**
 * Clase para manejo del almacenamiento local de usuarios
 */
class UserStorage {
  
  /**
   * Obtiene todos los usuarios registrados
   */
  getAllUsers(): User[] {
    try {
      const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.warn('Error al cargar usuarios:', error);
      return [];
    }
  }

  /**
   * Busca un usuario por email
   */
  getUserByEmail(email: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Busca un usuario por ID
   */
  getUserById(id: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.id === id) || null;
  }

  /**
   * Guarda un nuevo usuario
   */
  saveUser(user: User, hashedPassword: string): boolean {
    try {
      const users = this.getAllUsers();
      
      // Verificar que el email no exista
      if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        return false;
      }

      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Guardar contraseña por separado (simulando tabla de credenciales)
      this.saveUserCredentials(user.id, hashedPassword);
      
      return true;
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      return false;
    }
  }

  /**
   * Actualiza datos de un usuario
   */
  updateUser(updatedUser: User): boolean {
    try {
      const users = this.getAllUsers();
      const index = users.findIndex(u => u.id === updatedUser.id);
      
      if (index === -1) return false;
      
      users[index] = updatedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      return true;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return false;
    }
  }

  /**
   * Guarda credenciales de usuario (contraseña hasheada)
   */
  private saveUserCredentials(userId: string, hashedPassword: string): void {
    try {
      const credentials = this.getAllCredentials();
      credentials[userId] = hashedPassword;
      localStorage.setItem('taskmaster_credentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Error al guardar credenciales:', error);
    }
  }

  /**
   * Obtiene la contraseña hasheada de un usuario
   */
  getUserPassword(userId: string): string | null {
    try {
      const credentials = this.getAllCredentials();
      return credentials[userId] || null;
    } catch (error) {
      console.error('Error al obtener credenciales:', error);
      return null;
    }
  }

  /**
   * Obtiene todas las credenciales almacenadas
   */
  private getAllCredentials(): Record<string, string> {
    try {
      const credentialsData = localStorage.getItem('taskmaster_credentials');
      return credentialsData ? JSON.parse(credentialsData) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Limpia todos los datos de usuarios
   */
  clearAllUsers(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem('taskmaster_credentials');
  }
}

// ===== SISTEMA DE SESIONES =====

/**
 * Clase para manejo de sesiones de usuario
 */
class SessionManager {
  private config: AuthConfig;

  constructor(config: AuthConfig = DEFAULT_AUTH_CONFIG) {
    this.config = config;
  }

  /**
   * Crea una nueva sesión para un usuario
   */
  createSession(user: User, rememberMe: boolean = false): UserSession {
    const now = Date.now();
    const duration = rememberMe ? this.config.sessionDuration * 7 : this.config.sessionDuration;
    
    const session: UserSession = {
      token: generateToken(),
      user: { ...user, lastLoginAt: now },
      createdAt: now,
      expiresAt: now + duration,
      status: 'active',
      deviceInfo: this.getDeviceInfo()
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Obtiene la sesión actual
   */
  getCurrentSession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (!sessionData) return null;

      const session: UserSession = JSON.parse(sessionData);
      
      // Verificar si la sesión está expirada
      if (this.isSessionExpired(session)) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error al obtener sesión:', error);
      return null;
    }
  }

  /**
   * Verifica si una sesión está expirada
   */
  isSessionExpired(session: UserSession): boolean {
    return Date.now() > session.expiresAt || session.status !== 'active';
  }

  /**
   * Renueva una sesión existente
   */
  renewSession(session: UserSession): UserSession | null {
    if (this.isSessionExpired(session)) {
      return null;
    }

    const renewedSession: UserSession = {
      ...session,
      expiresAt: Date.now() + this.config.sessionDuration
    };

    this.saveSession(renewedSession);
    return renewedSession;
  }

  /**
   * Termina la sesión actual
   */
  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }

  /**
   * Guarda una sesión en localStorage
   */
  private saveSession(session: UserSession): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    } catch (error) {
      console.error('Error al guardar sesión:', error);
    }
  }

  /**
   * Obtiene información básica del dispositivo
   */
  private getDeviceInfo(): string {
    return `${navigator.userAgent.slice(0, 50)}...`;
  }
}

// ===== SISTEMA DE CONTROL DE INTENTOS =====

/**
 * Clase para control de intentos de login
 */
class LoginAttemptManager {
  private config: AuthConfig;

  constructor(config: AuthConfig = DEFAULT_AUTH_CONFIG) {
    this.config = config;
  }

  /**
   * Registra un intento de login fallido
   */
  recordFailedAttempt(email: string): void {
    const attempts = this.getLoginAttempts();
    const now = Date.now();
    
    if (!attempts[email]) {
      attempts[email] = [];
    }

    attempts[email].push(now);
    
    // Mantener solo los últimos intentos
    attempts[email] = attempts[email].slice(-this.config.maxLoginAttempts);
    
    this.saveLoginAttempts(attempts);
  }

  /**
   * Limpia los intentos de login de un usuario
   */
  clearLoginAttempts(email: string): void {
    const attempts = this.getLoginAttempts();
    delete attempts[email];
    this.saveLoginAttempts(attempts);
  }

  /**
   * Verifica si un usuario está bloqueado por demasiados intentos
   */
  isUserBlocked(email: string): boolean {
    const attempts = this.getLoginAttempts();
    const userAttempts = attempts[email] || [];
    
    if (userAttempts.length < this.config.maxLoginAttempts) {
      return false;
    }

    // Verificar si los intentos fueron en la última hora
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentAttempts = userAttempts.filter(timestamp => timestamp > oneHourAgo);
    
    return recentAttempts.length >= this.config.maxLoginAttempts;
  }

  /**
   * Obtiene los intentos de login almacenados
   */
  private getLoginAttempts(): Record<string, number[]> {
    try {
      const attemptsData = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
      return attemptsData ? JSON.parse(attemptsData) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Guarda los intentos de login
   */
  private saveLoginAttempts(attempts: Record<string, number[]>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
    } catch (error) {
      console.error('Error al guardar intentos de login:', error);
    }
  }
}

// ===== SERVICIO PRINCIPAL DE AUTENTICACIÓN =====

/**
 * Clase principal que maneja toda la lógica de autenticación
 * Implementa el patrón Service y principios SOLID
 */
class AuthService {
  private validator: AuthValidator;
  private storage: UserStorage;
  private sessionManager: SessionManager;
  private attemptManager: LoginAttemptManager;
  private config: AuthConfig;

  constructor(config: AuthConfig = DEFAULT_AUTH_CONFIG) {
    this.config = config;
    this.validator = new AuthValidator(config);
    this.storage = new UserStorage();
    this.sessionManager = new SessionManager(config);
    this.attemptManager = new LoginAttemptManager(config);
  }

  /**
   * Registra un nuevo usuario en el sistema
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Validar datos de entrada
      const validationErrors = this.validator.validateRegistrationData(data);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Datos de registro inválidos',
          errors: validationErrors
        };
      }

      // Verificar que el email no esté registrado
      const existingUser = this.storage.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: 'El email ya está registrado',
          errors: [{
            field: 'email',
            message: 'Este email ya está en uso',
            code: 'EMAIL_EXISTS'
          }]
        };
      }

      // Crear nuevo usuario
      const user: User = {
        id: generateId(),
        email: sanitizeString(data.email.toLowerCase()),
        name: sanitizeString(data.name),
        role: 'user',
        createdAt: Date.now(),
        isActive: true,
        preferences: {
          notifications: true,
          rememberSession: false
        }
      };

      // Hashear contraseña y guardar usuario
      const hashedPassword = hashPassword(data.password);
      const saved = this.storage.saveUser(user, hashedPassword);

      if (!saved) {
        return {
          success: false,
          message: 'Error al crear la cuenta. Inténtalo nuevamente.'
        };
      }

      // Crear sesión automáticamente después del registro
      const session = this.sessionManager.createSession(user, false);

      return {
        success: true,
        user: session.user,
        token: session.token,
        message: '¡Cuenta creada exitosamente! Bienvenido a TaskMaster.'
      };

    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: 'Error interno del servidor. Inténtalo más tarde.'
      };
    }
  }

  /**
   * Autentica un usuario en el sistema
   */
  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Validar datos de entrada
      const validationErrors = this.validator.validateLoginCredentials(credentials);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Credenciales inválidas',
          errors: validationErrors
        };
      }

      const email = credentials.email.toLowerCase();

      // Verificar si el usuario está bloqueado
      if (this.attemptManager.isUserBlocked(email)) {
        return {
          success: false,
          message: 'Cuenta temporalmente bloqueada por demasiados intentos fallidos. Inténtalo en una hora.'
        };
      }

      // Buscar usuario
      const user = this.storage.getUserByEmail(email);
      if (!user) {
        this.attemptManager.recordFailedAttempt(email);
        return {
          success: false,
          message: 'Email o contraseña incorrectos'
        };
      }

      // Verificar que el usuario esté activo
      if (!user.isActive) {
        return {
          success: false,
          message: 'Cuenta desactivada. Contacta al administrador.'
        };
      }

      // Verificar contraseña
      const storedPassword = this.storage.getUserPassword(user.id);
      if (!storedPassword || !verifyPassword(credentials.password, storedPassword)) {
        this.attemptManager.recordFailedAttempt(email);
        return {
          success: false,
          message: 'Email o contraseña incorrectos'
        };
      }

      // Login exitoso - limpiar intentos fallidos
      this.attemptManager.clearLoginAttempts(email);

      // Crear nueva sesión
      const session = this.sessionManager.createSession(user, credentials.rememberMe || false);

      return {
        success: true,
        user: session.user,
        token: session.token,
        message: `¡Bienvenido de nuevo, ${user.name}!`
      };

    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error interno del servidor. Inténtalo más tarde.'
      };
    }
  }

  /**
   * Cierra la sesión del usuario actual
   */
  logout(): AuthResult {
    try {
      const session = this.sessionManager.getCurrentSession();
      const userName = session?.user.name;

      this.sessionManager.clearSession();

      return {
        success: true,
        message: userName ? `¡Hasta luego, ${userName}!` : 'Sesión cerrada correctamente'
      };

    } catch (error) {
      console.error('Error en logout:', error);
      return {
        success: false,
        message: 'Error al cerrar sesión'
      };
    }
  }

  /**
   * Obtiene el usuario autenticado actual
   */
  getCurrentUser(): User | null {
    const session = this.sessionManager.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Renueva la sesión actual si es válida
   */
  renewSession(): boolean {
    const session = this.sessionManager.getCurrentSession();
    if (!session) return false;

    const renewedSession = this.sessionManager.renewSession(session);
    return renewedSession !== null;
  }

  /**
   * Calcula la fortaleza de una contraseña
   */
  getPasswordStrength(password: string): PasswordStrength {
    return this.validator.calculatePasswordStrength(password);
  }

  /**
   * Obtiene estadísticas del sistema de autenticación
   */
  getAuthStats(): { totalUsers: number; activeUsers: number } {
    const users = this.storage.getAllUsers();
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length
    };
  }

  /**
   * Limpia todos los datos del sistema (para desarrollo/testing)
   */
  clearAllData(): void {
    this.storage.clearAllUsers();
    this.sessionManager.clearSession();
    localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
  }
}

// ===== INSTANCIA GLOBAL DEL SERVICIO =====

/**
 * Instancia global del servicio de autenticación
 * Se puede usar en toda la aplicación
 */
const authService = new AuthService();

// ===== FUNCIÓN DE INICIALIZACIÓN =====

/**
 * Inicializa el sistema de autenticación
 * Debe llamarse al cargar la aplicación
 */
function initializeAuth(): void {
  // Verificar si hay una sesión activa al cargar la aplicación
  const currentUser = authService.getCurrentUser();
  
  if (currentUser) {
    console.log(`Usuario autenticado: ${currentUser.name} (${currentUser.email})`);
    // Renovar sesión si está próxima a expirar
    authService.renewSession();
  } else {
    console.log('No hay usuario autenticado');
  }
}

// ===== FUNCIONES AUXILIARES PARA LA UI =====

/**
 * Función para mostrar errores de validación en la UI
 */
function displayValidationErrors(errors: ValidationError[], formElement?: HTMLElement): void {
  // Limpiar errores previos
  if (formElement) {
    const errorElements = formElement.querySelectorAll('.invalid-feedback, .is-invalid');
    errorElements.forEach(el => {
      el.classList.remove('is-invalid');
      if (el.classList.contains('invalid-feedback')) {
        el.remove();
      }
    });
  }

  // Mostrar nuevos errores
  errors.forEach(error => {
    const field = formElement?.querySelector(`#${error.field}`) as HTMLInputElement;
    if (field) {
      field.classList.add('is-invalid');
      
      // Crear elemento de error
      const errorDiv = document.createElement('div');
      errorDiv.className = 'invalid-feedback';
      errorDiv.textContent = error.message;
      
      // Insertar después del campo
      field.parentNode?.insertBefore(errorDiv, field.nextSibling);
    }
  });
}

/**
 * Función para limpiar errores de validación
 */
function clearValidationErrors(formElement: HTMLElement): void {
  const errorElements = formElement.querySelectorAll('.invalid-feedback, .is-invalid');
  errorElements.forEach(el => {
    el.classList.remove('is-invalid');
    if (el.classList.contains('invalid-feedback')) {
      el.remove();
    }
  });
}

// ===== EXPOSICIÓN GLOBAL PARA COMPATIBILIDAD =====
// Exponer funciones y objetos necesarios en el scope global para uso en auth-ui.ts

(window as any).authService = authService;
(window as any).initializeAuth = initializeAuth;
(window as any).displayValidationErrors = displayValidationErrors;
(window as any).clearValidationErrors = clearValidationErrors;

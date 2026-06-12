import { Injectable, signal, effect } from '@angular/core';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
  weekStartsOn?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public readonly user = signal<User | null>(null);
  public readonly isLoading = signal<boolean>(true);

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          this.user.set(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
    this.isLoading.set(false);
  }

  public async login(email: string, password: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (foundUser) {
      const userWithoutPassword: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        avatar: foundUser.avatar || '',
        bio: foundUser.bio || '',
        theme: foundUser.theme || 'light',
        language: foundUser.language || 'es',
        notifications: foundUser.notifications ?? true,
        weekStartsOn: foundUser.weekStartsOn ?? 1
      };
      this.user.set(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  }

  public async register(email: string, password: string, name: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.some((u: any) => u.email === email)) {
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      avatar: '',
      bio: '',
      theme: 'light',
      language: 'es',
      notifications: true,
      weekStartsOn: 1
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const userWithoutPassword: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar,
      bio: newUser.bio,
      theme: newUser.theme as 'light' | 'dark',
      language: newUser.language,
      notifications: newUser.notifications,
      weekStartsOn: newUser.weekStartsOn
    };

    this.user.set(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    return true;
  }

  public logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.user.set(null);
      localStorage.removeItem('currentUser');
    }
  }

  public updateProfile(updates: Partial<User>): void {
    const currentUser = this.user();
    if (!currentUser || typeof window === 'undefined' || !window.localStorage) return;

    const updatedUser = { ...currentUser, ...updates };
    this.user.set(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) =>
      u.id === currentUser.id ? { ...u, ...updates } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  }
}

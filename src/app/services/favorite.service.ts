import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private baseUrl = 'http://localhost:3000/favorites';
  private favoritesSubject = new BehaviorSubject<string[]>([]);
  favorites$ = this.favoritesSubject
    .asObservable()
    .pipe(
      tap((favs) =>
        console.log(
          'favorites$ emitted for user',
          this.authService.getCurrentUserId(),
          ':',
          favs
        )
      )
    );

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadFavorites();
  }

  private loadFavorites() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.http.get<any[]>(`${this.baseUrl}?userId=${userId}`).subscribe({
        next: (favorites) => {
          const recipeIds = [
            ...new Set(favorites.map((f) => f.recipeId as string)),
          ];
          console.log(`Loaded favorites for user ${userId}:`, recipeIds);
          this.favoritesSubject.next(recipeIds);
        },
        error: (err) => console.error('Load favorites error:', err),
      });
    } else {
      console.log('No user logged in, favorites empty');
      this.favoritesSubject.next([]);
    }
  }

  isFavorite(recipeId: string, userId?: string): Observable<boolean> {
    const currentUserId = userId || this.authService.getCurrentUserId();
    if (!currentUserId) {
      console.log('No user ID provided for isFavorite check');
      return new Observable((observer) => {
        observer.next(false);
        observer.complete();
      });
    }

    // Use favorites$ for current user, or fetch directly for another user
    if (currentUserId === this.authService.getCurrentUserId()) {
      return this.favorites$.pipe(
        map((favs) => favs.includes(recipeId)),
        tap((isFav) =>
          console.log(
            `isFavorite check for ${recipeId} by user ${currentUserId}: ${isFav}`
          )
        )
      );
    } else {
      return this.http
        .get<any[]>(
          `${this.baseUrl}?userId=${currentUserId}&recipeId=${recipeId}`
        )
        .pipe(
          map((favorites) => favorites.length > 0),
          tap((isFav) =>
            console.log(
              `isFavorite check (server) for ${recipeId} by user ${currentUserId}: ${isFav}`
            )
          )
        );
    }
  }

  addFavorite(recipeId: string): Observable<any> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('No user logged in to add favorite');
      return new Observable((observer) => observer.complete());
    }

    console.log(`addFavorite invoked for ${recipeId} by user ${userId}`);
    return this.isFavorite(recipeId).pipe(
      switchMap((isFav) => {
        if (isFav) {
          console.log(
            `Recipe ${recipeId} is already a favorite for user ${userId}`
          );
          return new Observable((observer) => {
            observer.next({ status: 'already_favorited' });
            observer.complete();
          });
        }
        const favorite = { userId, recipeId };
        return this.http.post(this.baseUrl, favorite).pipe(
          map((response) => {
            const current = this.favoritesSubject.value;
            if (!current.includes(recipeId)) {
              const newFavs = [...current, recipeId];
              this.favoritesSubject.next(newFavs);
              console.log(
                `favoritesSubject updated for user ${userId}:`,
                newFavs
              );
            }
            return response;
          })
        );
      })
    );
  }

  removeFavorite(recipeId: string): Observable<any> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('No user logged in to remove favorite');
      return new Observable((observer) => observer.complete());
    }

    console.log(`removeFavorite invoked for ${recipeId} by user ${userId}`);
    return this.http
      .get<any[]>(`${this.baseUrl}?userId=${userId}&recipeId=${recipeId}`)
      .pipe(
        switchMap((favorites) => {
          if (favorites.length === 0) {
            console.warn(
              `Favorite not found to remove for user ${userId}:`,
              recipeId
            );
            const current = this.favoritesSubject.value.filter(
              (id) => id !== recipeId
            );
            this.favoritesSubject.next(current);
            console.log(
              `favoritesSubject after no favorites found for user ${userId}:`,
              current
            );
            return new Observable((observer) => {
              observer.next({ status: 'not_found' });
              observer.complete();
            });
          }
          const favoriteId = favorites[0].id;
          return this.http.delete(`${this.baseUrl}/${favoriteId}`).pipe(
            map(() => {
              const current = this.favoritesSubject.value.filter(
                (id) => id !== recipeId
              );
              this.favoritesSubject.next(current);
              console.log(
                `favoritesSubject after removal for user ${userId}:`,
                current
              );
              return { status: 'removed' };
            })
          );
        })
      );
  }
}

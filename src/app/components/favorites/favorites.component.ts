import { Component, OnInit, OnDestroy } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Recipe } from '../../models/recipe';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  standalone: false,
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favoriteRecipes: Recipe[] = [];
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private favoriteService: FavoriteService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadFavorites();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFavorites() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'Please log in to view your favorites.';
      this.favoriteRecipes = [];
      return;
    }

    this.favoriteService.favorites$
      .pipe(
        switchMap((favoriteIds: string[]) => {
          console.log(`Loading favorites for user ${userId}:`, favoriteIds);
          if (favoriteIds.length === 0) {
            this.favoriteRecipes = [];
            return [];
          }
          return this.recipeService.getRecipesByIds(favoriteIds);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (recipes: Recipe[]) => {
          this.favoriteRecipes = recipes;
          this.errorMessage = null;
          console.log(`Favorite recipes loaded for user ${userId}:`, recipes);
        },
        error: (err) => {
          this.errorMessage = 'Failed to load favorite recipes.';
          console.error('Load favorites error:', err);
          this.favoriteRecipes = [];
        },
      });
  }

  removeFavorite(recipeId: string) {
    this.favoriteService
      .removeFavorite(recipeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => console.log(`Removed ${recipeId} from favorites`),
        error: (err) => console.error('Remove favorite error:', err),
      });
  }
}

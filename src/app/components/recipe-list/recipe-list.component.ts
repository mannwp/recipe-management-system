import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Recipe } from '../../models/recipe';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  standalone: false,
})
export class RecipeListComponent implements OnInit, OnDestroy {
  recipes: Recipe[] = [];
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();
  processing: { [key: string]: boolean } = {}; // Track processing state per recipe

  constructor(
    private recipeService: RecipeService,
    public favoriteService: FavoriteService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRecipes();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRecipes() {
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.errorMessage = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load recipes.';
        console.error('Load recipes error:', err);
        this.cdr.markForCheck();
      },
    });
  }

  addToFavorites(recipeId: string) {
    if (this.processing[recipeId]) return; // Prevent action if already processing
    console.log(`Button clicked: Adding ${recipeId} to favorites`);
    this.processing[recipeId] = true;
    this.favoriteService
      .addFavorite(recipeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Added ${recipeId} to favorites`);
          this.processing[recipeId] = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Add to favorites error:', err);
          this.processing[recipeId] = false;
          this.cdr.markForCheck();
        },
      });
  }

  removeFromFavorites(recipeId: string) {
    if (this.processing[recipeId]) return; // Prevent action if already processing
    console.log(`Button clicked: Removing ${recipeId} from favorites`);
    this.processing[recipeId] = true;
    this.favoriteService
      .removeFavorite(recipeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Removed ${recipeId} from favorites`);
          this.processing[recipeId] = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Remove from favorites error:', err);
          this.processing[recipeId] = false;
          this.cdr.markForCheck();
        },
      });
  }

  isFavorite(recipeId: string): Observable<boolean> {
    return this.favoriteService.isFavorite(recipeId);
  }
}

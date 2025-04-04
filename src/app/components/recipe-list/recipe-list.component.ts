import { Component, OnInit, OnDestroy } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { FavoriteService } from '../../services/favorite.service';
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
  filteredRecipes: Recipe[] = [];
  errorMessage: string | null = null;
  categories: string[] = [];
  nameFilter: string = '';
  categoryFilter: string = '';
  ingredientFilter: string = '';
  sortOption: string = 'name-asc';
  private destroy$ = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    public favoriteService: FavoriteService
  ) {}

  ngOnInit() {
    this.loadRecipes();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecipes() {
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.categories = [...new Set(recipes.map((r) => r.category))].sort();
        this.applyFilters();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load recipes.';
        console.error('Load recipes error:', err);
      },
    });
  }

  applyFilters() {
    let filtered = [...this.recipes];

    // Filter by Name
    if (this.nameFilter) {
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(this.nameFilter.toLowerCase())
      );
    }

    // Filter by Category
    if (this.categoryFilter) {
      filtered = filtered.filter((r) => r.category === this.categoryFilter);
    }

    // Filter by Ingredients
    if (this.ingredientFilter) {
      filtered = filtered.filter((r) =>
        r.ingredients.some((ing) =>
          ing.toLowerCase().includes(this.ingredientFilter.toLowerCase())
        )
      );
    }

    this.filteredRecipes = filtered;
    this.applySort();
  }

  applySort() {
    switch (this.sortOption) {
      case 'name-asc':
        this.filteredRecipes.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        this.filteredRecipes.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'prep-asc':
        this.filteredRecipes.sort(
          (a, b) => a.preparationTime - b.preparationTime
        );
        break;
      case 'prep-desc':
        this.filteredRecipes.sort(
          (a, b) => b.preparationTime - a.preparationTime
        );
        break;
    }
  }

  addToFavorites(recipeId: string) {
    this.favoriteService
      .addFavorite(recipeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => console.log(`Added ${recipeId} to favorites`),
        error: (err) => console.error('Add to favorites error:', err),
      });
  }

  removeFromFavorites(recipeId: string) {
    this.favoriteService
      .removeFavorite(recipeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => console.log(`Removed ${recipeId} from favorites`),
        error: (err) => console.error('Remove from favorites error:', err),
      });
  }

  isFavorite(recipeId: string): Observable<boolean> {
    return this.favoriteService.isFavorite(recipeId);
  }
}

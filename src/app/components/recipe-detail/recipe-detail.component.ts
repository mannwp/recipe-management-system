import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { Recipe } from '../../models/recipe';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.component.html',
  standalone: false,
})
export class RecipeDetailComponent implements OnInit, OnDestroy {
  recipe: Recipe | null = null;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();
  processing = false; // Add flag to prevent double clicks

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    public authService: AuthService,
    public favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Invalid recipe ID. Please check the URL.';
      console.error('No ID parameter provided');
      this.router.navigate(['/recipes']);
      return;
    }

    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        this.errorMessage = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = `Recipe with ID ${id} not found.`;
        console.error('Load recipe error:', err);
        this.cdr.markForCheck();
      },
    });

    this.favoriteService.favorites$
      .pipe(
        takeUntil(this.destroy$),
        tap((favs) => console.log('favorites$ updated:', favs))
      )
      .subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addToFavorites() {
    if (!this.recipe || this.processing) return;
    this.processing = true;
    console.log(`Button clicked: Adding ${this.recipe.id} to favorites`);
    this.favoriteService
      .addFavorite(this.recipe.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Added ${this.recipe!.id} to favorites`);
          this.processing = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Add to favorites error:', err);
          this.processing = false;
          this.cdr.markForCheck();
        },
      });
  }

  removeFromFavorites() {
    if (!this.recipe || this.processing) return;
    this.processing = true;
    console.log(`Button clicked: Removing ${this.recipe.id} from favorites`);
    this.favoriteService
      .removeFavorite(this.recipe.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Removed ${this.recipe!.id} from favorites`);
          this.processing = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Remove from favorites error:', err);
          this.processing = false;
          this.cdr.markForCheck();
        },
      });
  }

  deleteRecipe() {
    if (this.recipe && confirm('Are you sure?')) {
      this.recipeService.deleteRecipe(this.recipe.id).subscribe({
        next: () => this.router.navigate(['/recipes']),
        error: (err) => console.error('Delete recipe error:', err),
      });
    }
  }

  isFavorite(recipeId: string): Observable<boolean> {
    return this.favoriteService.isFavorite(recipeId);
  }
}

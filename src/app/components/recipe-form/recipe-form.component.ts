import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-recipe-form',
  templateUrl: './recipe-form.component.html',
  standalone: false,
})
export class RecipeFormComponent implements OnInit {
  recipeForm: FormGroup;
  editMode = false;
  recipeId: string | null = null;
  originalRecipe: Recipe | null = null;
  categories = [
    'Vegetarian',
    'Dessert',
    'Main Course',
    'Appetizer',
    'Beverage',
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      preparationTime: ['', [Validators.required, Validators.min(1)]],
      ingredients: ['', Validators.required],
      instructions: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    if (this.recipeId) {
      this.editMode = true;
      this.recipeService.getRecipeById(this.recipeId).subscribe({
        next: (recipe) => {
          this.originalRecipe = recipe;
          this.recipeForm.patchValue({
            name: recipe.name,
            category: recipe.category,
            preparationTime: recipe.preparationTime,
            ingredients: recipe.ingredients.join('\n'),
            instructions: recipe.instructions,
          });
        },
        error: (err) => console.error('Load recipe error:', err),
      });
    }
  }

  private generateStringId(existingRecipes: Recipe[]): string {
    if (!existingRecipes || existingRecipes.length === 0) {
      return '1';
    }
    const maxId = Math.max(...existingRecipes.map((r) => parseInt(r.id, 10)));
    return (maxId + 1).toString();
  }

  onSubmit() {
    if (this.recipeForm.valid) {
      const formValue = this.recipeForm.value;
      const recipeBase: Partial<Recipe> = {
        name: formValue.name,
        category: formValue.category,
        preparationTime: formValue.preparationTime,
        ingredients: formValue.ingredients
          .split('\n')
          .map((i: string) => i.trim())
          .filter((i: string) => i),
        instructions: formValue.instructions,
        createdAt:
          this.editMode && this.originalRecipe
            ? this.originalRecipe.createdAt
            : new Date().toISOString(),
      };

      if (this.editMode && this.recipeId) {
        const updateRecipe: Recipe = {
          ...recipeBase,
          id: this.recipeId,
        } as Recipe;
        this.recipeService.updateRecipe(this.recipeId, updateRecipe).subscribe({
          next: () => this.router.navigate(['/recipes', this.recipeId]),
          error: (err) => console.error('Update recipe error:', err),
        });
      } else {
        this.recipeService
          .getRecipes()
          .pipe(
            switchMap((existingRecipes: Recipe[]) => {
              const newId = this.generateStringId(existingRecipes);
              const newRecipe: Recipe = { ...recipeBase, id: newId } as Recipe;
              return this.recipeService.addRecipe(newRecipe);
            })
          )
          .subscribe({
            next: (savedRecipe: Recipe) => {
              console.log('Recipe saved successfully:', savedRecipe);
              this.router.navigate(['/recipes', savedRecipe.id]);
            },
            error: (err) => {
              console.error('Error adding recipe:', err);
              alert(`Failed to add recipe: ${err.message}`);
            },
          });
      }
    }
  }
}

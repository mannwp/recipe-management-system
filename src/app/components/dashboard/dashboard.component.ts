import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  totalRecipes = 0;
  recentRecipes: Recipe[] = [];
  categoryData: any[] = [];
  ingredientData: any[] = [];

  constructor(private recipeService: RecipeService) {}

  ngOnInit() {
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.totalRecipes = recipes.length;
        this.recentRecipes = recipes
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        const categoryCounts = recipes.reduce((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        this.categoryData = Object.entries(categoryCounts).map(
          ([name, value]) => ({ name, value })
        );

        const allIngredients = recipes.flatMap((r) => r.ingredients);
        const ingredientCounts = allIngredients.reduce((acc, i) => {
          const key = i.toLowerCase();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        this.ingredientData = Object.entries(ingredientCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }));
      },
      error: (err) => console.error('Load dashboard data error:', err),
    });
  }
}

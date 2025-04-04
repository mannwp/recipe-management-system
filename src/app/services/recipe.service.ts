import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Recipe } from '../models/recipe';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private baseUrl = 'http://localhost:3000/recipes';

  constructor(private http: HttpClient) {}

  getRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.baseUrl);
  }

  getRecipeById(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.baseUrl}/${id}`);
  }

  addRecipe(recipe: Recipe): Observable<Recipe> {
    return this.http.post<Recipe>(this.baseUrl, recipe);
  }

  updateRecipe(id: string, recipe: Recipe): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.baseUrl}/${id}`, recipe);
  }

  deleteRecipe(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getRecipesByIds(ids: string[]): Observable<Recipe[]> {
    if (ids.length === 0) return of([]); // Return empty array if no IDs
    // Use _id_in query for JSON Server to filter multiple IDs
    const query = `_id_in=${ids.join(',')}`;
    return this.http.get<Recipe[]>(`${this.baseUrl}?${query}`).pipe(
      map((recipes) => {
        console.log(`Fetched recipes for IDs ${ids}:`, recipes); // Debug log
        // Fallback: Filter client-side to ensure only requested IDs are returned
        return recipes.filter((recipe) => ids.includes(recipe.id));
      })
    );
  }
}

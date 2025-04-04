export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  preparationTime: number;
  category: string;
  createdAt: string;
}

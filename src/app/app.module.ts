import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';
import { RecipeDetailComponent } from './components/recipe-detail/recipe-detail.component';
import { RecipeFormComponent } from './components/recipe-form/recipe-form.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Already included, but ensures animations work

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    RecipeListComponent,
    RecipeDetailComponent,
    RecipeFormComponent,
    FavoritesComponent,
    DashboardComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    AppRoutingModule,
    NgxChartsModule,
    BrowserAnimationsModule, // Covers @angular/animations; no need to import @angular/cdk explicitly unless using specific CDK features
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

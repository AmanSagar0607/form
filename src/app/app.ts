import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div>
      <!-- <h1>Transfer Form</h1> -->
      <router-outlet></router-outlet>
    </div>
  `
})
export class App {
  title = 'forms';
}

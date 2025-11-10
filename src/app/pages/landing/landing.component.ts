import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit {
  backgroundImage = '/assets/images/Barios.jpg';
  
  constructor(private router: Router) {}
  ngOnInit(): void {}
  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}

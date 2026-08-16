import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../compartidos/header/header';
import { Sidebar } from '../../compartidos/sidebar/sidebar';

@Component({
  selector: 'app-layout-principal',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './layout-principal.html',
  styleUrl: './layout-principal.css',
})
export class LayoutPrincipal {}
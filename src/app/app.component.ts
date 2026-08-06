import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Start listening for messages in the background to show local notifications
    this.apiService.listenForNewMessagesAndNotify();
  }
}

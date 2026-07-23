import { Component, inject } from '@angular/core';
import { XAPI } from '@studiolxd/xapi/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  template: ` <p>xAPI endpoint: {{ xapi.status().endpoint }} — pending: {{ xapi.status().pending }}</p> `,
})
export class AppComponent {
  // Inject the client handle provided by provideXapi(); status is a signal.
  readonly xapi = inject(XAPI);
}

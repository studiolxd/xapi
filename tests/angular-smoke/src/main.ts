import { bootstrapApplication } from '@angular/platform-browser';
import { provideXapi } from '@studiolxd/xapi/angular';
import { AppComponent } from './app/app.component';

// Validates that @studiolxd/xapi/angular's functional provider compiles and wires
// up in a real Angular AOT/production build (no ng-packagr / decorators in the lib).
bootstrapApplication(AppComponent, {
  providers: [provideXapi({ endpoint: 'https://mock.lrs/xapi' })],
}).catch((err: unknown) => console.error(err));

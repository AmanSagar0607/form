import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { LocationService } from './shared/services/location.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LucideAngularModule } from 'lucide-angular';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Minus 
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom(
      LucideAngularModule.pick({
        ChevronDown,
        ChevronRight,
        Plus,
        Minus
      })
    ),
    LocationService
  ]
};

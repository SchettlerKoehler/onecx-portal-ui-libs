import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { AngularRemoteComponentsModule, SlotGroupComponent } from '@onecx/angular-remote-components'
import { ToastModule } from 'primeng/toast'
import { providePrimeNG } from 'primeng/config'
import { GlobalErrorComponent } from './components/error-component/global-error.component'
import { HeaderComponent } from './components/portal-header/header.component'
import { PortalViewportComponent } from './components/portal-viewport/portal-viewport.component'
import { SkeletonModule } from 'primeng/skeleton'
import { AppLoadingSpinnerComponent } from './components/app-loading-spinner/app-loading-spinner.component'
import { ShellSrcDirective } from './directives/src.directive'
import { TranslateModule } from '@ngx-translate/core'
import { TooltipModule } from 'primeng/tooltip'
import { MessageService } from 'primeng/api'
import { provideTranslationPathFromMeta } from '@onecx/angular-utils'

@NgModule({
  imports: [
    AngularRemoteComponentsModule,
    SlotGroupComponent,
    CommonModule,
    RouterModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    TranslateModule,
  ],
  declarations: [
    PortalViewportComponent,
    HeaderComponent,
    GlobalErrorComponent,
    AppLoadingSpinnerComponent,
    ShellSrcDirective,
  ],
  exports: [
    GlobalErrorComponent,
    HeaderComponent,
    PortalViewportComponent,
    ToastModule,
    TooltipModule,
    TranslateModule,
  ],
  providers: [
    providePrimeNG(), 
    { provide: MessageService, useClass: MessageService }, 
    provideTranslationPathFromMeta(import.meta.url, 'onecx-shell-core/assets/i18n/'),
  ],
})
export class ShellCoreModule {}

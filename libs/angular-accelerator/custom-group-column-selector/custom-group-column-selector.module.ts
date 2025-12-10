import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { PickListModule } from 'primeng/picklist'
import { SelectButtonModule } from 'primeng/selectbutton'
import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { TooltipModule } from 'primeng/tooltip'
import { CustomGroupColumnSelectorComponent } from './custom-group-column-selector.component'

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, PickListModule, SelectButtonModule, ButtonModule, DialogModule, TooltipModule],
  declarations: [CustomGroupColumnSelectorComponent],
  exports: [CustomGroupColumnSelectorComponent],
})
export class CustomGroupColumnSelectorModule {}

import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { SelectModule } from 'primeng/select'
import { FloatLabelModule } from 'primeng/floatlabel'
import { ColumnGroupSelectionComponent } from './column-group-selection.component'

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, SelectModule, FloatLabelModule],
  declarations: [ColumnGroupSelectionComponent],
  exports: [ColumnGroupSelectionComponent],
})
export class ColumnGroupSelectionModule {}

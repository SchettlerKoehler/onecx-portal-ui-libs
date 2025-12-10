import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { OcxContentComponent } from './content.component'

@NgModule({
  imports: [CommonModule],
  declarations: [OcxContentComponent],
  exports: [OcxContentComponent],
})
export class ContentModule {}

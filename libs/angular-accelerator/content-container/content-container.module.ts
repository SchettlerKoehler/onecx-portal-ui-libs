import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { OcxContentContainerComponent } from './content-container.component'

@NgModule({
  imports: [CommonModule],
  declarations: [OcxContentContainerComponent],
  exports: [OcxContentContainerComponent],
})
export class ContentContainerModule {}

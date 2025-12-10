import { Component, Input } from '@angular/core'

@Component({
  standalone: false,
  selector: 'ocx-content',
  templateUrl: './content.component.html',
})
export class OcxContentComponent {
  @Input() title = ''
  @Input() styleClass: string | undefined
}

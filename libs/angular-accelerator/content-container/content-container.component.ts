import { Component, Input } from '@angular/core'

@Component({
  standalone: false,
  selector: 'ocx-content-container',
  templateUrl: './content-container.component.html',
})
export class OcxContentContainerComponent {
  @Input() layout: 'vertical' | 'horizontal' = 'horizontal'
  @Input() breakpoint: 'sm' | 'md' | 'lg' | 'xl' = 'md'
  @Input() styleClass: string | undefined
}

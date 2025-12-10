import { Component, EventEmitter, Input, Output } from '@angular/core'
import { ButtonDialogConfig } from '@onecx/angular-accelerator/model'
import { DialogState } from '../../../services/portal-dialog.service'

@Component({
  standalone: false,
  selector: 'ocx-dialog-inline',
  templateUrl: './dialog-inline.component.html',
  styleUrls: ['./dialog-inline.component.scss'],
})
export class DialogInlineComponent {
  @Input() config: ButtonDialogConfig = {}

  @Output() resultEmitter = new EventEmitter()

  buttonClicked(event: DialogState<unknown>) {
    this.resultEmitter.emit(event.button)
  }
}

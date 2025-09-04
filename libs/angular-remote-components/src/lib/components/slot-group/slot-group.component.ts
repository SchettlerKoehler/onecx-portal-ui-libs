import { Component, computed, EventEmitter, input } from "@angular/core";
import { AngularRemoteComponentsModule } from "../../angular-remote-components.module";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'ocx-slot-group[name]',
  templateUrl: './slot-group.component.html',
  imports: [AngularRemoteComponentsModule, CommonModule]
})
export class SlotGroupComponent {

    name = input.required<string>();

    direction = input<'row' | 'row-reverse' | 'column' | 'column-reverse'>('row');

    slotStyles = input<{ [key: string]: any }>({})

    slotClasses = input<string | string[] | Set<string> | { [key: string]: any }>('')

    slotInputs = input<Record<string, unknown>>({})

    slotOutputs = input<Record<string, EventEmitter<any>>>({})

    groupStyles = input<{ [key: string]: any }>({})

    groupClasses = input<string | string[] | Set<string> | { [key: string]: any }>('')

    containerStyles = computed(() => {
      return {
        'flex-direction': this.direction(),
        ...this.groupStyles()
      };
    });

    // we need to control one input of the slots individually later
    slotInputsStart = computed(() => {
      return {
        ...this.slotInputs()
      };
    })

    slotInputsCenter = computed(() => {
      return {
        ...this.slotInputs()
      };
    })

    slotInputsEnd = computed(() => {
      return {
        ...this.slotInputs()
      };
    })
}